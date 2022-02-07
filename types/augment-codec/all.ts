// This file was automatically generated via generate:augment-codec
import { ContentId, ContentParameters, DataObjectStorageRelationship, DataObjectStorageRelationshipId, DataObjectType, DataObjectTypeId, NewAsset, ObjectOwner, StorageObjectOwner, UploadingStatus, VoucherLimit } from '../legacy';
import { BlockAndTime, ThreadId, PostId, InputValidationLengthConstraint, WorkingGroup, SlashingTerms, SlashableTerms, MemoText, Address, LookupSource, ChannelId, Url } from '../common';
import { EntryMethod, MemberId, PaidTermId, SubscriptionId, Membership, PaidMembershipTerms, ActorId } from '../members';
import { ElectionStage, ElectionStake, SealedVote, TransferableStake, ElectionParameters, Seat, Seats, Backer, Backers } from '../council';
import { RoleParameters } from '../roles';
import { PostTextChange, ModerationAction, ChildPositionInParentCategory, CategoryId, Category, Thread, Post, ReplyId, Reply } from '../forum';
import { StakeId, Stake, StakingStatus, Staked, StakedStatus, Unstaking, Slash } from '../stake';
import { MintId, Mint, MintBalanceOf, BalanceOfMint, NextAdjustment, AdjustOnInterval, AdjustCapacityBy } from '../mint';
import { RecipientId, RewardRelationshipId, Recipient, RewardRelationship } from '../recurring-rewards';
import { ApplicationId, OpeningId, Application, ApplicationStage, ActivateOpeningAt, ApplicationRationingPolicy, OpeningStage, StakingPolicy, Opening, WaitingToBeingOpeningStageVariant, ActiveOpeningStageVariant, ActiveOpeningStage, AcceptingApplications, ReviewPeriod, Deactivated, OpeningDeactivationCause, InactiveApplicationStage, UnstakingApplicationStage, ApplicationDeactivationCause, StakingAmountLimitMode } from '../hiring';
import { RationaleText, Application as ApplicationOf, ApplicationIdSet, ApplicationIdToWorkerIdMap, WorkerId, Worker as WorkerOf, Opening as OpeningOf, StorageProviderId, OpeningType, ApplicationId as HiringApplicationId, RewardPolicy, OpeningPolicyCommitment, RoleStakeProfile } from '../working-group';
import { StorageBucketId, StorageBucketsPerBagValueConstraint, DataObjectId, DynamicBagId, Voucher, DynamicBagType, DynamicBagCreationPolicy, DynamicBagDeletionPrize, DynamicBagDeletionPrizeRecord, Bag, StorageBucket, StaticBagId, Static, Dynamic, BagId, DataObjectCreationParameters, BagIdType, UploadParameters, StorageBucketIdSet, DataObjectIdSet, ContentIdSet, Cid, StorageBucketOperatorStatus, DataObject, DistributionBucketId, DistributionBucketIndex, DistributionBucketFamilyId, DistributionBucket, DistributionBucketFamily, DataObjectIdMap, DistributionBucketIndexSet, DynamicBagCreationPolicyDistributorFamiliesMap } from '../storage';
import { ProposalId, ProposalStatus, Proposal as ProposalOf, ProposalDetails, ProposalDetails as ProposalDetailsOf, VotingResults, ProposalParameters, VoteKind, ThreadCounter, DiscussionThread, DiscussionPost, AddOpeningParameters, FillOpeningParameters, TerminateRoleParameters, ActiveStake, Finalized, ProposalDecisionStatus, ExecutionFailed, Approved, SetLeadParams } from '../proposals';
import { CuratorId, CuratorGroupId, CuratorGroup, ContentActor, StorageAssets, Channel, ChannelOwner, ChannelCategoryId, ChannelCategory, ChannelCategoryCreationParameters, ChannelCategoryUpdateParameters, ChannelCreationParameters, ChannelUpdateParameters, ChannelOwnershipTransferRequestId, ChannelOwnershipTransferRequest, Video, VideoId, VideoCategoryId, VideoCategory, VideoCategoryCreationParameters, VideoCategoryUpdateParameters, VideoCreationParameters, VideoUpdateParameters, Person, PersonId, PersonController, PersonActor, PersonCreationParameters, PersonUpdateParameters, Playlist, PlaylistId, PlaylistCreationParameters, PlaylistUpdateParameters, SeriesId, Series, Season, SeriesParameters, SeasonParameters, EpisodeParemters, MaxNumber, IsCensored, VideoMigrationConfig, ChannelMigrationConfig, EnglishAuctionDetails, OpenAuctionDetails, AuctionType, AuctionParams, Royalty, Bid, AuctionRecord, TransactionalStatus, NFTOwner, OwnedNFT, NFTMetadata, IsExtended } from '../content';

