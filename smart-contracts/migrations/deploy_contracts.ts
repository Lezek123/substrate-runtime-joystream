module.exports = (artifacts: Truffle.Artifacts) => {
  const RuntimeAddressProvider = artifacts.require('RuntimeAddressProvider')
  const ContentDirectory = artifacts.require('ContentDirectory')
  const MembershipBridge = artifacts.require('MembershipBridge')
  const ContentWorkingGroupBridge = artifacts.require('ContentWorkingGroupBridge')

  const migration: Truffle.Migration = async (deployer, network, accounts) => {
    let runtimeAddress = '0x2222222222222222222222222222222222222222'
    let councilAddress = '0xcccccccccccccccccccccccccccccccccccccccc'
    if (network === 'development') {
      runtimeAddress = accounts[0]
      councilAddress = accounts[1]
    }
    await deployer.deploy(RuntimeAddressProvider, runtimeAddress, councilAddress)
    await deployer.deploy(RuntimeAddressProvider, runtimeAddress, councilAddress)
    await deployer.deploy(MembershipBridge, RuntimeAddressProvider.address)
    await deployer.deploy(ContentWorkingGroupBridge, RuntimeAddressProvider.address)
    await deployer.deploy(
      ContentDirectory,
      RuntimeAddressProvider.address,
      MembershipBridge.address,
      ContentWorkingGroupBridge.address
    )
  }

  return migration
}
