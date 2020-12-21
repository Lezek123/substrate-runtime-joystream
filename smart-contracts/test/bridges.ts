import truffleAssert from 'truffle-assertions'
import {
  RUNTIME_ADDRESS_INDEX,
  COUNCIL_ADDRESS_INDEX,
  MEMBER_1_ADDRESS_INDEX,
  CURATOR_1_ADDRESS_INDEX,
  LEAD_ADDRESS_INDEX,
  ZERO_ADDRESS,
} from './utils/consts'
import { redeployContracts, getCurrentInstances, setDefaultCaller } from './utils/contracts'
import _ from 'lodash'

import {
  ContentWorkingGroupBridgeInstance,
  MembershipBridgeInstance,
  RuntimeAddressProviderInstance,
} from '../types/truffle-contracts'

contract('Bridges', (accounts) => {
  let runtimeAddressProvider: RuntimeAddressProviderInstance
  let membershipBridge: MembershipBridgeInstance
  let contentWorkingGroupBridge: ContentWorkingGroupBridgeInstance

  beforeEach(async () => {
    await redeployContracts(accounts)
    ;({ runtimeAddressProvider, membershipBridge, contentWorkingGroupBridge } = await getCurrentInstances())
  })

  it('should be initialized with test provider', async () => {
    assert.equal(await runtimeAddressProvider.runtimeAddress(), accounts[RUNTIME_ADDRESS_INDEX])
    assert.equal(await runtimeAddressProvider.councilAddress(), accounts[COUNCIL_ADDRESS_INDEX])
    assert.equal(await membershipBridge.runtimeAddressProvider(), runtimeAddressProvider.address)
    assert.equal(await contentWorkingGroupBridge.runtimeAddressProvider(), runtimeAddressProvider.address)
  })

  describe('The runtime', () => {
    before(() => {
      setDefaultCaller(accounts[RUNTIME_ADDRESS_INDEX])
    })

    it('should be able to set member controller address', async () => {
      await membershipBridge.setMemberAddress(1, accounts[MEMBER_1_ADDRESS_INDEX])
      assert.isTrue(await membershipBridge.memberExists(1))
      assert.isTrue(await membershipBridge.isMemberController(accounts[MEMBER_1_ADDRESS_INDEX], 1))
      assert.isFalse(await membershipBridge.isMemberController(accounts[MEMBER_1_ADDRESS_INDEX], 2))
      assert.isFalse(await membershipBridge.isMemberController(accounts[RUNTIME_ADDRESS_INDEX], 1))
    })

    it('should be able to unset member controller address', async () => {
      // Set some address first
      await membershipBridge.setMemberAddress(1, accounts[MEMBER_1_ADDRESS_INDEX])
      // Unset by setting to ZERO_ADDRESS
      await membershipBridge.setMemberAddress(1, ZERO_ADDRESS)
      // Check status
      assert.equal(await membershipBridge.controllerAddressByMemberId(1), ZERO_ADDRESS)
      assert.isFalse(await membershipBridge.isMemberController(accounts[MEMBER_1_ADDRESS_INDEX], 1))
      assert.isFalse(await membershipBridge.memberExists(1))
    })

    it('should be able to set curator role address', async () => {
      await contentWorkingGroupBridge.setCuratorAddress(1, accounts[CURATOR_1_ADDRESS_INDEX])
      assert.isTrue(await contentWorkingGroupBridge.curatorExists(1))
      assert.isTrue(await contentWorkingGroupBridge.isCurator(accounts[CURATOR_1_ADDRESS_INDEX], 1))
      assert.isFalse(await contentWorkingGroupBridge.isCurator(accounts[CURATOR_1_ADDRESS_INDEX], 2))
      assert.isFalse(await contentWorkingGroupBridge.isCurator(accounts[RUNTIME_ADDRESS_INDEX], 1))
    })

    it('should be able to unset curator role address', async () => {
      // Set some address first
      await contentWorkingGroupBridge.setCuratorAddress(1, accounts[CURATOR_1_ADDRESS_INDEX])
      // Unset by setting to ZERO_ADDRESS
      await contentWorkingGroupBridge.setCuratorAddress(1, ZERO_ADDRESS)
      // Check status
      assert.equal(await contentWorkingGroupBridge.addressByCuratorId(1), ZERO_ADDRESS)
      assert.isFalse(await contentWorkingGroupBridge.isCurator(accounts[CURATOR_1_ADDRESS_INDEX], 1))
      assert.isFalse(await contentWorkingGroupBridge.curatorExists(1))
    })

    it('should be able to set lead role address', async () => {
      await contentWorkingGroupBridge.setLeadAddress(accounts[LEAD_ADDRESS_INDEX])
      assert.equal(await contentWorkingGroupBridge.currentLeadAddress(), accounts[LEAD_ADDRESS_INDEX])
      assert.isTrue(await contentWorkingGroupBridge.isActiveLead(accounts[LEAD_ADDRESS_INDEX]))
    })
  })

  describe('The council', () => {
    before(() => {
      setDefaultCaller(accounts[COUNCIL_ADDRESS_INDEX])
    })

    it('should be able to initialize member addresses without overriding those already set', async () => {
      // Set a few addresses as runtime first
      const runtimeM1Address = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
      const runtimeM2Address = ZERO_ADDRESS // set member 2 explicitly to empty
      await membershipBridge.setMemberAddress(1, runtimeM1Address, { from: accounts[RUNTIME_ADDRESS_INDEX] })
      await membershipBridge.setMemberAddress(2, runtimeM2Address, { from: accounts[RUNTIME_ADDRESS_INDEX] })

      // Batch set as council
      const councilM1Address = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
      const councilM2Address = '0xcccccccccccccccccccccccccccccccccccccccc'
      const councilM3Address = '0xdddddddddddddddddddddddddddddddddddddddd'
      const res = await membershipBridge.initializeMembers([
        { id: 1, controllerAddress: councilM1Address },
        { id: 2, controllerAddress: councilM2Address },
        { id: 3, controllerAddress: councilM3Address },
      ])

      truffleAssert.eventEmitted(res, 'MembersInitialized', (e: any) => _.isEqual(e._pairsSet, [false, false, true]))

      assert.equal((await membershipBridge.controllerAddressByMemberId(1)).toLowerCase(), runtimeM1Address)
      assert.equal((await membershipBridge.controllerAddressByMemberId(2)).toLowerCase(), runtimeM2Address)
      assert.equal((await membershipBridge.controllerAddressByMemberId(3)).toLowerCase(), councilM3Address)

      assert.isTrue(await membershipBridge.isMemberController(runtimeM1Address, 1))
      assert.isTrue(await membershipBridge.isMemberController(councilM3Address, 3))
    })

    it('should be able to initialize curator addresses without overriding those already set', async () => {
      // Set a few addresses as runtime first
      const runtimeC1Address = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
      const runtimeC2Address = ZERO_ADDRESS // set curator 2 explicitly to empty
      await contentWorkingGroupBridge.setCuratorAddress(1, runtimeC1Address, { from: accounts[RUNTIME_ADDRESS_INDEX] })
      await contentWorkingGroupBridge.setCuratorAddress(2, runtimeC2Address, { from: accounts[RUNTIME_ADDRESS_INDEX] })

      // Batch set as council
      const councilC1Address = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
      const councilC2Address = '0xcccccccccccccccccccccccccccccccccccccccc'
      const councilC3Address = '0xdddddddddddddddddddddddddddddddddddddddd'
      const res = await contentWorkingGroupBridge.initializeCurators([
        { id: 1, roleAddress: councilC1Address },
        { id: 2, roleAddress: councilC2Address },
        { id: 3, roleAddress: councilC3Address },
      ])

      truffleAssert.eventEmitted(res, 'CuratorsInitialized', (e: any) => _.isEqual(e._pairsSet, [false, false, true]))

      assert.equal((await contentWorkingGroupBridge.addressByCuratorId(1)).toLowerCase(), runtimeC1Address)
      assert.equal((await contentWorkingGroupBridge.addressByCuratorId(2)).toLowerCase(), runtimeC2Address)
      assert.equal((await contentWorkingGroupBridge.addressByCuratorId(3)).toLowerCase(), councilC3Address)

      assert.isTrue(await contentWorkingGroupBridge.isCurator(runtimeC1Address, 1))
      assert.isTrue(await contentWorkingGroupBridge.isCurator(councilC3Address, 3))
    })

    it('should be able to initialize lead address', async () => {
      const leadAddress = '0x7777777777777777777777777777777777777777'

      const res = await contentWorkingGroupBridge.initializeLead(leadAddress)

      truffleAssert.eventEmitted(res, 'LeadInitialized', (e: any) => e._address === leadAddress)

      assert.equal(await contentWorkingGroupBridge.currentLeadAddress(), leadAddress)
      assert.isTrue(await contentWorkingGroupBridge.isActiveLead(leadAddress))
    })

    it('should NOT override lead address if already set by runtime', async () => {
      // Set lead address to empty by runtime
      await contentWorkingGroupBridge.setLeadAddress(ZERO_ADDRESS, { from: accounts[RUNTIME_ADDRESS_INDEX] })
      const councilLeadAddress = '0x7777777777777777777777777777777777777777'

      await truffleAssert.reverts(contentWorkingGroupBridge.initializeLead(councilLeadAddress))
    })

    it('should be able to deactivate and activate the lead', async () => {
      // Initialize lead first
      const leadAddress = '0x7777777777777777777777777777777777777777'
      await contentWorkingGroupBridge.initializeLead(leadAddress)
      // Deactivate
      await contentWorkingGroupBridge.setLeadStatus(false)
      // Check status
      assert.isFalse(await contentWorkingGroupBridge.isLeadActive())
      assert.isFalse(await contentWorkingGroupBridge.isActiveLead(leadAddress))
      // Activate
      await contentWorkingGroupBridge.setLeadStatus(true)
      // Check status
      assert.isTrue(await contentWorkingGroupBridge.isLeadActive())
      assert.isTrue(await contentWorkingGroupBridge.isActiveLead(leadAddress))
    })
  })

  describe('Other address (a member)', () => {
    before(() => {
      setDefaultCaller(accounts[MEMBER_1_ADDRESS_INDEX])
    })

    it('should NOT be able to set member controller address', async () => {
      await truffleAssert.reverts(membershipBridge.setMemberAddress(1, accounts[MEMBER_1_ADDRESS_INDEX]))
    })

    it('should NOT be able to set curator role address', async () => {
      await truffleAssert.reverts(contentWorkingGroupBridge.setCuratorAddress(1, accounts[CURATOR_1_ADDRESS_INDEX]))
    })

    it('should NOT be able to set lead role address', async () => {
      await truffleAssert.reverts(membershipBridge.setMemberAddress(1, accounts[LEAD_ADDRESS_INDEX]))
    })

    it('should NOT be able to initialize curator addresses', async () => {
      await truffleAssert.reverts(
        contentWorkingGroupBridge.initializeCurators([{ id: 1, roleAddress: accounts[CURATOR_1_ADDRESS_INDEX] }])
      )
    })

    it('should NOT be able to initialize member addresses', async () => {
      await truffleAssert.reverts(
        membershipBridge.initializeMembers([{ id: 1, controllerAddress: accounts[MEMBER_1_ADDRESS_INDEX] }])
      )
    })

    it('should NOT be able to initialize lead address', async () => {
      await truffleAssert.reverts(contentWorkingGroupBridge.initializeLead(accounts[LEAD_ADDRESS_INDEX]))
    })
  })
})
