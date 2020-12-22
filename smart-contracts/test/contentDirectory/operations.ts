import truffleAssert from 'truffle-assertions'
import _ from 'lodash'
import { ContentDirectoryInstance } from '../../types/truffle-contracts'
import { setDefaultCaller, getCurrentInstances } from '../utils/contracts'
import { CURATOR_1_ADDRESS_INDEX, LEAD_ADDRESS_INDEX, MEMBER_1_ADDRESS_INDEX } from '../utils/consts'

// TODO: Import events types (but need to deal with BN inside struct type incompatibility)

const operationsTests = (accounts: string[]): void => {
  let contentDirectory: ContentDirectoryInstance

  beforeEach(async () => {
    ;({ contentDirectory } = await getCurrentInstances())
  })

  describe('The lead', () => {
    before(() => {
      setDefaultCaller(accounts[LEAD_ADDRESS_INDEX])
    })
    it('should be able to send CustomLeadOperation request', async () => {
      const requestData = JSON.stringify({ _type: 'SetFeaturedVideos', data: [1, 2, 3] })
      const res = await contentDirectory.sendCustomLeadOperationRequest(requestData)
      truffleAssert.eventEmitted(res, 'CustomLeadOperationRequestSent', (e: any) => e._requestData === requestData)
    })
  })

  describe('The curator', () => {
    before(() => {
      setDefaultCaller(accounts[CURATOR_1_ADDRESS_INDEX])
    })
    it('should NOT be able to send CustomLeadOperation request', async () => {
      const requestData = JSON.stringify({ _type: 'SetFeaturedVideos', data: [1, 2, 3] })
      await truffleAssert.reverts(contentDirectory.sendCustomLeadOperationRequest(requestData))
    })
    it('should be able to send CustomCuratorOperation request', async () => {
      const requestData = JSON.stringify({ _type: 'AddContentCategory', data: { name: 'New category' } })
      const res = await contentDirectory.sendCustomCuratorOperationRequest(requestData, 1)
      truffleAssert.eventEmitted(res, 'CustomCuratorOperationRequestSent', (e: any) => e._requestData === requestData)
    })
  })

  describe('The member', () => {
    before(() => {
      setDefaultCaller(accounts[MEMBER_1_ADDRESS_INDEX])
    })
    it('should NOT be able to send CustomLeadOperation request', async () => {
      const requestData = JSON.stringify({ _type: 'SetFeaturedVideos', data: [1, 2, 3] })
      await truffleAssert.reverts(contentDirectory.sendCustomLeadOperationRequest(requestData))
    })
    describe('should NOT be able to send CustomCuratorOperation request', () => {
      for (let cId = 0; cId <= 1; ++cId) {
        it(`Using _curatorId=${cId}`, async () => {
          const requestData = JSON.stringify({ _type: 'AddContentCategory', data: { name: 'New category' } })
          await truffleAssert.reverts(contentDirectory.sendCustomCuratorOperationRequest(requestData, cId))
        })
      }
    })
  })
}

export default operationsTests
