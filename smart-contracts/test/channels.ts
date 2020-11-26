import truffleAssert from 'truffle-assertions'
import _ from 'lodash'
import { RUNTIME_ADDRESS_INDEX, MEMBER_1_ADDRESS_INDEX, MEMBER_2_ADDRESS_INDEX } from './utils/consts'
import { redeployContracts } from './utils/redeploy'
import { ChannelStorageInstance, ContentDirectoryInstance, MembershipBridgeInstance } from '../types/truffle-contracts'

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

  beforeEach(async () => {
    ;({ membershipBridge, contentDirectory, channelStorage } = await redeployContracts(accounts))
    // Membership bridge - initialize the members
    await membershipBridge.setMemberAddress(1, accounts[MEMBER_1_ADDRESS_INDEX], {
      from: accounts[RUNTIME_ADDRESS_INDEX],
    })
    await membershipBridge.setMemberAddress(2, accounts[MEMBER_2_ADDRESS_INDEX], {
      from: accounts[RUNTIME_ADDRESS_INDEX],
    })
  })

  contract('Channel creation', () => {
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

  contract('Member channel management', () => {
    // Each test will need a new channel instance
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

    // Success cases:

    it('should allow the member to update a channel', async () => {
      const updatedMetadata = [['title', 'Awesome updated channel']]
      const res = await contentDirectory.updateChannelMetadata(1, updatedMetadata, {
        from: accounts[MEMBER_1_ADDRESS_INDEX],
      })

      truffleAssert.eventEmitted(
        res,
        'ChannelMetadataUpdated',
        (e: any) => e._id.eqn(1) && _.isEqual(e._metadata, updatedMetadata)
      )
    })

    it('should allow the member to transfer channel ownership', async () => {
      const newOwnership = {
        ownershipType: ChannelOwnerType.Member,
        ownerId: 2,
      }

      const res = await contentDirectory.updateChannelOwnership(1, newOwnership, {
        from: accounts[MEMBER_1_ADDRESS_INDEX],
      })

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

    it('should allow the owner to remove the channel', async () => {
      await contentDirectory.removeChannel(1, { from: accounts[MEMBER_1_ADDRESS_INDEX] })
      await truffleAssert.reverts(channelStorage.getExistingChannel(1))
    })

    // Fail cases:

    it('should prevent non-owner member from updating a channel', async () => {
      const updatedMetadata = [['title', 'Awesome updated channel']]
      await truffleAssert.reverts(
        contentDirectory.updateChannelMetadata(1, updatedMetadata, {
          from: accounts[MEMBER_2_ADDRESS_INDEX],
        })
      )
    })

    it('should prevent non-owner member from transferring channel ownership', async () => {
      const newOwnership = {
        ownershipType: ChannelOwnerType.Member,
        ownerId: 1,
      }
      await truffleAssert.reverts(
        contentDirectory.updateChannelOwnership(1, newOwnership, {
          from: accounts[MEMBER_2_ADDRESS_INDEX],
        })
      )
    })

    it('should prevent non-owner from removing a channel', async () => {
      await truffleAssert.reverts(contentDirectory.removeChannel(1, { from: accounts[MEMBER_2_ADDRESS_INDEX] }))
    })
  })
})
