// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract MetadataEntityStorage is Ownable {
  mapping(uint256 => mapping(uint256 => bool)) public metadataEntityExistsByTypeById;
  mapping(uint256 => uint256) public nextEntityIdByType;

  using SafeMath for uint256;

  function addMetadataEntity(uint256 _type) public onlyOwner returns (uint256) {
    uint256 entityId = nextEntityIdByType[_type];
    metadataEntityExistsByTypeById[_type][entityId] = true;
    nextEntityIdByType[_type] = nextEntityIdByType[_type].add(1);
    return entityId;
  }

  function removeMetadataEntity(uint256 _type, uint256 _id) public onlyOwner {
    metadataEntityExistsByTypeById[_type][_id] = false;
  }
}
