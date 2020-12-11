// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

// Any change to this struct requires VideoStorage migration
struct Video {
  uint256 channelId;
  bool isActive;
  bool isExisting;
}

contract VideoStorage is Ownable {
  using SafeMath for uint256;

  mapping(uint256 => Video) private videoById;
  mapping(uint256 => uint256) public videoCountByChannelId;
  uint256 public nextVideoId = 1;

  function addVideo(uint256 _channelId) public onlyOwner returns (uint256) {
    uint256 videoId = nextVideoId;
    // Get storage ref
    Video storage newVideo = videoById[videoId];
    // Populate the struct
    newVideo.isExisting = true;
    newVideo.isActive = true;
    newVideo.channelId = _channelId;
    // Update counters
    videoCountByChannelId[_channelId] = videoCountByChannelId[_channelId].add(1);
    nextVideoId = nextVideoId.add(1);
    return videoId;
  }

  // Get video + perform existance check
  function getExistingVideo(uint256 _videoId) public view returns (Video memory) {
    Video memory video = videoById[_videoId];
    require(video.isExisting, "Trying to access unexisting video");
    return video;
  }

  function updateStatus(uint256 _videoId, bool _isActive) public onlyOwner {
    // Get storage ref
    Video storage video = videoById[_videoId];
    // Update the value in struct
    video.isActive = _isActive;
  }

  function removeVideo(uint256 _videoId) public onlyOwner {
    // Dec videoCountByChannel
    uint256 _channelId = videoById[_videoId].channelId;
    videoCountByChannelId[_channelId] = videoCountByChannelId[_channelId].sub(1);
    // Clear entry in map (setting isExisting to false)
    delete videoById[_videoId];
  }
}
