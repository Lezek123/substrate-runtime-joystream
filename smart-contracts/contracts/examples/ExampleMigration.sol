// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../ContentDirectory.sol";

contract ChannelRewardAccountsStorage is Ownable {
  mapping (uint256 => address) public rewardAccountByChannelId;
  function setChannelRewardAccount(uint256 _channelId, address _account) public onlyOwner {
    rewardAccountByChannelId[_channelId] = _account;
  }
}

// In this example we just simply exapand the functionality
// (during real migration we probably won't extend the old "ContentDirectory",
// but change the contract code in the original file instead)

contract NewContentDirectory is ContentDirectory {
  ChannelRewardAccountsStorage channelRewardAccountsStorage;

  constructor(
    RuntimeAddressProvider _provider,
    MembershipBridge _membershipBridge,
    ContentWorkingGroupBridge _contentWorkingGroupBridge,
    ChannelStorage _channelStorage,
    VideoStorage _videoStorage,
    CuratorGroupStorage _curatorGroupStorage,
    MetadataEntityStorage _metadataEntityStorage,
    ChannelRewardAccountsStorage _channelRewardAccountsStorage
  )
    public
    ContentDirectory(
      _provider,
      _membershipBridge,
      _contentWorkingGroupBridge,
      _channelStorage,
      _videoStorage,
      _curatorGroupStorage,
      _metadataEntityStorage
    )
  { }

  function setChannelRewardAccount (
    uint256 _channelId,
    address _account
  ) public {
    Channel memory channel = channelStorage.getExistingChannel(_channelId);
    require(_hasOwnerAccess(msg.sender, channel.ownership), "Owner access required");
    channelRewardAccountsStorage.setChannelRewardAccount(_channelId, _account);
  }
}
