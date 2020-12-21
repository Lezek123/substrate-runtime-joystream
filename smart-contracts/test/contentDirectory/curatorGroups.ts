import truffleAssert from 'truffle-assertions'
import _ from 'lodash'
import { ContentDirectoryInstance, CuratorGroupStorageInstance } from '../../types/truffle-contracts'
import { setDefaultCaller, getCurrentInstances } from '../utils/contracts'
import { channelMetadata, ChannelOwnerType, CURATOR_1_ADDRESS_INDEX, LEAD_ADDRESS_INDEX } from '../utils/consts'

// TODO: Import events types (but need to deal with BN inside struct type incompatibility)

const curatorGroupsTests = (accounts: string[]): void => {
  let contentDirectory: ContentDirectoryInstance
  let curatorGroupStorage: CuratorGroupStorageInstance

  beforeEach(async () => {
    ;({ contentDirectory, curatorGroupStorage } = await getCurrentInstances())
  })

  describe('The lead', () => {
    before(() => {
      setDefaultCaller(accounts[LEAD_ADDRESS_INDEX])
    })

    it('should be able to create a new group', async () => {
      const permissions = [true, true, true, true] // Full pemissions
      const res = await contentDirectory.createCuratorGroup(permissions)
      truffleAssert.eventEmitted(
        res,
        'CuratorGroupCreated',
        (e: any) => e._groupId.eqn(1) && _.isEqual(e._permissions, permissions)
      )
      assert.isTrue(await curatorGroupStorage.groupExists(1))
      assert.equal((await curatorGroupStorage.nextGroupId()).toNumber(), 2)
      await curatorGroupStorage.getExistingGroup(1) // Should not throw
    })

    describe('Managing groups', () => {
      // All those tests will assume existing group
      beforeEach(async () => {
        const permissions = [true, true, true, true]
        await contentDirectory.createCuratorGroup(permissions)
      })

      it('should be able to add curator to group ', async () => {
        const res = await contentDirectory.addCuratorToGroup(1, 1)
        truffleAssert.eventEmitted(res, 'CuratorAddedToGroup', (e: any) => e._curatorId.eqn(1) && e._groupId.eqn(1))
        assert.isTrue(await curatorGroupStorage.isCuratorInExistingGroup(1, 1))
      })

      it('should be able to remove curator from group', async () => {
        // Add a curator first
        await contentDirectory.addCuratorToGroup(1, 1)
        const res = await contentDirectory.removeCuratorFromGroup(1, 1)
        truffleAssert.eventEmitted(res, 'CuratorRemovedFromGroup', (e: any) => e._curatorId.eqn(1) && e._groupId.eqn(1))
        assert.isTrue(await curatorGroupStorage.groupExists(1))
        assert.isFalse(await curatorGroupStorage.isCuratorInExistingGroup(1, 1))
      })

      it('should be able to remove a curator from all groups at once', async () => {
        // Create more groups add curator to a few of them
        await contentDirectory.createCuratorGroup([true, false, true, false])
        await contentDirectory.createCuratorGroup([false, false, false, true])
        for (let groupId = 1; groupId <= 3; ++groupId) {
          await contentDirectory.addCuratorToGroup(1, groupId)
        }
        const res = await contentDirectory.removeCuratorFromAllGroups(1)
        truffleAssert.eventEmitted(res, 'CuratorRemovedFromAllGroups', (e: any) => e._curatorId.eqn(1))
        for (let groupId = 1; groupId <= 3; ++groupId) {
          assert.isTrue(await curatorGroupStorage.groupExists(1))
          assert.isFalse(await curatorGroupStorage.isCuratorInExistingGroup(1, groupId))
        }
      })

      it('should be able to update group permissions', async () => {
        const newPermissions = [false, true, true, true]
        const res = await contentDirectory.updateCuratorGroupPermissions(1, newPermissions)
        truffleAssert.eventEmitted(
          res,
          'CuratorGroupPermissionsUpdated',
          (e: any) => e._groupId.eqn(1) && _.isEqual(e._permissions, newPermissions)
        )
        assert.deepEqual((await curatorGroupStorage.getExistingGroup(1)).permissions, newPermissions)
      })

      it('should be NOT able to remove a group that has existing curators', async () => {
        // Add a curator to group first
        await contentDirectory.addCuratorToGroup(1, 1)
        // Try to remove and assert it reverts
        await truffleAssert.reverts(contentDirectory.removeCuratorGroup(1))
      })

      it('should NOT be able to remove a group that has existing channels', async () => {
        // Add a channel to group
        await contentDirectory.createChannel(
          { ownershipType: ChannelOwnerType.CuratorGroup, ownerId: 1 },
          'test',
          channelMetadata
        )
        // Try to remove and assert it reverts
        await truffleAssert.reverts(contentDirectory.removeCuratorGroup(1))
      })

      it('should be able to remove a group provided it has no existing curators and channels', async () => {
        const res = await contentDirectory.removeCuratorGroup(1)
        truffleAssert.eventEmitted(res, 'CuratorGroupRemoved')
        assert.isFalse(await curatorGroupStorage.groupExists(1))
        await truffleAssert.reverts(curatorGroupStorage.getExistingGroup(1))
      })
    })
  })

  describe('The curator', () => {
    before(() => {
      setDefaultCaller(accounts[CURATOR_1_ADDRESS_INDEX])
    })

    it('should NOT be able to create a new group', async () => {
      const permissions = [true, true, true, true] // Full pemissions
      await truffleAssert.reverts(contentDirectory.createCuratorGroup(permissions))
    })

    describe('Managing groups', () => {
      // All those tests will assume existing group
      beforeEach(async () => {
        const permissions = [true, true, true, true]
        await contentDirectory.createCuratorGroup(permissions, { from: accounts[LEAD_ADDRESS_INDEX] })
      })

      it('should NOT be able to add curator to group ', async () => {
        await truffleAssert.reverts(contentDirectory.addCuratorToGroup(1, 1))
      })

      it('should NOT be able to remove curator from group', async () => {
        // Add curator as lead first
        await contentDirectory.addCuratorToGroup(1, 1, { from: accounts[LEAD_ADDRESS_INDEX] })
        await truffleAssert.reverts(contentDirectory.removeCuratorFromGroup(1, 1))
      })

      it('should NOT be able to remove a curator from all groups at once', async () => {
        await truffleAssert.reverts(contentDirectory.removeCuratorFromAllGroups(1))
      })

      it('should NOT be able to update group permissions', async () => {
        const newPermissions = [false, true, true, true]
        await truffleAssert.reverts(contentDirectory.updateCuratorGroupPermissions(1, newPermissions))
      })

      it('should NOT be able to remove a group', async () => {
        await truffleAssert.reverts(curatorGroupStorage.removeGroup(1))
      })
    })
  })
}

export default curatorGroupsTests
