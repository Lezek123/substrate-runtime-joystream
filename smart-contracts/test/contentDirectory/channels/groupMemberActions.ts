import truffleAssert from 'truffle-assertions'
import { channelMetadataUpdate, videoMetadata, videoMetadataUpdate } from '../../utils/consts'
import { getCurrentInstances } from '../../utils/contracts'
import { ContentDirectoryInstance } from 'types/truffle-contracts'

export const testChannelCuratorGroupMemberActionsDisallowed = (channelId: number, curatorId: number): void => {
  let contentDirectory: ContentDirectoryInstance

  beforeEach(async () => {
    ;({ contentDirectory } = await getCurrentInstances())
  })

  describe(`as curator group member (curatorID: ${curatorId})`, () => {
    it('can NOT publish a video under the channel', async () => {
      await truffleAssert.reverts(contentDirectory.addVideoAsCuratorGroupMember(channelId, videoMetadata, curatorId))
    })

    it('can NOT be update the channel', async () => {
      await truffleAssert.reverts(
        contentDirectory.updateChannelMetadataAsCuratorGroupMember(channelId, channelMetadataUpdate, 1)
      )
    })
  })
}

export const testChannelCuratorGroupMemberVideoActionsDisallowed = (videoId: number, curatorId: number): void => {
  let contentDirectory: ContentDirectoryInstance

  beforeEach(async () => {
    ;({ contentDirectory } = await getCurrentInstances())
  })

  describe(`as curator group member (curatorID: ${curatorId})`, () => {
    it('can NOT update a video under the channel', async () => {
      await truffleAssert.reverts(
        contentDirectory.updateVideoMetadataAsCuratorGroupMember(videoId, videoMetadataUpdate, curatorId)
      )
    })

    it('can NOT remove a video under the channel', async () => {
      await truffleAssert.reverts(contentDirectory.removeVideoAsCuratorGroupMember(videoId, curatorId))
    })
  })
}
