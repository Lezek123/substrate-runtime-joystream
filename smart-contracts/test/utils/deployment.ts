import { RUNTIME_ADDRESS_INDEX, COUNCIL_ADDRESS_INDEX } from './consts'

export const RuntimeAddressProvider = artifacts.require('RuntimeAddressProvider')
export const ContentWorkingGroupBridge = artifacts.require('ContentWorkingGroupBridge')
export const MembershipBridge = artifacts.require('MembershipBridge')
export const ChannelStorage = artifacts.require('ChannelStorage')
export const VideoStorage = artifacts.require('VideoStorage')
export const CuratorGroupStorage = artifacts.require('CuratorGroupStorage')
export const ContentDirectory = artifacts.require('ContentDirectory')

// Allows redeploying contracts on beforeEach to make tests fully independent
// TODO: It would be best to run truffle migrations here programatically
// Currently they are only ran once before "contract()" (not before "it()") and
// there seems to be no way to change that
export const redeployContracts = async (accounts: string[]) => {
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

  const instances = {
    contentDirectory,
    membershipBridge,
    contentWorkingGroupBridge,
    runtimeAddressProvider,
    channelStorage: await ChannelStorage.at(await contentDirectory.channelStorage()),
    videoStorage: await VideoStorage.at(await contentDirectory.videoStorage()),
    curatorGroupStorage: await CuratorGroupStorage.at(await contentDirectory.curatorGroupStorage()),
  }

  // console.log(
  //   'Contracts redeployed!',
  //   _.mapValues(instances, (i) => i.address)
  // )

  return instances
}
