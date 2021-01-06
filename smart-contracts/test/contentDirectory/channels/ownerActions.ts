import truffleAssert from 'truffle-assertions'
import _ from 'lodash'
import {
  ChannelOwnerType,
  channelMetadataUpdate,
  videoMetadata,
  videoMetadataUpdate,
  LEAD_ADDRESS_INDEX,
} from '../../utils/consts'
import { getCurrentInstances } from '../../utils/contracts'
import { ChannelStorageInstance, ContentDirectoryInstance, VideoStorageInstance } from 'types/truffle-contracts'

export const testChannelOwnerActionsAllowed = (channelId: number, accounts: string[]): void => {
  let contentDirectory: ContentDirectoryInstance
  let channelStorage: ChannelStorageInstance
  let videoStorage: VideoStorageInstance

  beforeEach(async () => {
    ;({ contentDirectory, channelStorage, videoStorage } = await getCurrentInstances())
  })

  describe('as owner', () => {
    it('can update the channel', async () => {
      const res = await contentDirectory.updateChannelMetadataAsOwner(channelId, channelMetadataUpdate)

      truffleAssert.eventEmitted(
        res,
        'ChannelMetadataUpdated',
        (e: any) => e._id.eqn(channelId) && _.isEqual(e._metadata, channelMetadataUpdate)
      )
    })

    it('can initialize channel ownership transfer', async () => {
      const newOwnership = {
        ownershipType: ChannelOwnerType.Member,
        ownerId: 2,
      }

      await contentDirectory.transferChannelOwnershipAsOwner(channelId, newOwnership)
    })

    it('can remove the channel', async () => {
      await contentDirectory.removeChannelAsOwner(channelId)
      await truffleAssert.reverts(channelStorage.getExistingChannel(channelId))
    })

    it('can publish a video under the channel', async () => {
      const res = await contentDirectory.addVideoAsChannelOwner(channelId, videoMetadata)
      truffleAssert.eventEmitted(
        res,
        'VideoAdded',
        (e: any) => e._id.eqn(channelId) && e._channelId.eqn(channelId) && _.isEqual(e._metadata, videoMetadata)
      )

      await videoStorage.getExistingVideo(1) // Just make sure no error is thrown
      assert.equal((await videoStorage.nextVideoId()).toNumber(), 2)
      assert.equal((await videoStorage.videoCountByChannelId(1)).toNumber(), 1)
    })

    it('can NOT to publish a video under deactivated channel', async () => {
      // Deactivate channel as lead first
      await contentDirectory.deactivateChannel(channelId, 'Test', 1, { from: accounts[LEAD_ADDRESS_INDEX] })
      await truffleAssert.reverts(contentDirectory.addVideoAsChannelOwner(channelId, videoMetadata))
    })
  })
}

export const testChannelOwnerActionsDisallowed = (channelId: number): void => {
  let contentDirectory: ContentDirectoryInstance

  beforeEach(async () => {
    ;({ contentDirectory } = await getCurrentInstances())
  })

  describe('as owner', () => {
    it('can NOT update the channel', async () => {
      await truffleAssert.reverts(contentDirectory.updateChannelMetadataAsOwner(channelId, channelMetadataUpdate))
    })

    it('can NOT initialize channel ownership transfer', async () => {
      const newOwnership = {
        ownershipType: ChannelOwnerType.Member,
        ownerId: 2,
      }

      await truffleAssert.reverts(contentDirectory.transferChannelOwnershipAsOwner(channelId, newOwnership))
    })

    it('can NOT remove the channel', async () => {
      await truffleAssert.reverts(contentDirectory.removeChannelAsOwner(channelId))
    })

    it('can NOT publish a video under the channel', async () => {
      await truffleAssert.reverts(contentDirectory.addVideoAsChannelOwner(channelId, videoMetadata))
    })
  })
}

export const testChannelOwnerVideoActionsAllowed = (videoId: number): void => {
  let contentDirectory: ContentDirectoryInstance
  let videoStorage: VideoStorageInstance

  beforeEach(async () => {
    ;({ contentDirectory, videoStorage } = await getCurrentInstances())
  })

  describe('as owner', () => {
    it('can NOT remove the channel if it has a video', async () => {
      await truffleAssert.reverts(contentDirectory.removeChannelAsOwner(videoId))
    })

    it('can update video under the channel', async () => {
      const res = await contentDirectory.updateVideoMetadataAsChannelOwner(videoId, videoMetadataUpdate)
      truffleAssert.eventEmitted(
        res,
        'VideoMetadataUpdated',
        (e: any) => e._id.eqn(videoId) && _.isEqual(e._metadata, videoMetadataUpdate)
      )
    })

    it('can remove video under the channel', async () => {
      const res = await contentDirectory.removeVideoAsChannelOwner(videoId)
      truffleAssert.eventEmitted(res, 'VideoRemoved', (e: any) => e._id.eqn(videoId))
      await truffleAssert.reverts(videoStorage.getExistingVideo(videoId))
      assert.equal((await videoStorage.videoCountByChannelId(videoId)).toNumber(), 0)
    })
  })
}

export const testChannelOwnerVideoActionsDisallowed = (videoId: number): void => {
  let contentDirectory: ContentDirectoryInstance

  beforeEach(async () => {
    ;({ contentDirectory } = await getCurrentInstances())
  })

  describe('as owner', () => {
    it('can NOT update a video under the channel', async () => {
      await truffleAssert.reverts(contentDirectory.updateVideoMetadataAsChannelOwner(videoId, videoMetadataUpdate))
    })

    it('can NOT remove a video under the channel', async () => {
      await truffleAssert.reverts(contentDirectory.removeVideoAsChannelOwner(videoId))
    })
  })
}
