import truffleAssert from 'truffle-assertions'
import _ from 'lodash'
import {
  RUNTIME_ADDRESS_INDEX,
  MEMBER_1_ADDRESS_INDEX,
  MEMBER_2_ADDRESS_INDEX,
  CURATOR_1_ADDRESS_INDEX,
} from './utils/consts'
import { redeployContracts, ContentDirectory } from './utils/deployment'
import {
  ChannelStorageInstance,
  ContentDirectoryInstance,
  ContentWorkingGroupBridgeInstance,
  MembershipBridgeInstance,
  VideoStorageInstance,
} from '../types/truffle-contracts'

// TODO: Import events types (but need to deal with BN inside struct type incompatibility)

// Mimic the Solidity enum:
const ChannelOwnerType = {
  Address: 0,
  Member: 1,
  CuratorGroup: 2,
} as const

contract('ContentDirectory', (accounts) => {
  let membershipBridge: MembershipBridgeInstance
  let contentDirectory: ContentDirectoryInstance
  let channelStorage: ChannelStorageInstance
  let contentWorkingGroupBridge: ContentWorkingGroupBridgeInstance
  let videoStorage: VideoStorageInstance

  beforeEach(async () => {
    ;({
      membershipBridge,
      contentDirectory,
      channelStorage,
      contentWorkingGroupBridge,
      videoStorage,
    } = await redeployContracts(accounts))
    // Membership bridge - initialize the members
    await membershipBridge.setMemberAddress(1, accounts[MEMBER_1_ADDRESS_INDEX], {
      from: accounts[RUNTIME_ADDRESS_INDEX],
    })
    await membershipBridge.setMemberAddress(2, accounts[MEMBER_2_ADDRESS_INDEX], {
      from: accounts[RUNTIME_ADDRESS_INDEX],
    })
    // ContentWorkingGroup bridge - initialize curator
    await contentWorkingGroupBridge.setCuratorAddress(1, accounts[CURATOR_1_ADDRESS_INDEX], {
      from: accounts[RUNTIME_ADDRESS_INDEX],
    })
  })

  describe('Channel creation', () => {
    it('should allow the member to create a channel', async () => {
      const metadata = [
        ['title', 'Awesome channel'],
        ['description', 'This is an awesome channel'],
      ]
      const ownership = { ownershipType: ChannelOwnerType.Member, ownerId: 1 }
      const res = await contentDirectory.createChannel(ownership, metadata, {
        from: accounts[MEMBER_1_ADDRESS_INDEX],
      })

      assert.equal((await channelStorage.nextChannelId()).toNumber(), 2)
      assert.equal((await channelStorage.channelCountByOwnership(ChannelOwnerType.Member, 1)).toNumber(), 1)
      truffleAssert.eventEmitted(res, 'ChannelCreated', (e: any) => e._id.eqn(1) && _.isEqual(e._metadata, metadata))

      await channelStorage.getExistingChannel(1) // Just makes sure it doesn't fail
    })
  })

  describe('Member channels', () => {
    // Each of those tests will need a new channel instance
    beforeEach(async () => {
      const metadata = [
        ['title', 'Awesome channel'],
        ['description', 'This is an awesome channel'],
      ]
      const ownership = { ownershipType: ChannelOwnerType.Member, ownerId: 1 }
      await contentDirectory.createChannel(ownership, metadata, {
        from: accounts[MEMBER_1_ADDRESS_INDEX],
      })
    })

    describe('Channel owner', () => {
      before(() => {
        // Set default address for all tests under this "describe"
        ;(ContentDirectory as any).defaults({ from: accounts[MEMBER_1_ADDRESS_INDEX] })
      })

      it('should be able to update the channel', async () => {
        const updatedMetadata = [['title', 'Awesome updated channel']]
        const res = await contentDirectory.updateChannelMetadata(1, updatedMetadata)

        truffleAssert.eventEmitted(
          res,
          'ChannelMetadataUpdated',
          (e: any) => e._id.eqn(1) && _.isEqual(e._metadata, updatedMetadata)
        )
      })

      it('should be able to transfer channel ownership', async () => {
        // FIXME: Prevent transferring ownership to ANY member?
        const newOwnership = {
          ownershipType: ChannelOwnerType.Member,
          ownerId: 2,
        }

        const res = await contentDirectory.updateChannelOwnership(1, newOwnership)

        truffleAssert.eventEmitted(res, 'ChannelOwnershipUpdated', (e: any) => {
          return (
            e._id.eqn(1) &&
            e._ownership.ownershipType === newOwnership.ownershipType.toString() &&
            e._ownership.ownerId === newOwnership.ownerId.toString()
          )
        })

        assert.equal(
          (await channelStorage.getExistingChannel(1)).ownership.ownerId.toString(),
          newOwnership.ownerId.toString()
        )
      })

      it('should be able to remove the channel', async () => {
        await contentDirectory.removeChannel(1)
        await truffleAssert.reverts(channelStorage.getExistingChannel(1))
      })

      it('should be able to publish a video under the channel', async () => {
        const videoMetadata = [
          ['title', 'Example video'],
          ['description', 'This is an example video'],
        ]
        const res = await contentDirectory.addVideo(1, videoMetadata)
        truffleAssert.eventEmitted(
          res,
          'VideoAdded',
          (e: any) => e._id.eqn(1) && e._channelId.eqn(1) && _.isEqual(e._metadata, videoMetadata)
        )

        await videoStorage.getExistingVideo(1) // Just make sure no error is thrown
        assert.equal((await videoStorage.nextVideoId()).toNumber(), 2)
        assert.equal((await videoStorage.videoCountByChannelId(1)).toNumber(), 1)
      })

      it('should NOT be able to update the channel video limit', async () => {
        // Try with both _curatorId = 0 and existing curator id (1)
        for (const curatorId of [0, 1]) {
          await truffleAssert.reverts(contentDirectory.updateChannelVideoLimit(1, 100, curatorId))
        }
      })

      it('should NOT be able to deactivate the channel', async () => {
        // Try with both _curatorId = 0 and existing curator id (1)
        for (const curatorId of [0, 1]) {
          await truffleAssert.reverts(contentDirectory.deactivateChannel(1, 'Malicous deactivation!', curatorId))
        }
      })

      it('should NOT be able to reactivate the channel once deactivated', async () => {
        // Deactivate the channel as curator first
        await contentDirectory.deactivateChannel(1, 'Test', 1, {
          from: accounts[CURATOR_1_ADDRESS_INDEX],
        })
        // Try with both _curatorId = 0 and existing curator id (1)
        for (const curatorId of [0, 1]) {
          await truffleAssert.reverts(contentDirectory.activateChannel(1, curatorId))
        }
      })
    })

    describe('Other member', () => {
      before(() => {
        // Set default address for all tests under this "describe"
        ;(ContentDirectory as any).defaults({ from: accounts[MEMBER_2_ADDRESS_INDEX] })
      })

      it('should NOT be able to update the channel as owner', async () => {
        const updatedMetadata = [['title', 'Awesome updated channel']]
        await truffleAssert.reverts(contentDirectory.updateChannelMetadata(1, updatedMetadata))
      })

      it('should NOT be able to update the channel as curator', async () => {
        // Try with both _curatorId = 0 and existing curator id (1)
        const updatedMetadata = [['title', 'Maliciously updated channel']]
        for (const curatorId of [0, 1]) {
          await truffleAssert.reverts(contentDirectory.updateChannelMetadataAsCurator(1, updatedMetadata, curatorId))
        }
      })

      it('should NOT be able to transfer channel ownership', async () => {
        const newOwnership = {
          ownershipType: ChannelOwnerType.Member,
          ownerId: 1,
        }
        await truffleAssert.reverts(contentDirectory.updateChannelOwnership(1, newOwnership))
      })

      it('should NOT be able to remove the channel', async () => {
        await truffleAssert.reverts(contentDirectory.removeChannel(1))
      })

      it('should NOT be able to publish video under the channel', async () => {
        const videoMetadata = [
          ['title', 'Example video'],
          ['description', 'This is an example video'],
        ]
        await truffleAssert.reverts(contentDirectory.addVideo(1, videoMetadata))
      })
    })

    // Curator success cases
    describe('Curator', () => {
      before(() => {
        // Set default address for all tests under this "describe"
        ;(ContentDirectory as any).defaults({ from: accounts[CURATOR_1_ADDRESS_INDEX] })
      })

      it('should be able to deactivate and reactivate the channel', async () => {
        const reason = 'This channel breaks the rules'
        const deactivateRes = await contentDirectory.deactivateChannel(1, reason, 1)
        await truffleAssert.eventEmitted(
          deactivateRes,
          'ChannelDeactivated',
          (e: any) => e._id.eqn(1) && e._reason === reason
        )
        const deactivatedChannel = await channelStorage.getExistingChannel(1)
        assert.isFalse(deactivatedChannel.isActive)

        const activateRes = await contentDirectory.activateChannel(1, 1)
        await truffleAssert.eventEmitted(activateRes, 'ChannelReactivated', (e: any) => e._id.eqn(1))
        const activatedChannel = await channelStorage.getExistingChannel(1)
        assert.isTrue(activatedChannel.isActive)
      })

      it('should be able to update the channel metadata', async () => {
        const updatedMetadata = [['title', 'Awesome updated channel']]
        const res = await contentDirectory.updateChannelMetadataAsCurator(1, updatedMetadata, 1)

        truffleAssert.eventEmitted(
          res,
          'ChannelMetadataUpdated',
          (e: any) => e._id.eqn(1) && _.isEqual(e._metadata, updatedMetadata)
        )
      })

      it('should be able to change the channel video limit', async () => {
        const newLimit = 100
        const res = await contentDirectory.updateChannelVideoLimit(1, newLimit, 1)

        truffleAssert.eventEmitted(
          res,
          'ChannelVideoLimitUpdated',
          (e: any) => e._id.eqn(1) && e._newLimit.eqn(newLimit)
        )

        assert.equal((await channelStorage.getExistingChannel(1)).videoLimit.toString(), newLimit.toString())
      })
    })
  })
})
