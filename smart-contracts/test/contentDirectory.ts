import {
  RUNTIME_ADDRESS_INDEX,
  MEMBER_1_ADDRESS_INDEX,
  MEMBER_2_ADDRESS_INDEX,
  CURATOR_1_ADDRESS_INDEX,
  LEAD_ADDRESS_INDEX,
} from './utils/consts'
import { redeployContracts, getCurrentInstances } from './utils/contracts'
import memberChannelsTests from './channels/memberChannels'
import groupChannelsTests from './channels/groupChannels'

contract('ContentDirectory', (accounts) => {
  beforeEach(async () => {
    await redeployContracts(accounts)
    const { membershipBridge, contentWorkingGroupBridge } = await getCurrentInstances()
    // Membership bridge - initialize the members
    await membershipBridge.setMemberAddress(1, accounts[MEMBER_1_ADDRESS_INDEX], {
      from: accounts[RUNTIME_ADDRESS_INDEX],
    })
    await membershipBridge.setMemberAddress(2, accounts[MEMBER_2_ADDRESS_INDEX], {
      from: accounts[RUNTIME_ADDRESS_INDEX],
    })
    // ContentWorkingGroup bridge - initialize curators and lead
    await contentWorkingGroupBridge.setCuratorAddress(1, accounts[CURATOR_1_ADDRESS_INDEX], {
      from: accounts[RUNTIME_ADDRESS_INDEX],
    })
    await contentWorkingGroupBridge.setLeadAddress(accounts[LEAD_ADDRESS_INDEX])
  })

  describe('Member channels', () => {
    memberChannelsTests(accounts)
  })

  describe('Group channels', () => {
    groupChannelsTests(accounts)
  })
})
