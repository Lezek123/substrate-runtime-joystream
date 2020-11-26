import { RUNTIME_ADDRESS_INDEX, COUNCIL_ADDRESS_INDEX, MEMBER_1_ADDRESS_INDEX } from './utils/consts'
import { redeployContracts } from './utils/redeploy'

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
    ;({ runtimeAddressProvider, membershipBridge, contentWorkingGroupBridge } = await redeployContracts(accounts))
  })

  it('should be initialized with test provider', async () => {
    assert.equal(await runtimeAddressProvider.runtimeAddress(), accounts[RUNTIME_ADDRESS_INDEX])
    assert.equal(await runtimeAddressProvider.councilAddress(), accounts[COUNCIL_ADDRESS_INDEX])
    assert.equal(await membershipBridge.runtimeAddressProvider(), runtimeAddressProvider.address)
    assert.equal(await contentWorkingGroupBridge.runtimeAddressProvider(), runtimeAddressProvider.address)
  })

  it('should allow the runtime to set member controller address', async () => {
    await membershipBridge.setMemberAddress(1, accounts[MEMBER_1_ADDRESS_INDEX], {
      from: accounts[RUNTIME_ADDRESS_INDEX],
    })
    assert.isTrue(await membershipBridge.memberExists(1))
    assert.isTrue(await membershipBridge.isMemberController(accounts[MEMBER_1_ADDRESS_INDEX], 1))
    assert.isFalse(await membershipBridge.isMemberController(accounts[MEMBER_1_ADDRESS_INDEX], 2))
    assert.isFalse(await membershipBridge.isMemberController(accounts[RUNTIME_ADDRESS_INDEX], 1))
  })
})
