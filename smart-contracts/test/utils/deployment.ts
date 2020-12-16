import { RUNTIME_ADDRESS_INDEX, COUNCIL_ADDRESS_INDEX } from './consts'

import {
  ContentDirectoryInstance,
  MembershipBridgeInstance,
  ContentWorkingGroupBridgeInstance,
  RuntimeAddressProviderInstance,
  ChannelStorageInstance,
  VideoStorageInstance,
  CuratorGroupStorageInstance,
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
export const ContentDirectory = artifacts.require('ContentDirectory')

export type Contracts = {
  contentDirectory: ContentDirectoryInstance
  membershipBridge: MembershipBridgeInstance
  contentWorkingGroupBridge: ContentWorkingGroupBridgeInstance
  runtimeAddressProvider: RuntimeAddressProviderInstance
  channelStorage: ChannelStorageInstance
  videoStorage: VideoStorageInstance
  curatorGroupStorage: CuratorGroupStorageInstance
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
  const contentDirectory = await ContentDirectory.new(
    runtimeAddressProvider.address,
    membershipBridge.address,
    contentWorkingGroupBridge.address
  )

  currentInstances.runtimeAddressProvider = runtimeAddressProvider
  currentInstances.membershipBridge = membershipBridge
  currentInstances.contentWorkingGroupBridge = contentWorkingGroupBridge
  currentInstances.contentDirectory = contentDirectory
  currentInstances.channelStorage = await ChannelStorage.at(await contentDirectory.channelStorage())
  currentInstances.videoStorage = await VideoStorage.at(await contentDirectory.videoStorage())
  currentInstances.curatorGroupStorage = await CuratorGroupStorage.at(await contentDirectory.curatorGroupStorage())

  contractsInitialized = true
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