export { ContentId, ContentParameters, DataObjectStorageRelationship, DataObjectStorageRelationshipId, DataObjectType, DataObjectTypeId, NewAsset, ObjectOwner, StorageObjectOwner, UploadingStatus, VoucherLimit, BlockAndTime, ThreadId, PostId, InputValidationLengthConstraint, WorkingGroup, SlashingTerms, SlashableTerms, MemoText, Address, LookupSource, ChannelId, Url, EntryMethod, MemberId, PaidTermId, SubscriptionId, Membership, PaidMembershipTerms, ActorId, ElectionStage, ElectionStake, SealedVote, TransferableStake, ElectionParameters, Seat, Seats, Backer, Backers, RoleParameters, PostTextChange, ModerationAction, ChildPositionInParentCategory, CategoryId, Category, Thread, Post, ReplyId, Reply, StakeId, Stake, StakingStatus, Staked, StakedStatus, Unstaking, Slash, MintId, Mint, MintBalanceOf, BalanceOfMint, NextAdjustment, AdjustOnInterval, AdjustCapacityBy, RecipientId, RewardRelationshipId, Recipient, RewardRelationship, ApplicationId, OpeningId, Application, ApplicationStage, ActivateOpeningAt, ApplicationRationingPolicy, OpeningStage, StakingPolicy, Opening, WaitingToBeingOpeningStageVariant, ActiveOpeningStageVariant, ActiveOpeningStage, AcceptingApplications, ReviewPeriod, Deactivated, OpeningDeactivationCause, InactiveApplicationStage, UnstakingApplicationStage, ApplicationDeactivationCause, StakingAmountLimitMode, RationaleText, ApplicationOf, ApplicationIdSet, ApplicationIdToWorkerIdMap, WorkerId, WorkerOf, OpeningOf, StorageProviderId, OpeningType, HiringApplicationId, RewardPolicy, OpeningPolicyCommitment, RoleStakeProfile, StorageBucketId, StorageBucketsPerBagValueConstraint, DataObjectId, DynamicBagId, Voucher, DynamicBagType, DynamicBagCreationPolicy, DynamicBagDeletionPrize, DynamicBagDeletionPrizeRecord, Bag, StorageBucket, StaticBagId, Static, Dynamic, BagId, DataObjectCreationParameters, BagIdType, UploadParameters, StorageBucketIdSet, DataObjectIdSet, ContentIdSet, Cid, StorageBucketOperatorStatus, DataObject, DistributionBucketId, DistributionBucketIndex, DistributionBucketFamilyId, DistributionBucket, DistributionBucketFamily, DataObjectIdMap, DistributionBucketIndexSet, DynamicBagCreationPolicyDistributorFamiliesMap, ProposalId, ProposalStatus, ProposalOf, ProposalDetails, ProposalDetailsOf, VotingResults, ProposalParameters, VoteKind, ThreadCounter, DiscussionThread, DiscussionPost, AddOpeningParameters, FillOpeningParameters, TerminateRoleParameters, ActiveStake, Finalized, ProposalDecisionStatus, ExecutionFailed, Approved, SetLeadParams, CuratorId, CuratorGroupId, CuratorGroup, ContentActor, StorageAssets, Channel, ChannelOwner, ChannelCategoryId, ChannelCategory, ChannelCategoryCreationParameters, ChannelCategoryUpdateParameters, ChannelCreationParameters, ChannelUpdateParameters, ChannelOwnershipTransferRequestId, ChannelOwnershipTransferRequest, Video, VideoId, VideoCategoryId, VideoCategory, VideoCategoryCreationParameters, VideoCategoryUpdateParameters, VideoCreationParameters, VideoUpdateParameters, Person, PersonId, PersonController, PersonActor, PersonCreationParameters, PersonUpdateParameters, Playlist, PlaylistId, PlaylistCreationParameters, PlaylistUpdateParameters, SeriesId, Series, Season, SeriesParameters, SeasonParameters, EpisodeParemters, MaxNumber, IsCensored, VideoMigrationConfig, ChannelMigrationConfig, EnglishAuctionDetails, OpenAuctionDetails, AuctionType, AuctionParams, Royalty, Bid, AuctionRecord, TransactionalStatus, NFTOwner, OwnedNFT, NFTMetadata, IsExtended };