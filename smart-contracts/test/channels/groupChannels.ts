import truffleAssert from 'truffle-assertions'
import _ from 'lodash'
import {
  MEMBER_1_ADDRESS_INDEX,
  CURATOR_1_ADDRESS_INDEX,
  ChannelOwnerType,
  channelMetadata,
  channelMetadataUpdate,
  videoMetadata,
  videoMetadataUpdate,
  LEAD_ADDRESS_INDEX,
} from '../utils/consts'
import { ContentDirectory, getCurrentInstances, setDefaultContractCaller } from '../utils/contracts'
import { ContentDirectoryInstance } from '../../types/truffle-contracts'

// TODO: Import events types (but need to deal with BN inside struct type incompatibility)
// TODO: Create custom assertions like "assertChannelRemoved" based on memberChannels tests and use them here?

const groupChannelsTests = (accounts: string[]): void => {
  let contentDirectory: ContentDirectoryInstance

  beforeEach(async () => {
    ;({ contentDirectory } = await getCurrentInstances())
    // Create a group and add a curator
    await contentDirectory.createCuratorGroup([false, false, false, false], {
      from: accounts[LEAD_ADDRESS_INDEX],
    })
    await contentDirectory.addCuratorToGroup(1, 1, {
      from: accounts[LEAD_ADDRESS_INDEX],
    })
  })

  describe('Channel creation', () => {
    it('should allow the lead to create a channel', async () => {
      const ownership = { ownershipType: ChannelOwnerType.CuratorGroup, ownerId: 1 }
      await contentDirectory.createChannel(ownership, 'test', channelMetadata, {
        from: accounts[LEAD_ADDRESS_INDEX],
      })
    })

    it('should NOT allow the member to create a channel', async () => {
      const ownership = { ownershipType: ChannelOwnerType.CuratorGroup, ownerId: 1 }
      await truffleAssert.reverts(
        contentDirectory.createChannel(ownership, 'test', channelMetadata, {
          from: accounts[MEMBER_1_ADDRESS_INDEX],
        })
      )
    })

    it('should NOT allow the curator to create a channel', async () => {
      const ownership = { ownershipType: ChannelOwnerType.CuratorGroup, ownerId: 1 }
      await truffleAssert.reverts(
        contentDirectory.createChannel(ownership, 'test', channelMetadata, {
          from: accounts[CURATOR_1_ADDRESS_INDEX],
        })
      )
    })
  })

  describe('Channel management', () => {
    // Each of those tests will need a new channel instance
    beforeEach(async () => {
      const ownership = { ownershipType: ChannelOwnerType.CuratorGroup, ownerId: 1 }
      await contentDirectory.createChannel(ownership, 'test', channelMetadata, {
        from: accounts[LEAD_ADDRESS_INDEX],
      })
    })

    describe('The lead', () => {
      before(() => {
        // Set default address for all tests under this "describe"
        setDefaultContractCaller(accounts[LEAD_ADDRESS_INDEX])
      })

      it('should be able to update the channel', async () => {
        await contentDirectory.updateChannelMetadata(1, channelMetadataUpdate)
      })

      // TODO: Group channel should always have a group as owner?
      it('should be able to transfer channel ownership')

      it('should be able to remove the channel', async () => {
        await contentDirectory.removeChannel(1)
      })

      it('should be able to publish a video under the channel', async () => {
        await contentDirectory.addVideo(1, videoMetadata)
      })

      it('should be able to change the channel video limit', async () => {
        const newLimit = 100
        await contentDirectory.updateChannelVideoLimit(1, newLimit, 1)
      })

      it('should be able to deactivate and reactivate the channel', async () => {
        const reason = 'This channel breaks the rules'
        await contentDirectory.deactivateChannel(1, reason, 1)
        await contentDirectory.activateChannel(1, 1)
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
          await contentDirectory.updateVideoMetadata(1, videoMetadataUpdate)
        })

        it('should be able to remove video under the channel', async () => {
          await contentDirectory.removeVideo(1)
        })
      })
    })

    describe('Curator group member with full access', () => {
      before(() => {
        // Set default address for all tests under this "describe"
        setDefaultContractCaller(accounts[CURATOR_1_ADDRESS_INDEX])
      })

      beforeEach(async () => {
        // Set group permissions to full
        await contentDirectory.updateCuratorGroupPermissions(1, [true, true, true, true], {
          from: accounts[LEAD_ADDRESS_INDEX],
        })
      })

      it('should be able to update the channel', async () => {
        await contentDirectory.updateChannelMetadataAsCurator(1, channelMetadataUpdate, 1)
      })

      it('should NOT be able to transfer channel ownership')

      it('should NOT be able to remove the channel', async () => {
        await truffleAssert.reverts(contentDirectory.removeChannel(1))
      })

      it('should be able to publish a video under the channel', async () => {
        await contentDirectory.addVideoAsCurator(1, videoMetadata, 1)
      })

      it('should NOT be able to update the channel video limit', async () => {
        await truffleAssert.reverts(contentDirectory.updateChannelVideoLimit(1, 100, 1))
      })

      it('should NOT be able to deactivate the channel', async () => {
        await truffleAssert.reverts(contentDirectory.deactivateChannel(1, 'Malicous deactivation!', 1))
      })

      describe('Deactivated channel', () => {
        // Each of those tests expect the channel to be deactivated
        beforeEach(async () => {
          await contentDirectory.deactivateChannel(1, 'Test', 1, {
            from: accounts[LEAD_ADDRESS_INDEX],
          })
        })

        it('should NOT be able to reactivate the channel', async () => {
          await truffleAssert.reverts(contentDirectory.activateChannel(1, 1))
        })

        it('should NOT be able to publish a video', async () => {
          await truffleAssert.reverts(contentDirectory.addVideoAsCurator(1, videoMetadata, 1))
        })
      })

      describe('Managing videos', () => {
        // Each of those tests expect an existing video
        beforeEach(async () => {
          await contentDirectory.addVideo(1, videoMetadata, {
            from: accounts[LEAD_ADDRESS_INDEX],
          })
        })

        it('should be able to update video under the channel', async () => {
          await contentDirectory.updateVideoMetadataAsCurator(1, videoMetadataUpdate, 1)
        })

        it('should be able to remove video under the channel', async () => {
          await contentDirectory.removeGroupChannelVideoAsCurator(1, 1)
        })
      })
    })

    describe('Curator group member with no access', () => {
      before(() => {
        // Set default address for all tests under this "describe"
        setDefaultContractCaller(accounts[CURATOR_1_ADDRESS_INDEX])
      })

      beforeEach(async () => {
        // Set group permissions to none
        await contentDirectory.updateCuratorGroupPermissions(1, [false, false, false, false], {
          from: accounts[LEAD_ADDRESS_INDEX],
        })
      })

      it('should NOT be able to update the channel', async () => {
        await truffleAssert.reverts(contentDirectory.updateChannelMetadataAsCurator(1, channelMetadataUpdate, 1))
      })

      it('should NOT be able to transfer channel ownership')

      it('should NOT be able to remove the channel', async () => {
        await truffleAssert.reverts(contentDirectory.removeChannel(1))
      })

      it('should NOT be able to publish a video under the channel', async () => {
        await truffleAssert.reverts(contentDirectory.addVideoAsCurator(1, videoMetadata, 1))
      })

      it('should NOT be able to update the channel video limit', async () => {
        await truffleAssert.reverts(contentDirectory.updateChannelVideoLimit(1, 100, 1))
      })

      it('should NOT be able to deactivate the channel', async () => {
        await truffleAssert.reverts(contentDirectory.deactivateChannel(1, 'Malicous deactivation!', 1))
      })

      it('should NOT be able to reactivate the channel once deactivated', async () => {
        // Deactivate the channel as lead first
        await contentDirectory.deactivateChannel(1, 'Test', 1, {
          from: accounts[LEAD_ADDRESS_INDEX],
        })

        await truffleAssert.reverts(contentDirectory.activateChannel(1, 1))
      })

      describe('Managing videos', () => {
        // Each of those tests expect an existing video
        beforeEach(async () => {
          await contentDirectory.addVideo(1, videoMetadata, {
            from: accounts[LEAD_ADDRESS_INDEX],
          })
        })

        it('should NOT be able to update video under the channel', async () => {
          await truffleAssert.reverts(contentDirectory.updateVideoMetadataAsCurator(1, videoMetadataUpdate, 1))
        })

        it('should NOT be able to remove video under the channel', async () => {
          await truffleAssert.reverts(contentDirectory.removeGroupChannelVideoAsCurator(1, 1))
        })
      })
    })
  })
}

export default groupChannelsTests
