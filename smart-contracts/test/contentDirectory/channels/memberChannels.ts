import truffleAssert from 'truffle-assertions'
import _ from 'lodash'
import {
  MEMBER_1_ADDRESS_INDEX,
  MEMBER_2_ADDRESS_INDEX,
  CURATOR_1_ADDRESS_INDEX,
  ChannelOwnerType,
  channelMetadata,
  videoMetadata,
} from '../../utils/consts'
import { getCurrentInstances, setDefaultCaller } from '../../utils/contracts'
import { ChannelStorageInstance, ContentDirectoryInstance, VideoStorageInstance } from 'types/truffle-contracts'
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
import {
  testChannelCuratorGroupMemberActionsDisallowed,
  testChannelCuratorGroupMemberVideoActionsDisallowed,
} from './groupMemberActions'

// TODO: Import events types (but need to deal with BN inside struct type incompatibility)

const memberChannelsTests = (accounts: string[]): void => {
  let contentDirectory: ContentDirectoryInstance
  let channelStorage: ChannelStorageInstance

  beforeEach(async () => {
    ;({ contentDirectory, channelStorage } = await getCurrentInstances())
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
        setDefaultCaller(accounts[MEMBER_1_ADDRESS_INDEX])
      })

      testChannelOwnerActionsAllowed(1, accounts)
      testChannelCuratorActionsDisallowed(1, 1, accounts)

      describe('Managing videos', () => {
        // Each of those tests expect an existing video
        beforeEach(async () => {
          await contentDirectory.addVideoAsChannelOwner(1, videoMetadata)
        })

        testChannelOwnerVideoActionsAllowed(1)
        testChannelCuratorVideoActionsDisallowed(1, 1)
      })
    })

    describe('Other member', () => {
      before(() => {
        // Set default address for all tests under this "describe"
        setDefaultCaller(accounts[MEMBER_2_ADDRESS_INDEX])
      })

      testChannelOwnerActionsDisallowed(1)
      testChannelCuratorActionsDisallowed(1, 1, accounts)
      testChannelCuratorGroupMemberActionsDisallowed(1, 1)

      it('should be able to accept ownership transfer if is a reciever', async () => {
        // Create a pending transfer as owner first
        const newOwnership = {
          ownershipType: ChannelOwnerType.Member,
          ownerId: 2,
        }
        await contentDirectory.transferChannelOwnershipAsOwner(1, newOwnership, {
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
        await contentDirectory.transferChannelOwnershipAsOwner(1, newOwnership, {
          from: accounts[MEMBER_1_ADDRESS_INDEX],
        })

        await truffleAssert.reverts(contentDirectory.acceptChannelOwnershipTransfer(1))
      })

      describe('Managing videos', () => {
        // Each of those tests expect an existing video
        beforeEach(async () => {
          await contentDirectory.addVideoAsChannelOwner(1, videoMetadata, {
            from: accounts[MEMBER_1_ADDRESS_INDEX],
          })
        })

        testChannelOwnerVideoActionsDisallowed(1)
        testChannelCuratorVideoActionsDisallowed(1, 1)
        testChannelCuratorGroupMemberVideoActionsDisallowed(1, 1)
      })
    })

    // Curator success cases
    describe('Curator', () => {
      before(() => {
        // Set default address for all tests under this "describe"
        setDefaultCaller(accounts[CURATOR_1_ADDRESS_INDEX])
      })

      testChannelCuratorActionsAllowed(1, 1)
      testChannelOwnerActionsDisallowed(1)
      testChannelCuratorGroupMemberActionsDisallowed(1, 1)

      describe('Managing videos', () => {
        // Each of those tests expect an existing video
        beforeEach(async () => {
          await contentDirectory.addVideoAsChannelOwner(1, videoMetadata, {
            from: accounts[MEMBER_1_ADDRESS_INDEX],
          })
        })

        testChannelOwnerVideoActionsDisallowed(1)
        testChannelCuratorVideoActionsAllowed(1, 1)
        testChannelCuratorGroupMemberVideoActionsDisallowed(1, 1)
      })
    })
  })
}

export default memberChannelsTests
