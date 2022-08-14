/*
eslint-disable @typescript-eslint/naming-convention
*/
import { DatabaseManager, EventContext, StoreContext } from '@joystream/hydra-common'
import { ChannelMetadata, ChannelModeratorRemarked, ChannelOwnerRemarked } from '@joystream/metadata-protobuf'
import { BaseModel } from '@joystream/warthog'
import {
  Channel,
  Collaborator,
  ContentActorCurator,
  ContentActorMember,
  CuratorGroup,
  Membership,
  MetaprotocolTransactionErrored,
  MetaprotocolTransactionPending,
  MetaprotocolTransactionStatusEvent,
  MetaprotocolTransactionSuccessful,
  StorageBag,
  StorageDataObject,
  ChannelAssetsDeletedByModeratorEvent,
  ChannelDeletedByModeratorEvent,
} from 'query-node/dist/model'
import { In } from 'typeorm'
import { Content } from '../../generated/types'
import {
  deserializeMetadata,
  genericEventFields,
  inconsistentState,
  invalidMetadata,
  logger,
  updateMetaprotocolTransactionStatus,
} from '../common'
import { getAllManagers } from '../derivedPropertiesManager/applications'
import {
  processBanOrUnbanMemberFromChannelMessage,
  processModerateCommentMessage,
  processPinOrUnpinCommentMessage,
  processVideoReactionsPreferenceMessage,
} from './commentAndReaction'
import {
  convertChannelOwnerToMemberOrCuratorGroup,
  convertContentActor,
  processChannelMetadata,
  unsetAssetRelations,
  mapAgentPermission,
} from './utils'
import { DataObjectId } from '@joystream/types/primitives'
import { BTreeMap, BTreeSet, u64 } from '@polkadot/types'
// Joystream types
import { PalletContentChannelActionPermission } from '@polkadot/types/lookup'

export async function content_ChannelCreated(ctx: EventContext & StoreContext): Promise<void> {
  const { store, event } = ctx
  // read event data
  const [channelId, { owner, dataObjects }, channelCreationParameters, rewardAccount] = new Content.ChannelCreatedEvent(
    event
  ).params

  // create entity
  const channel = new Channel({
    // main data
    id: channelId.toString(),
    isCensored: false,
    videos: [],
    createdInBlock: event.blockNumber,
    activeVideosCounter: 0,

    // prepare channel owner (handles fields `ownerMember` and `ownerCuratorGroup`)
    ...(await convertChannelOwnerToMemberOrCuratorGroup(store, owner)),

    rewardAccount: rewardAccount.toString(),
  })

  // deserialize & process metadata
  if (channelCreationParameters.meta.isSome) {
    const storageBag = await store.get(StorageBag, { where: { id: `dynamic:channel:${channelId.toString()}` } })

    if (!storageBag) {
      inconsistentState(`storageBag for channel ${channelId} does not exist`)
    }

    const storageDataObjectParams = {
      storageBagOrId: storageBag,
      objectCreationList: channelCreationParameters.assets.unwrapOr(undefined)?.objectCreationList || [],
      stateBloatBond: channelCreationParameters.expectedDataObjectStateBloatBond,
      objectIds: [...dataObjects],
    }

    const metadata = deserializeMetadata(ChannelMetadata, channelCreationParameters.meta.unwrap()) || {}
    await processChannelMetadata(ctx, channel, metadata, storageDataObjectParams)
  }

  // save entity
  await store.save<Channel>(channel)

  // update channel permissions
  await updateChannelAgentsPermissions(store, channel, channelCreationParameters.collaborators)

  // emit log event
  logger.info('Channel has been created', { id: channel.id })
}

export async function content_ChannelUpdated(ctx: EventContext & StoreContext): Promise<void> {
  const { store, event } = ctx
  // read event data
  const [, channelId, channelUpdateParameters, newDataObjects] = new Content.ChannelUpdatedEvent(event).params

  // load channel
  const channel = await store.get(Channel, {
    where: { id: channelId.toString() },
    relations: ['category'],
  })

  // ensure channel exists
  if (!channel) {
    return inconsistentState('Non-existing channel update requested', channelId)
  }

  // prepare changed metadata
  const newMetadataBytes = channelUpdateParameters.newMeta.unwrapOr(null)

  //  update metadata if it was changed
  if (newMetadataBytes) {
    const storageBag = await store.get(StorageBag, { where: { id: `dynamic:channel:${channelId.toString()}` } })

    if (!storageBag) {
      inconsistentState(`storageBag for channel ${channelId} does not exist`)
    }

    const storageDataObjectParams = {
      storageBagOrId: storageBag,
      objectCreationList: channelUpdateParameters.assetsToUpload.unwrapOr(undefined)?.objectCreationList || [],
      stateBloatBond: channelUpdateParameters.expectedDataObjectStateBloatBond,
      objectIds: [...newDataObjects],
    }

    const newMetadata = deserializeMetadata(ChannelMetadata, newMetadataBytes) || {}
    await processChannelMetadata(ctx, channel, newMetadata, storageDataObjectParams)
  }

  // transfer video active counter value to new category
  await getAllManagers(store).channels.onMainEntityUpdate(channel)

  // save channel
  await store.save<Channel>(channel)

  // update channel permissions
  if (channelUpdateParameters.collaborators.isSome) {
    await updateChannelAgentsPermissions(store, channel, channelUpdateParameters.collaborators.unwrap())
  }

  // emit log event
  logger.info('Channel has been updated', { id: channel.id })
}

