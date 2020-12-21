import { RUNTIME_ADDRESS_INDEX, COUNCIL_ADDRESS_INDEX, ZERO_ADDRESS } from './consts'

import {
  ContentDirectoryInstance,
  MembershipBridgeInstance,
  ContentWorkingGroupBridgeInstance,
  RuntimeAddressProviderInstance,
  ChannelStorageInstance,
  VideoStorageInstance,
  CuratorGroupStorageInstance,
  MetadataEntityStorageInstance,
} from '../../types/truffle-contracts'

import _ from 'lodash'
import Debug from 'debug'

const debug = Debug('Contracts')

export const RuntimeAddressProvider = artifacts.require('RuntimeAddressProvider')
export const ContentWorkingGroupBridge = artifacts.require('ContentWorkingGroupBridge')
export const MembershipBridge = artifacts.require('MembershipBridge')
export const ChannelStorage = artifacts.require('ChannelStorage')
export const VideoStorage = artifacts.require('VideoStorage')
export const CuratorGroupStorage = artifacts.require('CuratorGroupStorage')
export const MetadataEntityStorage = artifacts.require('MetadataEntityStorage')
export const ContentDirectory = artifacts.require('ContentDirectory')

// Example upgrade
export const NewContentDirectory = artifacts.require('NewContentDirectory')
export const ChannelRewardAccountsStorage = artifacts.require('ChannelRewardAccountsStorage')

export type Contracts = {
  contentDirectory: ContentDirectoryInstance
  membershipBridge: MembershipBridgeInstance
  contentWorkingGroupBridge: ContentWorkingGroupBridgeInstance
  runtimeAddressProvider: RuntimeAddressProviderInstance
  channelStorage: ChannelStorageInstance
  videoStorage: VideoStorageInstance
  curatorGroupStorage: CuratorGroupStorageInstance
  metadataEntityStorage: MetadataEntityStorageInstance
}

let contractsInitialized = false
const currentInstances: Partial<Contracts> = {}

// Allows redeploying contracts on beforeEach to make tests fully independent
// TODO: It would be best to run truffle migrations here programatically
// Currently they are only ran once before "contract()" (not before "it()") and
// there seems to be no way to change that
export const redeployContracts = async (accounts: string[]): Promise<void> => {
  const RUNTIME_ADDRESS = accounts[RUNTIME_ADDRESS_INDEX]
  const COUNCIL_ADDRESS = accounts[COUNCIL_ADDRESS_INDEX]

  const runtimeAddressProvider = await RuntimeAddressProvider.new(RUNTIME_ADDRESS, COUNCIL_ADDRESS)
  const membershipBridge = await MembershipBridge.new(runtimeAddressProvider.address)
  const contentWorkingGroupBridge = await ContentWorkingGroupBridge.new(runtimeAddressProvider.address)
  const channelStorage = await ChannelStorage.new()
  const videoStorage = await VideoStorage.new()
  const curatorGroupStorage = await CuratorGroupStorage.new()
  const metadataEntityStorage = await MetadataEntityStorage.new()
  const contentDirectory = await ContentDirectory.new(
    runtimeAddressProvider.address,
    membershipBridge.address,
    contentWorkingGroupBridge.address,
    channelStorage.address,
    videoStorage.address,
    curatorGroupStorage.address,
    metadataEntityStorage.address
  )

  // Transfer storage ownerships
  await channelStorage.transferOwnership(contentDirectory.address)
  await videoStorage.transferOwnership(contentDirectory.address)
  await curatorGroupStorage.transferOwnership(contentDirectory.address)
  await metadataEntityStorage.transferOwnership(contentDirectory.address)

  currentInstances.runtimeAddressProvider = runtimeAddressProvider
  currentInstances.membershipBridge = membershipBridge
  currentInstances.contentWorkingGroupBridge = contentWorkingGroupBridge
  currentInstances.contentDirectory = contentDirectory
  currentInstances.channelStorage = channelStorage
  currentInstances.videoStorage = videoStorage
  currentInstances.curatorGroupStorage = curatorGroupStorage
  currentInstances.metadataEntityStorage = metadataEntityStorage

  contractsInitialized = true

  if (process.env.UPGRADE) {
    // Run example upgrade after each redeployment
    await upgradeContracts(accounts)
  }
}

export const upgradeContracts = async (accounts: string[]): Promise<void> => {
  if (!contractsInitialized) {
    throw new Error('Cannot upgrade contracts - test contracts not yet initialized!')
  }

  // Get previously deployed contract instances
  const {
    runtimeAddressProvider,
    membershipBridge,
    contentWorkingGroupBridge,
    channelStorage,
    videoStorage,
    curatorGroupStorage,
    metadataEntityStorage,
    contentDirectory,
  } = currentInstances as Contracts

  // Deploy new storage contract
  const channelRewardAccountsStorage = await ChannelRewardAccountsStorage.new()

  const newContentDirectory = await NewContentDirectory.new(
    runtimeAddressProvider.address,
    membershipBridge.address,
    contentWorkingGroupBridge.address,
    channelStorage.address,
    videoStorage.address,
    curatorGroupStorage.address,
    metadataEntityStorage.address,
    channelRewardAccountsStorage.address
  )

  // Run migrate function of old content directory contract in order to transfer ownerships
  // (this part will be done by the council through proposal)
  await contentDirectory.migrate(newContentDirectory.address, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, {
    from: accounts[COUNCIL_ADDRESS_INDEX],
  })

  currentInstances.contentDirectory = newContentDirectory

  debug('Running example contracts upgrade')
}

export const getCurrentInstances = async (): Promise<Contracts> => {
  if (!contractsInitialized) {
    throw new Error('Test contract not yet initialized!')
  }

  debug(
    'Fetching new contract instances!',
    _.mapValues(currentInstances as Contracts, (i) => i.address)
  )

  return currentInstances as Contracts
}

export const setDefaultCaller = (address: string) => {
  ;(ContentDirectory as any).defaults({ from: address })
  ;(MembershipBridge as any).defaults({ from: address })
  ;(ContentWorkingGroupBridge as any).defaults({ from: address })
}
