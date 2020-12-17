// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

// Generic representation of ownership, assuming that each possible ownership consists of:
// - Type (ie. Member, Group, Curator etc.), which is represented by uint256 that can be converted to/from enum
// - Identifier (address/id/hash), which is represented by uint256
struct ChannelOwnership {
  uint256 ownershipType;
  uint256 ownerId;
}

// Any change to this struct requires ChannelStorage migration
struct Channel {
  bool isExisting;
  bool isActive;
  ChannelOwnership ownership;
  uint256 videoLimit; // 0 = use default
  string handle;
  OwnershipTransfer ownershipTransfer;
}

// Any change to this struct requires ChannelStorage migration
struct OwnershipTransfer {
  bool isPending;
  ChannelOwnership newOwnership;
}

// A helper library to parse ChannelOwnership.
// New ownership types can be added if needed without the need for migration
// (but changing/removing existing ones would still require migration to new storage)

// WARNING: All contracts that rely on this enum should be re-deployed if the enum itself is changed!
// See: https://hackernoon.com/beware-the-solidity-enums-9v1qa31b2 .
enum ChannelOwnerType {Address, Member, CuratorGroup}

library ChannelOwnershipDecoder {
  function isAddress(ChannelOwnership memory _ownership) internal pure returns (bool) {
    return _ownership.ownershipType == uint256(ChannelOwnerType.Address);
  }

  function isMember(ChannelOwnership memory _ownership) internal pure returns (bool) {
    return _ownership.ownershipType == uint256(ChannelOwnerType.Member);
  }

  function isCuratorGroup(ChannelOwnership memory _ownership) internal pure returns (bool) {
    return _ownership.ownershipType == uint256(ChannelOwnerType.CuratorGroup);
  }

  function asAddress(ChannelOwnership memory _ownership) internal pure returns (address) {
    require(isAddress(_ownership), "asAddress called on non-address ChannelOwnership");
    return address(uint160(_ownership.ownerId));
  }

  function asMember(ChannelOwnership memory _ownership) internal pure returns (uint256) {
    require(isMember(_ownership), "asMember called on non-member ChannelOwnership");
    return _ownership.ownerId;
  }

  function asCuratorGroup(ChannelOwnership memory _ownership) internal pure returns (uint256) {
    require(isCuratorGroup(_ownership), "asCuratorGroup called on non-group ChannelOwnership");
    return _ownership.ownerId;
  }

  function isValid(ChannelOwnership memory _ownership) internal pure returns (bool) {
    if (isAddress(_ownership)) {
      // Check if not empty and doesn't exceed uint160
      return _ownership.ownerId != 0 && uint256(uint160(asAddress(_ownership))) == _ownership.ownerId;
    }
    if (isMember(_ownership) || isCuratorGroup(_ownership)) {
      // Just check if id is not 0
      // (actual member/group existance checks must be performed inside logic contract)
      return _ownership.ownerId != 0;
    }
    // If no variant matches - ownertship is invalid
    return false;
  }
}

contract ChannelStorage is Ownable {
  using SafeMath for uint256;

  mapping(uint256 => Channel) private channelById;
  // ownershipType => ownerId => channelCount double-map
  mapping(uint256 => mapping(uint256 => uint256)) public channelCountByOwnership;
  mapping(string => uint256) public channelIdByHandle;
  uint256 public nextChannelId = 1;

  function _incCountByOwnership(ChannelOwnership memory _ownership) internal {
    uint256 currentCount = channelCountByOwnership[_ownership.ownershipType][_ownership.ownerId];
    channelCountByOwnership[_ownership.ownershipType][_ownership.ownerId] = currentCount.add(1);
  }

  function _decCountByOwnership(ChannelOwnership memory _ownership) internal {
    uint256 currentCount = channelCountByOwnership[_ownership.ownershipType][_ownership.ownerId];
    channelCountByOwnership[_ownership.ownershipType][_ownership.ownerId] = currentCount.sub(1);
  }

  function addChannel(ChannelOwnership memory _ownership, string memory _handle) public onlyOwner returns (uint256) {
    uint256 channelId = nextChannelId;
    // Get storage ref
    Channel storage newChannel = channelById[channelId];
    // Populate the struct
    newChannel.isExisting = true;
    newChannel.isActive = true;
    newChannel.ownership = _ownership;
    newChannel.handle = _handle;
    // Update counters / maps
    channelIdByHandle[_handle] = channelId;
    _incCountByOwnership(_ownership);
    nextChannelId = nextChannelId.add(1);
    return channelId;
  }

  // Get channel + perform existance check
  function getExistingChannel(uint256 _channelId) public view returns (Channel memory) {
    Channel memory channel = channelById[_channelId];
    require(channel.isExisting, "Trying to access unexisting channel");
    return channel;
  }

  function updateOwnership(uint256 _channelId, ChannelOwnership memory _ownership) public onlyOwner {
    Channel storage channel = channelById[_channelId];
    _decCountByOwnership(channel.ownership);
    channel.ownership = _ownership;
    _incCountByOwnership(_ownership);
  }

  function updateStatus(uint256 _channelId, bool _isActive) public onlyOwner {
    Channel storage channel = channelById[_channelId];
    channel.isActive = _isActive;
  }

  function setChannelVideoLimit(uint256 _channelId, uint256 _videoLimit) public onlyOwner {
    Channel storage channel = channelById[_channelId];
    channel.videoLimit = _videoLimit;
  }

  function removeChannel(uint256 _channelId) public onlyOwner {
    _decCountByOwnership(channelById[_channelId].ownership);
    delete channelById[_channelId];
  }

  function setChannelPendingTransfer(uint256 _channelId, ChannelOwnership memory _newOwnership) public onlyOwner {
    Channel storage channel = channelById[_channelId];
    channel.ownershipTransfer = OwnershipTransfer(true, _newOwnership);
  }

  function unsetPendingChannelTransfer(uint256 _channelId) public onlyOwner {
    Channel storage channel = channelById[_channelId];
    delete channel.ownershipTransfer;
  }
}