export async function content_ChannelAssetsRemoved({ store, event }: EventContext & StoreContext): Promise<void> {
  const [, , dataObjectIds] = new Content.ChannelAssetsRemovedEvent(event).params

  await deleteChannelAssets(store, [...dataObjectIds])
}

export async function content_ChannelAssetsDeletedByModerator({
  store,
  event,
}: EventContext & StoreContext): Promise<void> {
  const [actor, channelId, dataObjectIds, rationale] = new Content.ChannelAssetsDeletedByModeratorEvent(event).params

  await deleteChannelAssets(store, [...dataObjectIds])

  // common event processing - second

  const channelAssetsDeletedByModeratorEvent = new ChannelAssetsDeletedByModeratorEvent({
    ...genericEventFields(event),
    actor: await convertContentActor(store, actor),
    channelId: channelId.toNumber(),
    assetIds: Array.from(dataObjectIds).map((item) => Number(item)),
    rationale: rationale.toHuman() as string,
  })

  await store.save<ChannelAssetsDeletedByModeratorEvent>(channelAssetsDeletedByModeratorEvent)
}

async function deleteChannelAssets(store: DatabaseManager, dataObjectIds: DataObjectId[]) {
  const assets = await store.getMany(StorageDataObject, {
    where: {
      id: In(Array.from(dataObjectIds).map((item) => item.toString())),
    },
  })

  for (const asset of assets) {
    await unsetAssetRelations(store, asset)
  }

  logger.info('Channel assets have been removed', { ids: dataObjectIds })
}

export async function content_ChannelDeleted({ store, event }: EventContext & StoreContext): Promise<void> {
  const [, channelId] = new Content.ChannelDeletedEvent(event).params

  await store.remove<Channel>(new Channel({ id: channelId.toString() }))
}

export async function content_ChannelDeletedByModerator({ store, event }: EventContext & StoreContext): Promise<void> {
  const [actor, channelId, rationale] = new Content.ChannelDeletedByModeratorEvent(event).params
  await store.remove<Channel>(new Channel({ id: channelId.toString() }))

  // common event processing - second

  const channelDeletedByModeratorEvent = new ChannelDeletedByModeratorEvent({
    ...genericEventFields(event),

    rationale: rationale.toHuman() as string,
    actor: await convertContentActor(store, actor),
    channelId: channelId.toNumber(),
  })

  await store.save<ChannelDeletedByModeratorEvent>(channelDeletedByModeratorEvent)
}

