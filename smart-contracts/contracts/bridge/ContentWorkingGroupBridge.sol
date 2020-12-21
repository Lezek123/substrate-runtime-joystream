// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./auth.sol";

contract ContentWorkingGroupBridge is RuntimeManageable {
  // A map of curatorId => evmAddress(roleKey)
  mapping(uint256 => address) public addressByCuratorId;
  mapping(uint256 => bool) public wasCuratorSetByRuntime;

  struct CuratorPair {
    uint256 id;
    address roleAddress;
  }

  // evmAddress(roleKey) of current lead
  address public currentLeadAddress;
  bool public wasLeadSetByRuntime;

  // Lead status managed by the council
  bool public isLeadActive = true;

  event CuratorsInitialized(bool[] _pairsSet);
  event LeadInitialized(address _address);
  event CuratorAddressSet(uint256 _curatorId, address _address);
  event LeadAddressSet(address _address);
  event LeadStatusSet(bool _status);

  constructor(RuntimeAddressProvider _provider) public RuntimeManageable(_provider) {}

  function setCuratorAddress(uint256 _curatorId, address _address) public onlyRuntime {
    addressByCuratorId[_curatorId] = _address;
    wasCuratorSetByRuntime[_curatorId] = true;
    emit CuratorAddressSet(_curatorId, _address);
  }

  function setLeadAddress(address _address) public onlyRuntime {
    currentLeadAddress = _address;
    wasLeadSetByRuntime = true;
    emit LeadAddressSet(_address);
  }

  function setLeadStatus(bool _status) public onlyCouncil {
    isLeadActive = _status;
    emit LeadStatusSet(_status);
  }

  function isCurator(address _address, uint256 _curatorId) public view returns (bool) {
    return (curatorExists(_curatorId) && addressByCuratorId[_curatorId] == _address);
  }

  function curatorExists(uint256 _curatorId) public view returns (bool) {
    return addressByCuratorId[_curatorId] != address(0);
  }

  function isActiveLead(address _address) public view returns (bool) {
    return (isLeadActive && currentLeadAddress != address(0) && currentLeadAddress == _address);
  }

  function initializeCurators(CuratorPair[] memory curators) public onlyCouncil {
    bool[] memory pairsSet = new bool[](curators.length);
    for (uint256 i = 0; i < curators.length; ++i) {
      if (!wasCuratorSetByRuntime[curators[i].id]) {
        addressByCuratorId[curators[i].id] = curators[i].roleAddress;
        pairsSet[i] = true;
      }
    }

    emit CuratorsInitialized(pairsSet);
  }

  function initializeLead(address _leadAddress) public onlyCouncil {
    require(!wasLeadSetByRuntime, "Lead address was already set by the runtime");
    currentLeadAddress = _leadAddress;
    emit LeadInitialized(_leadAddress);
  }
}
