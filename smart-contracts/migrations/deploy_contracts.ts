module.exports = (artifacts: Truffle.Artifacts) => {
  const RuntimeAddressProvider = artifacts.require('RuntimeAddressProvider')
  const ContentDirectory = artifacts.require('ContentDirectory')
  const MembershipBridge = artifacts.require('MembershipBridge')
  const ContentWorkingGroupBridge = artifacts.require('ContentWorkingGroupBridge')
  const ChannelStorage = artifacts.require('ChannelStorage')
  const VideoStorage = artifacts.require('VideoStorage')
  const CuratorGroupStorage = artifacts.require('CuratorGroupStorage')
  const MetadataEntityStorage = artifacts.require('MetadataEntityStorage')

  const migration: Truffle.Migration = async (deployer, network, accounts) => {
    let runtimeAddress = '0x2222222222222222222222222222222222222222'
    let councilAddress = '0xcccccccccccccccccccccccccccccccccccccccc'
    if (network === 'development') {
      runtimeAddress = accounts[0]
      councilAddress = accounts[1]
    }
    await deployer.deploy(RuntimeAddressProvider, runtimeAddress, councilAddress)
    await deployer.deploy(MembershipBridge, RuntimeAddressProvider.address)
    await deployer.deploy(ContentWorkingGroupBridge, RuntimeAddressProvider.address)

    await deployer.deploy(ChannelStorage)
    await deployer.deploy(VideoStorage)
    await deployer.deploy(CuratorGroupStorage)
    await deployer.deploy(MetadataEntityStorage)

    await deployer.deploy(
      ContentDirectory,
      RuntimeAddressProvider.address,
      MembershipBridge.address,
      ContentWorkingGroupBridge.address,
      ChannelStorage.address,
      VideoStorage.address,
      CuratorGroupStorage.address,
      MetadataEntityStorage.address
    )

    // Transfer storage contracts ownership to logic contract
    await (await ChannelStorage.deployed()).transferOwnership(ContentDirectory.address)
    await (await VideoStorage.deployed()).transferOwnership(ContentDirectory.address)
    await (await CuratorGroupStorage.deployed()).transferOwnership(ContentDirectory.address)
    await (await MetadataEntityStorage.deployed()).transferOwnership(ContentDirectory.address)
  }

  return migration
}
