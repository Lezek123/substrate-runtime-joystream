import { VideoMetadataV1, IVideoMetadataV1 } from '@joystream/cd-smart-contracts/protobuffs'
import { VideoMetadata } from '@joystream/cd-smart-contracts/metadata/types'
import { VideoMetadataSchema } from '@joystream/cd-smart-contracts/metadata/json-schemas'
import { ContentId } from '@joystream/types/media'
import { registry } from '@joystream/types'
import { applyFieldMask } from 'protobuf-fieldmask'
import _, { MergeWithCustomizer } from 'lodash'
import Ajv from 'ajv'

// Code-snippets / examples of using protobufs and json schemas for video creation, validation and updates
// Can be ran with "yarn ts-node --files ./example.ts"

const videoMetadata: VideoMetadata = {
  title: 'Example title',
  description: 'Example description',
  categoryId: 1,
  languageId: 1,
  hasMarketing: true,
  isExplicit: false,
  isPublic: true,
  duration: 123,
  thumbnailUrl: 'https://example.com/thumbnail.png',
  publishedBeforeJoystream: Math.floor(Date.now() / 1000),
  license: {
    knownLicense: {
      knownLicenseId: 1,
      attribution: 'Example attribution',
    },
  },
  media: {
    location: {
      joystreamMediaLocation: {
        dataObjectId: ContentId.generate(registry).encode(),
      },
    },
    pixelWidth: 800,
    pixelHeight: 600,
    encodingId: 1,
  },
}

const encodedVideoMetadata = VideoMetadataV1.encode(videoMetadata).finish()

console.log('\n\nCreation:\n')
console.log(`Protobuf encoded size: ${encodedVideoMetadata.length} bytes`)
console.log(`JSON size: ${Buffer.from(JSON.stringify(videoMetadata)).length} bytes`)

const decodedVideoMetadata = VideoMetadataV1.decode(encodedVideoMetadata)

console.log('Decoded video metadata:', decodedVideoMetadata.toJSON())

// Validate decoded entity:
const ajv = new Ajv({ allErrors: true })
const valid = ajv.validate(VideoMetadataSchema, decodedVideoMetadata.toJSON()) as boolean

if (valid) {
  console.log('Video metadata is valid!')
} else {
  console.log('Video metadata is invalid!', ajv.errorsText())
}

// Updates:
const videoUpdate: IVideoMetadataV1 = {
  title: 'New title',
  publishedBeforeJoystream: null, // Example of "unsetting" a field
  license: {
    userDefinedLicense: {
      content: 'Test user-defined license content', // Example of nested update with changed license type
    },
  },
  media: {
    pixelWidth: 1024, // Example of "simple" nested update
    pixelHeight: 764,
  },
}

// Field mask describes which fields to update
// (otherwise, for example, we can't tell if we should update a field to empty value or just not update it at all)
// It should be send along with VideoMetadata in video update operation request (ie. as simple string array)
const fieldMask = [
  'title',
  'publishedBeforeJoystream',
  // Note that if the license type doesn't change we can use more specific FieldMask, ie. "license.knownLicense.attribution"
  'license',
  'media.pixelWidth',
  'media.pixelHeight',
]

const encodedVideoUpdate = VideoMetadataV1.encode(videoUpdate).finish()
const decodedVideoUpdate = VideoMetadataV1.decode(encodedVideoUpdate)
const updateObj = applyFieldMask(decodedVideoUpdate.toJSON(), fieldMask)

console.log('\n\nUpdate:\n')
console.log('Update fieldmask:', fieldMask)
console.log('Decoded update with applied fieldmask:', updateObj)

const createMergeCustomizer = (fieldMask: string[]): MergeWithCustomizer => {
  return (origValue, mergeValue, key) => {
    if (_.isUndefined(mergeValue)) {
      return null
    }
    if (fieldMask.includes(key)) {
      // This prevents recursive merge if fieldmask includes given property key (ie. license)
      return mergeValue
    }
  }
}

const updatedVideo = _.mergeWith(decodedVideoMetadata.toJSON(), updateObj, createMergeCustomizer(fieldMask))

console.log('Video after update:', updatedVideo)

// Validate updated video
const updatedVideoValid = ajv.validate(VideoMetadataSchema, updatedVideo) as boolean
if (updatedVideoValid) {
  console.log('Updated video is valid!')
} else {
  console.log('Updated video is not valid!', ajv.errorsText())
}