export async function content_ChannelOwnerRemarked(ctx: EventContext & StoreContext): Promise<void> {
  const { event, store } = ctx
  const [channelId, message] = new Content.ChannelOwnerRemarkedEvent(ctx.event).params

  // load channel
  const channel = await store.get(Channel, {
    where: { id: channelId.toString() },
    relations: ['ownerMember', 'ownerCuratorGroup'],
  })

  // ensure channel exists
  if (!channel) {
    return inconsistentState('Owner Remarked for Non-existing channel', channelId)
  }

  const getContentActor = (ownerMember?: Membership, ownerCuratorGroup?: CuratorGroup) => {
    if (ownerMember) {
      const actor = new ContentActorMember()
      actor.memberId = ownerMember.id
      return actor
    }

    if (ownerCuratorGroup) {
      const actor = new ContentActorCurator()
      actor.curatorId = ownerCuratorGroup.id
      return actor
    }

    return inconsistentState('Unknown content actor', { ownerMember, ownerCuratorGroup })
  }

  const genericFields = genericEventFields(event)
  // unique identifier for metaprotocol tx
  const { id: metaprotocolTxIdentifier } = genericFields as BaseModel

  const metaprotocolTxStatusEvent = new MetaprotocolTransactionStatusEvent({
    ...genericFields,
    status: new MetaprotocolTransactionPending(),
  })

  // save metaprotocol tx status event
  await store.save<MetaprotocolTransactionStatusEvent>(metaprotocolTxStatusEvent)

  try {
    const decodedMessage = ChannelOwnerRemarked.decode(message.toU8a(true))
    const messageType = decodedMessage.channelOwnerRemarked
    const contentActor = getContentActor(channel.ownerMember, channel.ownerCuratorGroup)

    // update MetaprotocolTransactionStatusEvent
    const statusSuccessful = new MetaprotocolTransactionSuccessful()

    if (!messageType) {
      invalidMetadata('Unsupported message type in channel_owner_remark action')
    } else if (messageType === 'pinOrUnpinComment') {
      await processPinOrUnpinCommentMessage(ctx, contentActor, channelId, decodedMessage.pinOrUnpinComment!)
    } else if (messageType === 'banOrUnbanMemberFromChannel') {
      await processBanOrUnbanMemberFromChannelMessage(
        ctx,
        contentActor,
        channelId,
        decodedMessage.banOrUnbanMemberFromChannel!
      )
    } else if (messageType === 'videoReactionsPreference') {
      await processVideoReactionsPreferenceMessage(
        ctx,
        contentActor,
        channelId,
        decodedMessage.videoReactionsPreference!
      )
    } else if (messageType === 'moderateComment') {
      const comment = await processModerateCommentMessage(ctx, contentActor, channelId, decodedMessage.moderateComment!)
      statusSuccessful.commentModeratedId = comment.id
    }

    await updateMetaprotocolTransactionStatus(store, metaprotocolTxIdentifier, statusSuccessful)
  } catch (e) {
    // update MetaprotocolTransactionStatusEvent
    const statusErrored = new MetaprotocolTransactionErrored()
    await updateMetaprotocolTransactionStatus(store, metaprotocolTxIdentifier, statusErrored, e)
  }
}

export async function content_ChannelAgentRemarked(ctx: EventContext & StoreContext): Promise<void> {
  const { event, store } = ctx
  const [moderator, channelId, message] = new Content.ChannelAgentRemarkedEvent(ctx.event).params

  const genericFields = genericEventFields(event)
  // unique identifier for metaprotocol tx
  const { id: metaprotocolTxIdentifier } = genericFields as BaseModel

  const metaprotocolTxStatusEvent = new MetaprotocolTransactionStatusEvent({
    ...genericFields,
    status: new MetaprotocolTransactionPending(),
  })

  // save metaprotocol tx status event
  await store.save<MetaprotocolTransactionStatusEvent>(metaprotocolTxStatusEvent)

  try {
    const decodedMessage = ChannelModeratorRemarked.decode(message.toU8a(true))
    const messageType = decodedMessage.channelModeratorRemarked
    const contentActor = await convertContentActor(ctx.store, moderator)

    // update MetaprotocolTransactionStatusEvent
    const statusSuccessful = new MetaprotocolTransactionSuccessful()

    if (!messageType) {
      invalidMetadata('Unsupported message type in channel_moderator_remark action')
    } else if (messageType === 'moderateComment') {
      const comment = await processModerateCommentMessage(ctx, contentActor, channelId, decodedMessage.moderateComment!)
      statusSuccessful.commentModeratedId = comment.id
    }

    await updateMetaprotocolTransactionStatus(store, metaprotocolTxIdentifier, statusSuccessful)
  } catch (e) {
    // update MetaprotocolTransactionStatusEvent
    const statusErrored = new MetaprotocolTransactionErrored()
    await updateMetaprotocolTransactionStatus(store, metaprotocolTxIdentifier, statusErrored, e)
  }
}

export async function ChannelTransferAccepted({ store, event }: EventContext & StoreContext): Promise<void> {
  const [channelId, commitmentParams] = new Content.ChannelTransferAcceptedEvent(event).params

  const channel = new Channel({ id: channelId.toString() })

  // update channel permissions
  await updateChannelAgentsPermissions(store, channel, commitmentParams.newCollaborators)
}

async function updateChannelAgentsPermissions(
  store: DatabaseManager,
  channel: Channel,
  collaboratorsPermissions: BTreeMap<u64, BTreeSet<PalletContentChannelActionPermission>>
) {
  // safest way to update permission is to delete existing and creating new ones

  // delete existing agent permissions
  const collaborators = await store.getMany(Collaborator, {
    where: { channel: { id: channel.id.toString() } },
  })
  for (const agentPermissions of collaborators) {
    await store.remove(agentPermissions)
  }

  // create new records for privledged members
  for (const [memberId, permissions] of Array.from(collaboratorsPermissions)) {
    const permissionsArray = Array.from(permissions)
    if (!permissionsArray.length) {
      return
    }

    const collaborator = new Collaborator({
      channel: new Channel({ id: channel.id.toString() }),
      member: new Membership({ id: memberId.toString() }),
      permissions: Array.from(permissions).map(mapAgentPermission),
    })

    await store.save(collaborator)
  }
}
