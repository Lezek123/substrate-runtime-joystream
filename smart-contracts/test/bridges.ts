import truffleAssert from 'truffle-assertions'
import {
  RUNTIME_ADDRESS_INDEX,
  COUNCIL_ADDRESS_INDEX,
  MEMBER_1_ADDRESS_INDEX,
  CURATOR_1_ADDRESS_INDEX,
  LEAD_ADDRESS_INDEX,
} from './utils/consts'
import { redeployContracts } from './utils/deployment'

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

  // Success cases

  it('should allow the runtime to set member controller address', async () => {
    await membershipBridge.setMemberAddress(1, accounts[MEMBER_1_ADDRESS_INDEX], {
      from: accounts[RUNTIME_ADDRESS_INDEX],
    })
    assert.isTrue(await membershipBridge.memberExists(1))
    assert.isTrue(await membershipBridge.isMemberController(accounts[MEMBER_1_ADDRESS_INDEX], 1))
    assert.isFalse(await membershipBridge.isMemberController(accounts[MEMBER_1_ADDRESS_INDEX], 2))
    assert.isFalse(await membershipBridge.isMemberController(accounts[RUNTIME_ADDRESS_INDEX], 1))
  })

  it('should allow the runtime to set curator role address', async () => {
    await contentWorkingGroupBridge.setCuratorAddress(1, accounts[CURATOR_1_ADDRESS_INDEX], {
      from: accounts[RUNTIME_ADDRESS_INDEX],
    })
    assert.isTrue(await contentWorkingGroupBridge.curatorExists(1))
    assert.isTrue(await contentWorkingGroupBridge.isCurator(accounts[CURATOR_1_ADDRESS_INDEX], 1))
    assert.isFalse(await contentWorkingGroupBridge.isCurator(accounts[CURATOR_1_ADDRESS_INDEX], 2))
    assert.isFalse(await contentWorkingGroupBridge.isCurator(accounts[RUNTIME_ADDRESS_INDEX], 1))
  })

  it('should allow the runtime to set lead role address', async () => {
    await contentWorkingGroupBridge.setLeadAddress(accounts[LEAD_ADDRESS_INDEX], {
      from: accounts[RUNTIME_ADDRESS_INDEX],
    })
    assert.equal(await contentWorkingGroupBridge.currentLeadAddress(), accounts[LEAD_ADDRESS_INDEX])
    assert.isTrue(await contentWorkingGroupBridge.isActiveLead(accounts[LEAD_ADDRESS_INDEX]))
  })

  // Fail cases
  it('should disallow non-runtime address from setting member controller address', async () => {
    await truffleAssert.reverts(
      membershipBridge.setMemberAddress(1, accounts[MEMBER_1_ADDRESS_INDEX], {
        from: accounts[MEMBER_1_ADDRESS_INDEX],
      })
    )
  })

  it('should disallow non-runtime address from setting curator role address', async () => {
    await truffleAssert.reverts(
      contentWorkingGroupBridge.setCuratorAddress(1, accounts[CURATOR_1_ADDRESS_INDEX], {
        from: accounts[MEMBER_1_ADDRESS_INDEX],
      })
    )
  })

  it('should disallow non-runtime address from setting lead role address', async () => {
    await truffleAssert.reverts(
      membershipBridge.setMemberAddress(1, accounts[LEAD_ADDRESS_INDEX], {
        from: accounts[MEMBER_1_ADDRESS_INDEX],
      })
    )
  })
})
