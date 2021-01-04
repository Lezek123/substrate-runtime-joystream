import truffleAssert from 'truffle-assertions'
import _ from 'lodash'
import { ContentDirectoryInstance } from '../../types/truffle-contracts'
import { setDefaultCaller, getCurrentInstances } from '../utils/contracts'
import { CURATOR_1_ADDRESS_INDEX, LEAD_ADDRESS_INDEX, MEMBER_1_ADDRESS_INDEX } from '../utils/consts'
import { encodeLeadOperation, decodeLeadOperation } from '../../utils/operations'

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

    it('should be able to send lead operation request', async () => {
      const videoIds = [1, 2, 3]
      const requestData = encodeLeadOperation({ setFeaturedVideos: { videoIds } })
      const res = await contentDirectory.sendCustomLeadOperationRequest(requestData)
      truffleAssert.eventEmitted(res, 'CustomLeadOperationRequestSent', (e: any) => {
        const decoded = decodeLeadOperation(e._requestData)
        return decoded.setFeaturedVideos && _.isEqual(decoded.setFeaturedVideos.videoIds, videoIds)
      })
    })
  })

  describe('The curator', () => {
    before(() => {
      setDefaultCaller(accounts[CURATOR_1_ADDRESS_INDEX])
    })

    it('should NOT be able to send lead operation request', async () => {
      const videoIds = [1, 2, 3]
      const requestData = encodeLeadOperation({ setFeaturedVideos: { videoIds } })
      await truffleAssert.reverts(contentDirectory.sendCustomLeadOperationRequest(requestData))
    })

    it('should be able to send curator operation request', async () => {
      const videoIds = [1, 2, 3]
      const requestData = encodeLeadOperation({ setFeaturedVideos: { videoIds } })
      const res = await contentDirectory.sendCustomCuratorOperationRequest(requestData, 1)
      truffleAssert.eventEmitted(res, 'CustomCuratorOperationRequestSent', (e: any) => e._requestData === requestData)
    })
  })

  describe('The member', () => {
    before(() => {
      setDefaultCaller(accounts[MEMBER_1_ADDRESS_INDEX])
    })

    it('should NOT be able to send lead operation request', async () => {
      const videoIds = [1, 2, 3]
      const requestData = encodeLeadOperation({ setFeaturedVideos: { videoIds } })
      await truffleAssert.reverts(contentDirectory.sendCustomLeadOperationRequest(requestData))
    })

    describe('should NOT be able to send curator operation request', () => {
      for (let cId = 0; cId <= 1; ++cId) {
        it(`Using _curatorId=${cId}`, async () => {
          const videoIds = [1, 2, 3]
          const requestData = encodeLeadOperation({ setFeaturedVideos: { videoIds } })
          await truffleAssert.reverts(contentDirectory.sendCustomCuratorOperationRequest(requestData, cId))
        })
      }
    })
  })
}

export default operationsTests
