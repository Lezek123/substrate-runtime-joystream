// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

// TODO: Interfaces
import "./storage/ChannelStorage.sol";
import "./storage/CuratorGroupStorage.sol";
import "./storage/VideoStorage.sol";

import "./bridge/MembershipBridge.sol";
import "./bridge/ContentWorkingGroupBridge.sol";
import "./bridge/auth.sol";

import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ContentDirectory is RuntimeManageable, Pausable {
  // Storage contracts
  ChannelStorage public channelStorage;
  VideoStorage public videoStorage;
  CuratorGroupStorage public curatorGroupStorage;
  // "Bridge" contracts
  MembershipBridge public membershipBridge;
  ContentWorkingGroupBridge public contentWorkingGroupBridge;

  // Limits
  // (they can me "migrated" just be setting a default value here, so no need to keep them in a separate storage)
  uint256 public channelInstancesLimit = 10;
  uint256 public videosPerChannelDefaultLimit = 5;
  uint256 public videosPerChannelMaxLimit = 1000;

  // Enum + constant related to group permissions
  enum ContentDirectoryOperation {UpdateChannelMetadata, AddVideo, UpdateVideoMetadata, RemoveVideo}
  uint256 constant GROUP_PERMISSIONS_FLAGS_LENGTH = 4;

  // Reason validation consts
  uint256 constant DEACTIVATE_CHANNEL_REASON_MIN_LENGTH = 2;
  uint256 constant DEACTIVATE_VIDEO_REASON_MIN_LENGTH = 2;
  uint256 constant REMOVE_VIDEO_REASON_MIN_LENGTH = 2;

  // Limits change events
  event ChannelInstancesLimitUpdated(uint256 _newLimit);
  event VideosPerChannelDefaultLimitUpdated(uint256 _newLimit);
  event VideosPerChannelMaxLimitUpdated(uint256 _newLimit);

  // Migration event
  event Migrated(address _logic, address _videoStorage, address _channelStorage, address _curatorGroupStorage);

  // Channel-related events
  event ChannelCreated(uint256 _id, ChannelOwnership _ownership, string _metadata);
  event ChannelMetadataUpdated(uint256 _id, string _metadata);
  event ChannelOwnershipUpdated(uint256 _id, ChannelOwnership _ownership);
  event ChannelVideoLimitUpdated(uint256 _id, uint256 _newLimit);
  event ChannelDeactivated(uint256 _id, string _reason);
  event ChannelReactivated(uint256 _id);
  event ChannelRemoved(uint256 _id);

  // CuratorGroup-related events
  event CuratorGroupCreated(uint256 _groupId, bool[] _permissions);
  event CuratorGroupPermissionsUpdated(uint256 _groupId, bool[] _permissions);
  event CuratorAddedToGroup(uint256 _curatorId, uint256 _groupId);
  event CuratorRemovedFromGroup(uint256 _curatorId, uint256 _groupId);
  event CuratorRemovedFromAllGroups(uint256 _curatorId);
  event CuratorGroupRemoved(uint256 _groupId);

  // Video-related events
  event VideoAdded(uint256 _id, uint256 _channelId, string _metadata);
  event VideoMetadataUpdated(uint256 _id, string _metadata);
  event VideoRemoved(uint256 _id);
  event VideoRemovedByCurator(uint256 _id, string _reason);
  event VideoDeactivated(uint256 _id, string _reason);
  event VideoReactivated(uint256 _id);

  // Common modifiers/helpers
  function _isActiveLead(address _address) internal view returns (bool) {
    return contentWorkingGroupBridge.isActiveLead(_address);
  }

  function _isCurator(address _address, uint256 _curatorId) internal view returns (bool) {
    return contentWorkingGroupBridge.isCurator(_address, _curatorId);
  }

  modifier onlyLead() {
    require(_isActiveLead(msg.sender), "Active lead access required!");
    _;
  }

  // Pause/unpause contract (can be done through proposal)
  function pause() public onlyCouncil {
    _pause();
  }

  function unpause() public onlyCouncil {
    _unpause();
  }

  // Limit setters that can be called via proposal module
  function setChannelInstancesLimit(uint256 _newLimit) public onlyCouncil whenNotPaused {
    channelInstancesLimit = _newLimit;
    emit ChannelInstancesLimitUpdated(_newLimit);
  }

  function setVideosPerChannelDefaultLimit(uint256 _newLimit) public onlyCouncil whenNotPaused {
    require(
      _newLimit <= videosPerChannelMaxLimit,
      "videosPerChannelDefaultLimit cannot exceed current videosPerChannelMaxLimit"
    );
    videosPerChannelDefaultLimit = _newLimit;
    emit VideosPerChannelDefaultLimitUpdated(_newLimit);
  }

  function setVideosPerChannelMaxLimit(uint256 _newLimit) public onlyCouncil whenNotPaused {
    require(
      _newLimit >= videosPerChannelDefaultLimit,
      "videosPerChannelMaxLimit must be greater than or equal to videosPerChannelDefaultLimit"
    );
    videosPerChannelMaxLimit = _newLimit;
    emit VideosPerChannelMaxLimitUpdated(_newLimit);
  }

  constructor(
    RuntimeAddressProvider _provider,
    MembershipBridge _membershipBridge,
    ContentWorkingGroupBridge _contentWorkingGroupBridge
  )
    public
    // TODO: The upgraded logic contract would take those as args:
    // ChannelStorage _channelStorage,
    // VideoStorage _videoStorage,
    // CuratorGroupStorage _curatorGroupStorage
    RuntimeManageable(_provider)
  {
    membershipBridge = _membershipBridge;
    contentWorkingGroupBridge = _contentWorkingGroupBridge;
    channelStorage = new ChannelStorage();
    videoStorage = new VideoStorage();
    curatorGroupStorage = new CuratorGroupStorage();
  }

  // Faciliates migration to new logic contract
  function migrate(
    address _newLogic,
    address _newVideoStorage,
    address _newChannelStorage,
    address _newCuratorGroupStorage
  ) public onlyCouncil {
    _migrateStorage(address(videoStorage), _newVideoStorage, _newLogic);
    _migrateStorage(address(channelStorage), _newChannelStorage, _newLogic);
    _migrateStorage(address(curatorGroupStorage), _newCuratorGroupStorage, _newLogic);
    emit Migrated(
      _newLogic,
      _newVideoStorage == address(0) ? address(videoStorage) : _newVideoStorage,
      _newChannelStorage == address(0) ? address(channelStorage) : _newChannelStorage,
      _newCuratorGroupStorage == address(0) ? address(curatorGroupStorage) : _newCuratorGroupStorage
    );
    selfdestruct(msg.sender);
  }

  function _migrateStorage(
    address _oldStorageAddress,
    address _newStorageAddress,
    address _newLogicAddress
  ) internal {
    if (_newStorageAddress != address(0)) {
      // TODO: Set upgraded storage contract owner
    }
    Ownable oldStorage = Ownable(_oldStorageAddress);
    oldStorage.transferOwnership(_newLogicAddress);
  }

  // CHANNELS
  using ChannelOwnershipDecoder for ChannelOwnership;

  // Access/validation utils:
  function _validateOwnership(ChannelOwnership memory _ownership) internal view {
    require(_ownership.isValid(), "Invalid ownership data"); // Basic check

    if (_ownership.isMember()) {
      // Member ownership - existance check
      require(membershipBridge.memberExists(_ownership.asMember()), "Member ownership - member does not exist!");
      return;
    }

    if (_ownership.isCuratorGroup()) {
      // Group ownership - existance check
      require(
        curatorGroupStorage.groupExists(_ownership.asCuratorGroup()),
        "CuratorGroup ownership - group does not exist!"
      );
      return;
    }
  }

  function _hasOwnerAccess(address _address, ChannelOwnership memory _ownership) internal view returns (bool) {
    if (_ownership.isAddress()) {
      return _address == _ownership.asAddress();
    }

    if (_ownership.isMember()) {
      return membershipBridge.isMemberController(_address, _ownership.asMember());
    }

    if (_ownership.isCuratorGroup()) {
      // Only lead can act as owner of group channel
      return contentWorkingGroupBridge.isActiveLead(_address);
    }

    assert(false); // Ensure all cases are covered
  }

  function _canCurate(
    address _address,
    uint256 _curatorId,
    ChannelOwnership memory _ownership
  ) internal view returns (bool) {
    return _ownership.isCuratorGroup() ? _isActiveLead(_address) : _isCurator(_address, _curatorId);
  }

  function _hasGroupAccessToOperation(
    address _address,
    uint256 _curatorId,
    ChannelOwnership memory _ownership,
    ContentDirectoryOperation _operation
  ) internal view returns (bool) {
    return (_ownership.isCuratorGroup() &&
      _isCurator(_address, _curatorId) &&
      curatorGroupStorage.isCuratorInExistingGroup(_curatorId, _ownership.asCuratorGroup()) &&
      curatorGroupStorage.getExistingGroup(_ownership.asCuratorGroup()).permissions[uint256(_operation)] == true);
  }

  // Channel operations:
  function createChannel(ChannelOwnership memory _ownership, string memory _metadata) public whenNotPaused {
    _validateOwnership(_ownership);
    require(channelStorage.nextChannelId() <= channelInstancesLimit, "Channel instances limit reached");
    require(_hasOwnerAccess(msg.sender, _ownership), "Access denied under provided ownership");
    uint256 channelId = channelStorage.addChannel(_ownership);
    emit ChannelCreated(channelId, _ownership, _metadata);
  }

  function updateChannelMetadata(uint256 _channelId, string memory _metadata) public whenNotPaused {
    Channel memory channel = channelStorage.getExistingChannel(_channelId);
    require(_hasOwnerAccess(msg.sender, channel.ownership), "Owner access required");
    emit ChannelMetadataUpdated(_channelId, _metadata);
  }

  // updateChannelMetadata overload with curator context (_curatorId)
  function updateChannelMetadataAsCurator(
    uint256 _channelId,
    string memory _metadata,
    uint256 _curatorId
  ) public whenNotPaused {
    Channel memory channel = channelStorage.getExistingChannel(_channelId);
    require(
      _canCurate(msg.sender, _curatorId, channel.ownership) ||
        _hasGroupAccessToOperation(
          msg.sender,
          _curatorId,
          channel.ownership,
          ContentDirectoryOperation.UpdateChannelMetadata
        ),
      "Access denied"
    );
    emit ChannelMetadataUpdated(_channelId, _metadata);
  }

  function updateChannelOwnership(uint256 _channelId, ChannelOwnership memory _ownership) public whenNotPaused {
    Channel memory channel = channelStorage.getExistingChannel(_channelId);
    require(_hasOwnerAccess(msg.sender, channel.ownership), "Owner access required");
    _validateOwnership(_ownership);
    require(
      !_ownership.isCuratorGroup() || _isActiveLead(msg.sender),
      "Only lead can update ownership to CuratorGroup"
    );
    channelStorage.updateOwnership(_channelId, _ownership);
    emit ChannelOwnershipUpdated(_channelId, _ownership);
  }

  function updateChannelVideoLimit(
    uint256 _channelId,
    uint256 _limit, // Note that "0" here would mean "use currently default limit"
    uint256 _curatorId
  ) public whenNotPaused {
    Channel memory channel = channelStorage.getExistingChannel(_channelId);
    require(_canCurate(msg.sender, _curatorId, channel.ownership), "Access denied");
    require(_limit <= videosPerChannelMaxLimit, "The limit cannot exceed global videosPerChannelMaxLimit");
    channelStorage.setChannelVideoLimit(_channelId, _limit);
    emit ChannelVideoLimitUpdated(_channelId, _limit);
  }

  function deactivateChannel(
    uint256 _channelId,
    string memory _reason,
    uint256 _curatorId
  ) public whenNotPaused {
    Channel memory channel = channelStorage.getExistingChannel(_channelId);
    require(_canCurate(msg.sender, _curatorId, channel.ownership), "Access denied");
    require(channel.isActive, "Channel already deactivated");
    require(bytes(_reason).length >= DEACTIVATE_CHANNEL_REASON_MIN_LENGTH, "The reason is too short");
    channelStorage.updateStatus(_channelId, false);
    emit ChannelDeactivated(_channelId, _reason);
  }

  function activateChannel(uint256 _channelId, uint256 _curatorId) public whenNotPaused {
    Channel memory channel = channelStorage.getExistingChannel(_channelId);
    require(_canCurate(msg.sender, _curatorId, channel.ownership), "Access denied");
    require(!channel.isActive, "Channel already active");
    channelStorage.updateStatus(_channelId, true);
    emit ChannelReactivated(_channelId);
  }

  function removeChannel(uint256 _channelId) public whenNotPaused {
    Channel memory channel = channelStorage.getExistingChannel(_channelId);
    require(_hasOwnerAccess(msg.sender, channel.ownership), "Owner access required");
    require(videoStorage.videoCountByChannelId(_channelId) == 0, "Cannot remove a channel unless it has no videos");
    channelStorage.removeChannel(_channelId);
    emit ChannelRemoved(_channelId);
  }

  // CURATOR GROUPS

  function createCuratorGroup(bool[] memory _permissions) public whenNotPaused onlyLead {
    require(_permissions.length == GROUP_PERMISSIONS_FLAGS_LENGTH, "Invalid permissions array length");
    uint256 groupId = curatorGroupStorage.addGroup(_permissions);
    emit CuratorGroupCreated(groupId, _permissions);
  }

  function updateCuratorGroupPermissions(uint256 _groupId, bool[] memory _permissions) public whenNotPaused onlyLead {
    require(_permissions.length == GROUP_PERMISSIONS_FLAGS_LENGTH, "Invalid permissions array length");
    curatorGroupStorage.setGroupPermissions(_groupId, _permissions);
    emit CuratorGroupPermissionsUpdated(_groupId, _permissions);
  }

  function addCuratorToGroup(uint256 _curatorId, uint256 _groupId) public whenNotPaused onlyLead {
    require(contentWorkingGroupBridge.curatorExists(_curatorId), "Curator id not recognized");
    require(curatorGroupStorage.groupExists(_groupId), "Group id not recognized");
    require(
      curatorGroupStorage.isCuratorInExistingGroup(_curatorId, _groupId) == false,
      "Curator is already in the group"
    );
    curatorGroupStorage.addCuratorToGroup(_curatorId, _groupId);
    emit CuratorAddedToGroup(_curatorId, _groupId);
  }

  function removeCuratorFromGroup(uint256 _curatorId, uint256 _groupId) public whenNotPaused onlyLead {
    // We don't validate if curator exists here, it's enough to check that isCuratorInGroup == true
    require(curatorGroupStorage.groupExists(_groupId), "Group id not recognized");
    require(
      curatorGroupStorage.isCuratorInExistingGroup(_curatorId, _groupId) == true,
      "Curator is already not in the group"
    );
    curatorGroupStorage.removeCuratorFromGroup(_curatorId, _groupId);
    emit CuratorRemovedFromGroup(_curatorId, _groupId);
  }

  function removeCuratorFromAllGroups(uint256 _curatorId) public whenNotPaused onlyLead {
    require(contentWorkingGroupBridge.curatorExists(_curatorId), "Curator id not recognized");
    curatorGroupStorage.removeCuratorFromAllGroups(_curatorId);
    emit CuratorRemovedFromAllGroups(_curatorId);
  }

  function removeCuratorGroup(uint256 _groupId) public whenNotPaused onlyLead {
    Group memory group = curatorGroupStorage.getExistingGroup(_groupId);
    require(group.curatorsCount == 0, "Group's curators count needs to be 0");
    require(
      channelStorage.channelCountByOwnership(uint256(ChannelOwnerType.CuratorGroup), _groupId) == 0,
      "Group's channels count needs to be 0"
    );
    curatorGroupStorage.removeGroup(_groupId);
    emit CuratorGroupRemoved(_groupId);
  }

  // VIDEOS
  function addVideo(uint256 _channelId, string memory _metadata) public whenNotPaused {
    Channel memory channel = channelStorage.getExistingChannel(_channelId);
    require(_hasOwnerAccess(msg.sender, channel.ownership), "Owner access required");
    require(channel.isActive, "Cannot add video to a channel that isn't active");
    uint256 channelVideoLimit = channel.videoLimit != 0 ? channel.videoLimit : videosPerChannelDefaultLimit;
    require(videoStorage.videoCountByChannelId(_channelId) < channelVideoLimit);
    uint256 videoId = videoStorage.addVideo(_channelId);
    emit VideoAdded(videoId, _channelId, _metadata);
  }

  // addVideo - curator context overload
  function addVideoAsCurator(
    uint256 _channelId,
    string memory _metadata,
    uint256 _curatorId
  ) public whenNotPaused {
    Channel memory channel = channelStorage.getExistingChannel(_channelId);
    require(
      _hasGroupAccessToOperation(msg.sender, _curatorId, channel.ownership, ContentDirectoryOperation.AddVideo),
      "Access denied"
    );
    require(channel.isActive, "Cannot add video to a channel that isn't active");
    uint256 channelVideoLimit = channel.videoLimit != 0 ? channel.videoLimit : videosPerChannelDefaultLimit;
    require(videoStorage.videoCountByChannelId(_channelId) < channelVideoLimit);
    uint256 videoId = videoStorage.addVideo(_channelId);
    emit VideoAdded(videoId, _channelId, _metadata);
  }

  function updateVideoMetadata(uint256 _videoId, string memory _metadata) public whenNotPaused {
    Video memory video = videoStorage.getExistingVideo(_videoId);
    Channel memory channel = channelStorage.getExistingChannel(video.channelId);
    require(_hasOwnerAccess(msg.sender, channel.ownership), "Owner access required");
    emit VideoMetadataUpdated(_videoId, _metadata);
  }

  // updateVideoMetadata - curator context overload
  function updateVideoMetadataAsCurator(
    uint256 _videoId,
    string memory _metadata,
    uint256 _curatorId
  ) public whenNotPaused {
    Video memory video = videoStorage.getExistingVideo(_videoId);
    Channel memory channel = channelStorage.getExistingChannel(video.channelId);
    require(
      _hasGroupAccessToOperation(
        msg.sender,
        _curatorId,
        channel.ownership,
        ContentDirectoryOperation.UpdateVideoMetadata
      ) || _canCurate(msg.sender, _curatorId, channel.ownership),
      "Access denied"
    );
    emit VideoMetadataUpdated(_videoId, _metadata);
  }

  function removeVideo(uint256 _videoId) public whenNotPaused {
    Video memory video = videoStorage.getExistingVideo(_videoId);
    Channel memory channel = channelStorage.getExistingChannel(video.channelId);
    require(_hasOwnerAccess(msg.sender, channel.ownership), "Owner access required");
    videoStorage.removeVideo(_videoId);
    emit VideoRemoved(_videoId);
  }

  // removeVideo - group channel video removal overload
  function removeGroupChannelVideoAsCurator(uint256 _videoId, uint256 _curatorId) public whenNotPaused {
    Video memory video = videoStorage.getExistingVideo(_videoId);
    Channel memory channel = channelStorage.getExistingChannel(video.channelId);
    require(channel.ownership.isCuratorGroup(), "The video does not belong to Curator Group channel");
    require(
      _hasGroupAccessToOperation(msg.sender, _curatorId, channel.ownership, ContentDirectoryOperation.RemoveVideo),
      "Access denied"
    );
    videoStorage.removeVideo(_videoId);
    emit VideoRemoved(_videoId);
  }

  // removeVideo - curator context + reason overload
  function removeVideoAsCurator(
    uint256 _videoId,
    uint256 _curatorId,
    string memory _reason
  ) public whenNotPaused {
    Video memory video = videoStorage.getExistingVideo(_videoId);
    Channel memory channel = channelStorage.getExistingChannel(video.channelId);
    require(_canCurate(msg.sender, _curatorId, channel.ownership), "Access denied");
    require(bytes(_reason).length > REMOVE_VIDEO_REASON_MIN_LENGTH, "The reason is too short");
    videoStorage.removeVideo(_videoId);
    emit VideoRemovedByCurator(_videoId, _reason);
  }

  function deactivateVideo(
    uint256 _videoId,
    string memory _reason,
    uint256 _curatorId
  ) public whenNotPaused {
    Video memory video = videoStorage.getExistingVideo(_videoId);
    Channel memory channel = channelStorage.getExistingChannel(video.channelId);
    require(_canCurate(msg.sender, _curatorId, channel.ownership), "Access denied");
    require(video.isActive, "Video already deactivated");
    require(bytes(_reason).length >= DEACTIVATE_VIDEO_REASON_MIN_LENGTH, "The reason is too short");
    videoStorage.updateStatus(_videoId, false);
    emit VideoDeactivated(_videoId, _reason);
  }

  function activateVideo(uint256 _videoId, uint256 _curatorId) public whenNotPaused {
    Video memory video = videoStorage.getExistingVideo(_videoId);
    Channel memory channel = channelStorage.getExistingChannel(video.channelId);
    require(_canCurate(msg.sender, _curatorId, channel.ownership), "Access denied");
    require(!video.isActive, "Video already active");
    videoStorage.updateStatus(_videoId, true);
    emit VideoReactivated(_videoId);
  }
}
