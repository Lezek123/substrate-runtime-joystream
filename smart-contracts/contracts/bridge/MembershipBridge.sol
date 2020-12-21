// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./auth.sol";

contract MembershipBridge is RuntimeManageable {
  mapping(uint256 => address) public controllerAddressByMemberId;
  mapping(uint256 => bool) public wasMemberSetByRuntime;

  struct MemberPair {
    uint256 id;
    address controllerAddress;
  }

  event MembersInitialized(bool[] _pairsSet);
  event MemberAddressSet(uint256 _memberId, address _address);

  constructor(RuntimeAddressProvider _provider) public RuntimeManageable(_provider) {}

  function setMemberAddress(uint256 _memberId, address _address) public onlyRuntime {
    controllerAddressByMemberId[_memberId] = _address;
    wasMemberSetByRuntime[_memberId] = true;
    emit MemberAddressSet(_memberId, _address);
  }

  function isMemberController(address _address, uint256 _memberId) public view returns (bool) {
    return (memberExists(_memberId) && controllerAddressByMemberId[_memberId] == _address);
  }

  function memberExists(uint256 _memberId) public view returns (bool) {
    return controllerAddressByMemberId[_memberId] != address(0);
  }

  function initializeMembers(MemberPair[] memory _members) public onlyCouncil {
    bool[] memory pairsSet = new bool[](_members.length);
    for (uint256 i = 0; i < _members.length; ++i) {
      if (!wasMemberSetByRuntime[_members[i].id]) {
        controllerAddressByMemberId[_members[i].id] = _members[i].controllerAddress;
        pairsSet[i] = true;
      }
    }

    emit MembersInitialized(pairsSet);
  }
}
