// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "./auth.sol";

contract MembershipBridge is RuntimeManageable {
  mapping(uint256 => address) private controllerAddressByMemberId;

  constructor(RuntimeAddressProvider _provider) public RuntimeManageable(_provider) {}

  function setMemberAddress(uint256 _memberId, address _address) public onlyRuntime {
    controllerAddressByMemberId[_memberId] = _address;
  }

  function isMemberController(address _address, uint256 _memberId) public view returns (bool) {
    return (memberExists(_memberId) && controllerAddressByMemberId[_memberId] == _address);
  }

  function memberExists(uint256 _memberId) public view returns (bool) {
    return controllerAddressByMemberId[_memberId] != address(0);
  }
}
