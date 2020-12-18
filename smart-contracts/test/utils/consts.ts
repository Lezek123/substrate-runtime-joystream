export const RUNTIME_ADDRESS_INDEX = 0
export const COUNCIL_ADDRESS_INDEX = 1
export const MEMBER_1_ADDRESS_INDEX = 2
export const MEMBER_2_ADDRESS_INDEX = 3
export const CURATOR_1_ADDRESS_INDEX = 4
export const CURATOR_2_ADDRESS_INDEX = 5
export const LEAD_ADDRESS_INDEX = 6

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

// Mimic the Solidity enums:
export const ChannelOwnerType = {
  Address: 0,
  Member: 1,
  CuratorGroup: 2,
} as const

// Operation type (for group permission purposes), as defined in Solidity contract (ContentDirectory.sol)
export const OperationType = {
  UpdateChannelMetadata: 0,
  AddVideo: 1,
  UpdateVideoMetadata: 2,
  RemoveVideo: 3,
}

export const MetadataEntityType = {
  Language: 0,
  Category: 1,
  License: 2,
}

// Some test channel / video metadata
export const channelMetadata = JSON.stringify({
  title: 'Test Channel',
  description: 'Test Channel Description',
})

export const channelMetadataUpdate = JSON.stringify({
  title: 'Updated test channel',
})

export const videoMetadata = JSON.stringify({
  title: 'Test Video',
  description: 'TestVideoDescription',
})

export const videoMetadataUpdate = JSON.stringify({
  title: 'Updated test channel',
})

// Example entities metadata
export const languageMetadata = JSON.stringify({
  code: 'DE',
  name: 'German',
})

export const languageMetadataUpdate = JSON.stringify({
  name: 'Deutch',
})
