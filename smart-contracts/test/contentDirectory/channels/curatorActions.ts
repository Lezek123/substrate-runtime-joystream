import truffleAssert from 'truffle-assertions'
import _ from 'lodash'
import { ChannelOwnerType, channelMetadataUpdate, videoMetadataUpdate, LEAD_ADDRESS_INDEX } from '../../utils/consts'
import { getCurrentInstances } from '../../utils/contracts'
import { ChannelStorageInstance, ContentDirectoryInstance, VideoStorageInstance } from 'types/truffle-contracts'

export const testChannelCuratorActionsAllowed = (channelId: number, curatorId: number): void => {
  let contentDirectory: ContentDirectoryInstance
  let channelStorage: ChannelStorageInstance

  beforeEach(async () => {
    ;({ contentDirectory, channelStorage } = await getCurrentInstances())
  })

  describe(`as curator (ID: ${curatorId})`, () => {
    it('can deactivate and reactivate the channel', async () => {
      const reason = 'This channel breaks the rules'
      const deactivateRes = await contentDirectory.deactivateChannel(channelId, reason, curatorId)
      await truffleAssert.eventEmitted(
        deactivateRes,
        'ChannelDeactivated',
        (e: any) => e._id.eqn(channelId) && e._reason === reason
      )
      const deactivatedChannel = await channelStorage.getExistingChannel(channelId)
      assert.isFalse(deactivatedChannel.isActive)

      const activateRes = await contentDirectory.activateChannel(channelId, curatorId)
      await truffleAssert.eventEmitted(activateRes, 'ChannelReactivated', (e: any) => e._id.eqn(channelId))
      const activatedChannel = await channelStorage.getExistingChannel(channelId)
      assert.isTrue(activatedChannel.isActive)
    })

    it('can update the channel metadata', async () => {
      const res = await contentDirectory.updateChannelMetadataAsCurator(channelId, channelMetadataUpdate, curatorId)

      truffleAssert.eventEmitted(
        res,
        'ChannelMetadataUpdated',
        (e: any) => e._id.eqn(channelId) && _.isEqual(e._metadata, channelMetadataUpdate)
      )
    })

    it('can change the channel video limit', async () => {
      const newLimit = 100
      const res = await contentDirectory.updateChannelVideoLimit(channelId, newLimit, curatorId)

      truffleAssert.eventEmitted(
        res,
        'ChannelVideoLimitUpdated',
        (e: any) => e._id.eqn(channelId) && e._newLimit.eqn(newLimit)
      )

      assert.equal((await channelStorage.getExistingChannel(channelId)).videoLimit.toString(), newLimit.toString())
    })

    it('can initialize channel ownership transfer', async () => {
      const newOwnership = {
        ownershipType: ChannelOwnerType.Member,
        ownerId: 2,
      }
      await contentDirectory.transferChannelOwnershipAsCurator(channelId, newOwnership, curatorId)
    })
  })
}

export const testChannelCuratorActionsDisallowed = (channelId: number, curatorId: number, accounts: string[]): void => {
  let contentDirectory: ContentDirectoryInstance

  beforeEach(async () => {
    ;({ contentDirectory } = await getCurrentInstances())
  })

  describe(`as curator (ID: ${curatorId})`, () => {
    it('can NOT deactivate the channel', async () => {
      await truffleAssert.reverts(contentDirectory.deactivateChannel(channelId, 'Test', curatorId))
    })

    it('can NOT activate the channel', async () => {
      // Deactivate the channel as lead first
      await contentDirectory.deactivateChannel(channelId, 'Test', curatorId, { from: accounts[LEAD_ADDRESS_INDEX] })
      await truffleAssert.reverts(contentDirectory.activateChannel(channelId, curatorId))
    })

    it('can NOT update the channel metadata', async () => {
      await truffleAssert.reverts(
        contentDirectory.updateChannelMetadataAsCurator(channelId, channelMetadataUpdate, curatorId)
      )
    })

    it('can NOT change the channel video limit', async () => {
      const newLimit = 100
      await truffleAssert.reverts(contentDirectory.updateChannelVideoLimit(channelId, newLimit, curatorId))
    })

    it('can NOT initialize channel ownership transfer', async () => {
      const newOwnership = {
        ownershipType: ChannelOwnerType.Member,
        ownerId: 2,
      }
      await truffleAssert.reverts(
        contentDirectory.transferChannelOwnershipAsCurator(channelId, newOwnership, curatorId)
      )
    })
  })
}

export const testChannelCuratorVideoActionsAllowed = (videoId: number, curatorId: number): void => {
  let contentDirectory: ContentDirectoryInstance
  let videoStorage: VideoStorageInstance

  beforeEach(async () => {
    ;({ contentDirectory, videoStorage } = await getCurrentInstances())
  })

  describe(`as curator (ID: ${curatorId})`, () => {
    it('can update a video under the channel', async () => {
      const res = await contentDirectory.updateVideoMetadataAsCurator(videoId, videoMetadataUpdate, curatorId)
      truffleAssert.eventEmitted(
        res,
        'VideoMetadataUpdated',
        (e: any) => e._id.eqn(videoId) && _.isEqual(e._metadata, videoMetadataUpdate)
      )
    })

    it('can remove a video under the channel', async () => {
      const reason = 'Test'
      const res = await contentDirectory.removeVideoAsCurator(videoId, curatorId, reason)
      truffleAssert.eventEmitted(res, 'VideoRemovedByCurator', (e: any) => e._id.eqn(videoId) && e._reason === reason)
      await truffleAssert.reverts(videoStorage.getExistingVideo(videoId))
      assert.equal((await videoStorage.videoCountByChannelId(videoId)).toNumber(), 0)
    })
  })
}

export const testChannelCuratorVideoActionsDisallowed = (videoId: number, curatorId: number): void => {
  let contentDirectory: ContentDirectoryInstance

  beforeEach(async () => {
    ;({ contentDirectory } = await getCurrentInstances())
  })

  describe(`as curator (ID: ${curatorId})`, () => {
    it('can NOT update a video under the channel', async () => {
      await truffleAssert.reverts(
        contentDirectory.updateVideoMetadataAsCurator(videoId, videoMetadataUpdate, curatorId)
      )
    })

    it('can NOT remove a video under the channel', async () => {
      await truffleAssert.reverts(contentDirectory.removeVideoAsCurator(videoId, curatorId, 'Test'))
    })
  })
}
