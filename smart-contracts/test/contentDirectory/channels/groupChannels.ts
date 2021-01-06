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
} from '../../utils/consts'
import { getCurrentInstances, setDefaultCaller } from '../../utils/contracts'
import { ContentDirectoryInstance } from '../../../types/truffle-contracts'
import {
  testChannelOwnerActionsAllowed,
  testChannelOwnerActionsDisallowed,
  testChannelOwnerVideoActionsAllowed,
  testChannelOwnerVideoActionsDisallowed,
} from './ownerActions'
import {
  testChannelCuratorActionsAllowed,
  testChannelCuratorActionsDisallowed,
  testChannelCuratorVideoActionsAllowed,
  testChannelCuratorVideoActionsDisallowed,
} from './curatorActions'
import { testChannelCuratorGroupMemberActionsDisallowed } from './groupMemberActions'

// TODO: Import events types (but need to deal with BN inside struct type incompatibility)

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

    describe('The lead (owner)', () => {
      before(() => {
        // Set default address for all tests under this "describe"
        setDefaultCaller(accounts[LEAD_ADDRESS_INDEX])
      })

      testChannelOwnerActionsAllowed(1, accounts)
      testChannelCuratorActionsAllowed(1, 1)

      it('can transfer channel ownership to a different group', async () => {
        // Create a new group
        await contentDirectory.createCuratorGroup([false, false, false, false], {
          from: accounts[LEAD_ADDRESS_INDEX],
        })

        const newOwnership = {
          ownershipType: ChannelOwnerType.CuratorGroup,
          ownerId: 2,
        }

        // Transfer the ownership
        await contentDirectory.transferChannelOwnershipAsOwner(1, newOwnership)
        // Confirm the transfer
        await contentDirectory.acceptChannelOwnershipTransfer(1)
      })

      describe('Managing videos', () => {
        // Each of those tests expect an existing video
        beforeEach(async () => {
          await contentDirectory.addVideoAsChannelOwner(1, videoMetadata)
        })

        testChannelOwnerVideoActionsAllowed(1)
        testChannelCuratorVideoActionsAllowed(1, 1)
      })
    })

    describe('Curator group member with full access', () => {
      before(() => {
        // Set default address for all tests under this "describe"
        setDefaultCaller(accounts[CURATOR_1_ADDRESS_INDEX])
      })

      beforeEach(async () => {
        // Set group permissions to full
        await contentDirectory.updateCuratorGroupPermissions(1, [true, true, true, true], {
          from: accounts[LEAD_ADDRESS_INDEX],
        })
      })

      testChannelOwnerActionsDisallowed(1)
      testChannelCuratorActionsDisallowed(1, 1, accounts)

      describe('as curator group member', () => {
        it('can update the channel', async () => {
          await contentDirectory.updateChannelMetadataAsCuratorGroupMember(1, channelMetadataUpdate, 1)
        })

        it('can publish a video', async () => {
          await contentDirectory.addVideoAsCuratorGroupMember(1, videoMetadata, 1)
        })

        it('can NOT publish a video when channel is deactivated', async () => {
          // Deactivate the channel as lead first
          await contentDirectory.deactivateChannel(1, 'Test', 1, { from: accounts[LEAD_ADDRESS_INDEX] })
          await truffleAssert.reverts(contentDirectory.addVideoAsCuratorGroupMember(1, videoMetadata, 1))
        })
      })

      it('can NOT accept pending ownership transfer to a new group', async () => {
        // Create a valid pending transfer as lead
        await contentDirectory.createCuratorGroup([false, false, false, false], {
          from: accounts[LEAD_ADDRESS_INDEX],
        })
        const newOwnership = {
          ownershipType: ChannelOwnerType.CuratorGroup,
          ownerId: 2,
        }
        await contentDirectory.transferChannelOwnershipAsOwner(1, newOwnership, {
          from: accounts[LEAD_ADDRESS_INDEX],
        })
        // Try to accept
        await truffleAssert.reverts(contentDirectory.acceptChannelOwnershipTransfer(1))
      })

      describe('Managing videos', () => {
        // Each of those tests expect an existing video
        beforeEach(async () => {
          await contentDirectory.addVideoAsChannelOwner(1, videoMetadata, {
            from: accounts[LEAD_ADDRESS_INDEX],
          })
        })

        testChannelOwnerVideoActionsDisallowed(1)
        testChannelCuratorVideoActionsDisallowed(1, 1)

        describe('as curator group member', () => {
          it('can update a video under the channel', async () => {
            await contentDirectory.updateVideoMetadataAsCuratorGroupMember(1, videoMetadataUpdate, 1)
          })

          it('can remove a video under the channel', async () => {
            await contentDirectory.removeVideoAsCuratorGroupMember(1, 1)
          })
        })
      })
    })

    describe('Curator group member with no access', () => {
      before(() => {
        // Set default address for all tests under this "describe"
        setDefaultCaller(accounts[CURATOR_1_ADDRESS_INDEX])
      })

      beforeEach(async () => {
        // Set group permissions to none
        await contentDirectory.updateCuratorGroupPermissions(1, [false, false, false, false], {
          from: accounts[LEAD_ADDRESS_INDEX],
        })
      })

      testChannelOwnerActionsDisallowed(1)
      testChannelCuratorActionsDisallowed(1, 1, accounts)
      testChannelCuratorGroupMemberActionsDisallowed(1, 1)

      describe('Managing videos', () => {
        // Each of those tests expect an existing video
        beforeEach(async () => {
          await contentDirectory.addVideoAsChannelOwner(1, videoMetadata, {
            from: accounts[LEAD_ADDRESS_INDEX],
          })
        })

        testChannelOwnerVideoActionsDisallowed(1)
        testChannelCuratorVideoActionsDisallowed(1, 1)
        testChannelCuratorGroupMemberActionsDisallowed(1, 1)
      })
    })
  })
}

export default groupChannelsTests
