import truffleAssert from 'truffle-assertions'
import _ from 'lodash'
import {
  MEMBER_1_ADDRESS_INDEX,
  MEMBER_2_ADDRESS_INDEX,
  CURATOR_1_ADDRESS_INDEX,
  ChannelOwnerType,
  channelMetadata,
  channelMetadataUpdate,
  videoMetadata,
  videoMetadataUpdate,
} from '../utils/consts'
import { ContentDirectory, getCurrentInstances, setDefaultContractCaller } from '../utils/contracts'
import { ChannelStorageInstance, ContentDirectoryInstance, VideoStorageInstance } from 'types/truffle-contracts'

// TODO: Import events types (but need to deal with BN inside struct type incompatibility)

const memberChannelsTests = (accounts: string[]): void => {
  let contentDirectory: ContentDirectoryInstance
  let channelStorage: ChannelStorageInstance
  let videoStorage: VideoStorageInstance

  beforeEach(async () => {
    ;({ contentDirectory, channelStorage, videoStorage } = await getCurrentInstances())
  })

  describe('Channel creation', () => {
    it('should allow the member to create a channel', async () => {
      const ownership = { ownershipType: ChannelOwnerType.Member, ownerId: 1 }
      const res = await contentDirectory.createChannel(ownership, 'test', channelMetadata, {
        from: accounts[MEMBER_1_ADDRESS_INDEX],
      })

      assert.equal((await channelStorage.nextChannelId()).toNumber(), 2)
      assert.equal((await channelStorage.channelCountByOwnership(ChannelOwnerType.Member, 1)).toNumber(), 1)
      truffleAssert.eventEmitted(
        res,
        'ChannelCreated',
        (e: any) => e._id.eqn(1) && _.isEqual(e._metadata, channelMetadata)
      )

      await channelStorage.getExistingChannel(1) // Just makes sure it doesn't fail
    })

    it('should NOT allow the member to create a channel for other member', async () => {
      const ownership = { ownershipType: ChannelOwnerType.Member, ownerId: 2 }
      await truffleAssert.reverts(
        contentDirectory.createChannel(ownership, 'test', channelMetadata, {
          from: accounts[MEMBER_1_ADDRESS_INDEX],
        })
      )
    })
  })

  describe('Channel management', () => {
    // Each of those tests will need a new channel instance
    beforeEach(async () => {
      const ownership = { ownershipType: ChannelOwnerType.Member, ownerId: 1 }
      await contentDirectory.createChannel(ownership, 'test', channelMetadata, {
        from: accounts[MEMBER_1_ADDRESS_INDEX],
      })
    })

    describe('Channel owner', () => {
      before(() => {
        // Set default address for all tests under this "describe"
        setDefaultContractCaller(accounts[MEMBER_1_ADDRESS_INDEX])
      })

      it('should be able to update the channel', async () => {
        const res = await contentDirectory.updateChannelMetadata(1, channelMetadataUpdate)

        truffleAssert.eventEmitted(
          res,
          'ChannelMetadataUpdated',
          (e: any) => e._id.eqn(1) && _.isEqual(e._metadata, channelMetadataUpdate)
        )
      })

      it('should be able to initialize channel ownership transfer', async () => {
        const newOwnership = {
          ownershipType: ChannelOwnerType.Member,
          ownerId: 2,
        }

        const res = await contentDirectory.transferChannelOwnership(1, newOwnership)

        // Assert that the ownership didn't change yet
        truffleAssert.eventNotEmitted(res, 'ChannelOwnershipUpdated')
        assert.equal((await channelStorage.getExistingChannel(1)).ownership.ownerId.toString(), '1')
      })

      it('should be able to remove the channel', async () => {
        await contentDirectory.removeChannel(1)
        await truffleAssert.reverts(channelStorage.getExistingChannel(1))
      })

      it('should be able to publish a video under the channel', async () => {
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

      describe('Deactivated channel', () => {
        // Each of those tests expect a channel to be deactivated
        beforeEach(async () => {
          await contentDirectory.deactivateChannel(1, 'Test', 1, {
            from: accounts[CURATOR_1_ADDRESS_INDEX],
          })
        })

        it('should NOT be able to reactivate the channel once deactivated', async () => {
          // Try with both _curatorId = 0 and existing curator id (1)
          for (const curatorId of [0, 1]) {
            await truffleAssert.reverts(contentDirectory.activateChannel(1, curatorId))
          }
        })

        it('should NOT be able to publish a video', async () => {
          await truffleAssert.reverts(contentDirectory.addVideo(1, videoMetadata))
        })
      })

      describe('Managing videos', () => {
        // Each of those tests expect an existing video
        beforeEach(async () => {
          await contentDirectory.addVideo(1, videoMetadata)
        })

        it('should NOT be able to remove the channel if it has a video', async () => {
          await truffleAssert.reverts(contentDirectory.removeChannel(1))
        })

        it('should be able to update video under the channel', async () => {
          const res = await contentDirectory.updateVideoMetadata(1, videoMetadataUpdate)
          truffleAssert.eventEmitted(
            res,
            'VideoMetadataUpdated',
            (e: any) => e._id.eqn(1) && _.isEqual(e._metadata, videoMetadataUpdate)
          )
        })

        it('should be able to remove video under the channel', async () => {
          const res = await contentDirectory.removeVideo(1)
          truffleAssert.eventEmitted(res, 'VideoRemoved', (e: any) => e._id.eqn(1))
          await truffleAssert.reverts(videoStorage.getExistingVideo(1))
          assert.equal((await videoStorage.videoCountByChannelId(1)).toNumber(), 0)
        })
      })
    })

    describe('Other member', () => {
      before(() => {
        // Set default address for all tests under this "describe"
        setDefaultContractCaller(accounts[MEMBER_2_ADDRESS_INDEX])
      })

      it('should NOT be able to update the channel as owner', async () => {
        await truffleAssert.reverts(contentDirectory.updateChannelMetadata(1, channelMetadataUpdate))
      })

      it('should NOT be able to update the channel as curator', async () => {
        // Try with both _curatorId = 0 and existing curator id (1)
        for (const curatorId of [0, 1]) {
          await truffleAssert.reverts(
            contentDirectory.updateChannelMetadataAsCurator(1, channelMetadataUpdate, curatorId)
          )
        }
      })

      it('should NOT be able to initialize channel ownership transfer', async () => {
        const newOwnership = {
          ownershipType: ChannelOwnerType.Member,
          ownerId: 2,
        }
        await truffleAssert.reverts(contentDirectory.transferChannelOwnership(1, newOwnership))
      })

      it('should be able to accept ownership transfer if is a reciever', async () => {
        // Create a pending transfer as owner first
        const newOwnership = {
          ownershipType: ChannelOwnerType.Member,
          ownerId: 2,
        }
        await contentDirectory.transferChannelOwnership(1, newOwnership, {
          from: accounts[MEMBER_1_ADDRESS_INDEX],
        })

        // Accept transfer as member2
        const acceptRes = await contentDirectory.acceptChannelOwnershipTransfer(1)

        // Assert that event was emitted and the ownership has changed
        truffleAssert.eventEmitted(acceptRes, 'ChannelOwnershipUpdated', (e: any) => {
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

      it('should NOT be able to accept ownership transfer if is NOT a reciever', async () => {
        // Create a pending transfer as owner first
        const newOwnership = {
          ownershipType: ChannelOwnerType.Member,
          ownerId: 1,
        }
        await contentDirectory.transferChannelOwnership(1, newOwnership, {
          from: accounts[MEMBER_1_ADDRESS_INDEX],
        })

        await truffleAssert.reverts(contentDirectory.acceptChannelOwnershipTransfer(1))
      })

      it('should NOT be able to remove the channel', async () => {
        await truffleAssert.reverts(contentDirectory.removeChannel(1))
      })

      it('should NOT be able to publish video under the channel', async () => {
        await truffleAssert.reverts(contentDirectory.addVideo(1, videoMetadata))
      })

      describe('Managing videos', () => {
        // Each of those tests expect an existing video
        beforeEach(async () => {
          await contentDirectory.addVideo(1, videoMetadata, {
            from: accounts[MEMBER_1_ADDRESS_INDEX],
          })
        })

        it('should NOT be able to update video under the channel', async () => {
          await truffleAssert.reverts(contentDirectory.updateVideoMetadata(1, videoMetadataUpdate))
        })

        it('should NOT be able to remove video under the channel', async () => {
          await truffleAssert.reverts(contentDirectory.removeVideo(1))
        })
      })
    })

    // Curator success cases
    describe('Curator', () => {
      before(() => {
        // Set default address for all tests under this "describe"
        setDefaultContractCaller(accounts[CURATOR_1_ADDRESS_INDEX])
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
        const res = await contentDirectory.updateChannelMetadataAsCurator(1, channelMetadataUpdate, 1)

        truffleAssert.eventEmitted(
          res,
          'ChannelMetadataUpdated',
          (e: any) => e._id.eqn(1) && _.isEqual(e._metadata, channelMetadataUpdate)
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

      // This may be a subject to change, but currently it's prohibited
      // due to possibility of introducing reward accounts etc.
      it('should NOT be able to initialize channel ownership transfer', async () => {
        const newOwnership = {
          ownershipType: ChannelOwnerType.Member,
          ownerId: 2,
        }
        await truffleAssert.reverts(contentDirectory.transferChannelOwnership(1, newOwnership))
      })

      describe('Managing videos', () => {
        // Each of those tests expect an existing video
        beforeEach(async () => {
          await contentDirectory.addVideo(1, videoMetadata, {
            from: accounts[MEMBER_1_ADDRESS_INDEX],
          })
        })

        it('should be able to update video under the channel', async () => {
          const res = await contentDirectory.updateVideoMetadataAsCurator(1, videoMetadataUpdate, 1)
          truffleAssert.eventEmitted(
            res,
            'VideoMetadataUpdated',
            (e: any) => e._id.eqn(1) && _.isEqual(e._metadata, videoMetadataUpdate)
          )
        })

        it('should be able to remove video under the channel', async () => {
          const reason = 'Test'
          const res = await contentDirectory.removeVideoAsCurator(1, 1, reason)
          truffleAssert.eventEmitted(res, 'VideoRemovedByCurator', (e: any) => e._id.eqn(1) && e._reason === reason)
          await truffleAssert.reverts(videoStorage.getExistingVideo(1))
          assert.equal((await videoStorage.videoCountByChannelId(1)).toNumber(), 0)
        })
      })
    })
  })
}

export default memberChannelsTests
