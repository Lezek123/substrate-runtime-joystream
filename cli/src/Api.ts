import BN from 'bn.js';
import { registerJoystreamTypes } from '@joystream/types/';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { QueryableStorageMultiArg } from '@polkadot/api/types';
import { formatBalance } from '@polkadot/util';
import { Hash, Balance } from '@polkadot/types/interfaces';
import { KeyringPair } from '@polkadot/keyring/types';
import { Codec } from '@polkadot/types/types';
import { Option, Vec } from '@polkadot/types';
import { u32 } from '@polkadot/types/primitive';
import {
    AccountSummary,
    CouncilInfoObj, CouncilInfoTuple, createCouncilInfoObj,
    WorkingGroups,
    GroupLeadWithProfile,
    GroupMember,
    OpeningStatus,
    GroupOpeningStage,
    GroupOpening,
    GroupApplication
} from './Types';
import { DerivedFees, DerivedBalances } from '@polkadot/api-derive/types';
import { CLIError } from '@oclif/errors';
import ExitCodes from './ExitCodes';
import {
    Worker, WorkerId,
    Lead as WorkerLead,
    WorkerRoleStakeProfile,
    WorkerOpening, WorkerOpeningId,
    WorkerApplication, WorkerApplicationId
} from '@joystream/types/lib/bureaucracy';
import {
    Opening,
    Application,
    OpeningStage, OpeningStageKeys,
    WaitingToBeingOpeningStageVariant,
    ActiveOpeningStageVariant,
    AcceptingApplications,
    ActiveOpeningStageKeys,
    ReviewPeriod,
    Deactivated,
    OpeningDeactivationCauseKeys,
    ApplicationStageKeys,
    ApplicationId,
    OpeningId
} from '@joystream/types/lib/hiring';
import { MemberId, Profile } from '@joystream/types/lib/members';
import { RewardRelationship, RewardRelationshipId } from '@joystream/types/lib/recurring-rewards';
import { Stake, StakeId } from '@joystream/types/lib/stake';
import { LinkageResult } from '@polkadot/types/codec/Linkage';
import { Moment } from '@polkadot/types/interfaces';

export const DEFAULT_API_URI = 'wss://rome-rpc-endpoint.joystream.org:9944/';
const DEFAULT_DECIMALS = new u32(12);

// Mapping of working group to api module
export const apiModuleByGroup: { [key in WorkingGroups]: string } = {
    [WorkingGroups.StorageProviders]: 'storageBureaucracy'
};

// Api wrapper for handling most common api calls and allowing easy API implementation switch in the future
export default class Api {
    private _api: ApiPromise;

    private constructor(originalApi: ApiPromise) {
        this._api = originalApi;
    }

    public getOriginalApi(): ApiPromise {
        return this._api;
    }

    private static async initApi(apiUri: string = DEFAULT_API_URI): Promise<ApiPromise> {
        const wsProvider: WsProvider = new WsProvider(apiUri);
        registerJoystreamTypes();
        const api = await ApiPromise.create({ provider: wsProvider });

        // Initializing some api params based on pioneer/packages/react-api/Api.tsx
        const [properties] = await Promise.all([
            api.rpc.system.properties()
        ]);

        const tokenSymbol = properties.tokenSymbol.unwrapOr('DEV').toString();
        const tokenDecimals = properties.tokenDecimals.unwrapOr(DEFAULT_DECIMALS).toNumber();

        // formatBlanace config
        formatBalance.setDefaults({
            decimals: tokenDecimals,
            unit: tokenSymbol
        });

        return api;
    }

    static async create(apiUri: string = DEFAULT_API_URI): Promise<Api> {
        const originalApi: ApiPromise = await Api.initApi(apiUri);
        return new Api(originalApi);
    }

    private async queryMultiOnce(queries: Parameters<typeof ApiPromise.prototype.queryMulti>[0]): Promise<Codec[]> {
        let results: Codec[] = [];

        const unsub = await this._api.queryMulti(
            queries,
            (res) => { results = res }
        );
        unsub();

        if (!results.length || results.length !== queries.length) {
            throw new CLIError('API querying issue', { exit: ExitCodes.ApiError });
        }

        return results;
    }

    async getAccountsBalancesInfo(accountAddresses: string[]): Promise<DerivedBalances[]> {
        let accountsBalances: DerivedBalances[] = await this._api.derive.balances.votingBalances(accountAddresses);

        return accountsBalances;
    }

    // Get on-chain data related to given account.
    // For now it's just account balances
    async getAccountSummary(accountAddresses: string): Promise<AccountSummary> {
        const balances: DerivedBalances = (await this.getAccountsBalancesInfo([accountAddresses]))[0];
        // TODO: Some more information can be fetched here in the future

        return { balances };
    }

    async getCouncilInfo(): Promise<CouncilInfoObj> {
        const queries: { [P in keyof CouncilInfoObj]: QueryableStorageMultiArg<"promise"> } = {
            activeCouncil: this._api.query.council.activeCouncil,
            termEndsAt: this._api.query.council.termEndsAt,
            autoStart: this._api.query.councilElection.autoStart,
            newTermDuration: this._api.query.councilElection.newTermDuration,
            candidacyLimit: this._api.query.councilElection.candidacyLimit,
            councilSize: this._api.query.councilElection.councilSize,
            minCouncilStake: this._api.query.councilElection.minCouncilStake,
            minVotingStake: this._api.query.councilElection.minVotingStake,
            announcingPeriod: this._api.query.councilElection.announcingPeriod,
            votingPeriod: this._api.query.councilElection.votingPeriod,
            revealingPeriod: this._api.query.councilElection.revealingPeriod,
            round: this._api.query.councilElection.round,
            stage: this._api.query.councilElection.stage
        }
        const results: CouncilInfoTuple = <CouncilInfoTuple>await this.queryMultiOnce(Object.values(queries));

        return createCouncilInfoObj(...results);
    }

    // TODO: This formula is probably not too good, so some better implementation will be required in the future
    async estimateFee(account: KeyringPair, recipientAddr: string, amount: BN): Promise<BN> {
        const transfer = this._api.tx.balances.transfer(recipientAddr, amount);
        const signature = account.sign(transfer.toU8a());
        const transactionByteSize: BN = new BN(transfer.encodedLength + signature.length);

        const fees: DerivedFees = await this._api.derive.balances.fees();

        const estimatedFee = fees.transactionBaseFee.add(fees.transactionByteFee.mul(transactionByteSize));

        return estimatedFee;
    }

    async transfer(account: KeyringPair, recipientAddr: string, amount: BN): Promise<Hash> {
        const txHash = await this._api.tx.balances
            .transfer(recipientAddr, amount)
            .signAndSend(account);
        return txHash;
    }

    // Working groups
    // TODO: This is a lot of repeated logic from "/pioneer/joy-roles/src/transport.substrate.ts"
    // (although simplified a little bit)
    // Hopefully this will be refactored to "joystream-js" soon
    protected singleLinkageResult<T extends Codec>(result: LinkageResult) {
        return result[0] as T;
    }

    protected multiLinkageResult<K extends Codec, V extends Codec>(result: LinkageResult): [Vec<K>, Vec<V>] {
        return [result[0] as Vec<K>, result[1] as Vec<V>];
    }

    protected async blockHash(height: number): Promise<string> {
        const blockHash = await this._api.rpc.chain.getBlockHash(height);

        return blockHash.toString();
    }

    protected async blockTimestamp(height: number): Promise<Date> {
        const blockTime = (await this._api.query.timestamp.now.at(await this.blockHash(height))) as Moment;

        return new Date(blockTime.toNumber());
    }

    protected workingGroupApiQuery(group: WorkingGroups) {
        const module = apiModuleByGroup[group];
        return this._api.query[module];
    }

    protected async memberProfileById(memberId: MemberId): Promise<Profile | null> {
        const profile = await this._api.query.members.memberProfile(memberId) as Option<Profile>;

        return profile.unwrapOr(null);
    }

    async groupLead(group: WorkingGroups): Promise<GroupLeadWithProfile | null> {
        const optLead = (await this.workingGroupApiQuery(group).currentLead()) as Option<WorkerLead>;

        if (!optLead.isSome) {
            return null;
        }

        const lead = optLead.unwrap();
        const profile = await this.memberProfileById(lead.member_id);

        if (!profile) {
            throw new Error(`Group lead profile not found! (member id: ${lead.member_id.toNumber()})`);
        }

        return { lead, profile };
    }

    protected async stakeValue(stakeId: StakeId): Promise<Balance> {
        const stake = this.singleLinkageResult<Stake>(
            await this._api.query.stake.stakes(stakeId) as LinkageResult
        );
        return stake.value;
    }

    protected async workerStake(stakeProfile: WorkerRoleStakeProfile): Promise<Balance> {
        return this.stakeValue(stakeProfile.stake_id);
    }

    protected async workerTotalReward(relationshipId: RewardRelationshipId): Promise<Balance> {
        const relationship = this.singleLinkageResult<RewardRelationship>(
            await this._api.query.recurringRewards.rewardRelationships(relationshipId) as LinkageResult
        );
        return relationship.total_reward_received;
    }

    protected async groupMember(
        id: WorkerId,
        worker: Worker
    ): Promise<GroupMember> {
        const roleAccount = worker.role_account;
        const memberId = worker.member_id;

        const profile = await this.memberProfileById(memberId);

        if (!profile) {
            throw new Error(`Group member profile not found! (member id: ${memberId.toNumber()})`);
        }

        let stakeValue: Balance = this._api.createType("Balance", 0);
        if (worker.role_stake_profile && worker.role_stake_profile.isSome) {
            stakeValue = await this.workerStake(worker.role_stake_profile.unwrap());
        }

        let earnedValue: Balance = this._api.createType("Balance", 0);
        if (worker.reward_relationship && worker.reward_relationship.isSome) {
            earnedValue = await this.workerTotalReward(worker.reward_relationship.unwrap());
        }

        return ({
            workerId: id,
            roleAccount,
            memberId,
            profile,
            stake: stakeValue,
            earned: earnedValue
        });
    }

    async groupMembers(group: WorkingGroups): Promise<GroupMember[]> {
        const nextId = (await this.workingGroupApiQuery(group).nextWorkerId()) as WorkerId;

        // This is chain specfic, but if next id is still 0, it means no curators have been added yet
        if (nextId.eq(0)) {
            return [];
        }

        const [workerIds, workers] = this.multiLinkageResult<WorkerId, Worker>(
            (await this.workingGroupApiQuery(group).workerById()) as LinkageResult
        );

        let groupMembers: GroupMember[] = [];
        for (let [index, worker] of Object.entries(workers.toArray())) {
            const workerId = workerIds[parseInt(index)];
            groupMembers.push(await this.groupMember(workerId, worker));
        }

        return groupMembers.reverse();
    }

    async openingsByGroup(group: WorkingGroups): Promise<GroupOpening[]> {
        const openings: GroupOpening[] = [];
        const nextId = (await this.workingGroupApiQuery(group).nextWorkerOpeningId()) as WorkerOpeningId;

        // This is chain specfic, but if next id is still 0, it means no openings have been added yet
        if (!nextId.eq(0)) {
            const highestId = nextId.toNumber() - 1;
            for (let i = highestId; i >= 0; i--) {
                openings.push(await this.groupOpening(group, i));
            }
        }

        return openings;
    }

    protected async hiringOpeningById(id: number | OpeningId): Promise<Opening> {
        const result = await this._api.query.hiring.openingById(id) as LinkageResult;
        return this.singleLinkageResult<Opening>(result);
    }

    protected async hiringApplicationById(id: number | ApplicationId): Promise<Application> {
        const result = await this._api.query.hiring.applicationById(id) as LinkageResult;
        return this.singleLinkageResult<Application>(result);
    }

    async workerApplicationById(group: WorkingGroups, workerApplicationId: number): Promise<WorkerApplication> {
        const nextAppId = await this.workingGroupApiQuery(group).nextWorkerApplicationId() as WorkerApplicationId;

        if (workerApplicationId < 0 || workerApplicationId >= nextAppId.toNumber()) {
            throw new CLIError('Invalid worker application ID!');
        }

        return this.singleLinkageResult<WorkerApplication>(
            await this.workingGroupApiQuery(group).workerApplicationById(workerApplicationId) as LinkageResult
        );
    }

    protected async parseApplication(workerApplicationId: number, workerApplication: WorkerApplication) {
        const appId = workerApplication.application_id;
        const application = await this.hiringApplicationById(appId);

        const { active_role_staking_id: roleStakingId, active_application_staking_id: appStakingId } = application;

        return {
            workerApplicationId,
            applicationId: appId.toNumber(),
            member: await this.memberProfileById(workerApplication.member_id),
            roleAccout: workerApplication.role_account,
            stakes: {
                application: appStakingId.isSome ? (await this.stakeValue(appStakingId.unwrap())).toNumber() : 0,
                role: roleStakingId.isSome ? (await this.stakeValue(roleStakingId.unwrap())).toNumber() : 0
            },
            humanReadableText: application.human_readable_text.toString(),
            stage: application.stage.type as ApplicationStageKeys
        };
    }

    async groupApplication(group: WorkingGroups, workerApplicationId: number): Promise<GroupApplication> {
        const workerApplication = await this.workerApplicationById(group, workerApplicationId);
        return await this.parseApplication(workerApplicationId, workerApplication);
    }

    protected async groupOpeningApplications(group: WorkingGroups, workerOpeningId: number): Promise<GroupApplication[]> {
        const applications: GroupApplication[] = [];

        const nextAppId = await this.workingGroupApiQuery(group).nextWorkerApplicationId() as WorkerApplicationId;
        for (let i = 0; i < nextAppId.toNumber(); i++) {
            const workerApplication = await this.workerApplicationById(group, i);
            if (workerApplication.worker_opening_id.toNumber() !== workerOpeningId) {
                continue;
            }
            applications.push(await this.parseApplication(i, workerApplication));
        }


        return applications;
    }

    async groupOpening(group: WorkingGroups, workerOpeningId: number): Promise<GroupOpening> {
        const nextId = ((await this.workingGroupApiQuery(group).nextWorkerOpeningId()) as WorkerOpeningId).toNumber();

        if (workerOpeningId < 0 || workerOpeningId >= nextId) {
            throw new CLIError('Invalid group opening ID!');
        }

        const groupOpening = this.singleLinkageResult<WorkerOpening>(
            await this.workingGroupApiQuery(group).workerOpeningById(workerOpeningId) as LinkageResult
        );

        const openingId = groupOpening.opening_id.toNumber();
        const opening = await this.hiringOpeningById(openingId);
        const applications = await this.groupOpeningApplications(group, workerOpeningId);
        const stage = await this.parseOpeningStage(opening.stage);
        const stakes = {
            application: opening.application_staking_policy.unwrapOr(undefined),
            role: opening.role_staking_policy.unwrapOr(undefined)
        }

        return ({
            workerOpeningId,
            openingId,
            opening,
            stage,
            stakes,
            applications
        });
    }

    async parseOpeningStage(stage: OpeningStage): Promise<GroupOpeningStage> {
        let
            status: OpeningStatus | undefined,
            stageBlock: number | undefined,
            stageDate: Date | undefined;

        if (stage.type === OpeningStageKeys.WaitingToBegin) {
            const stageData = (stage.value as WaitingToBeingOpeningStageVariant);
            const currentBlockNumber = (await this._api.derive.chain.bestNumber()).toNumber();
            const expectedBlockTime = (this._api.consts.babe.expectedBlockTime as Moment).toNumber();
            status = OpeningStatus.WaitingToBegin;
            stageBlock = stageData.begins_at_block.toNumber();
            stageDate = new Date(Date.now() + (stageBlock - currentBlockNumber) * expectedBlockTime);
        }

        if (stage.type === OpeningStageKeys.Active) {
            const stageData = (stage.value as ActiveOpeningStageVariant);
            const substage = stageData.stage;
            if (substage.type === ActiveOpeningStageKeys.AcceptingApplications) {
                status = OpeningStatus.AcceptingApplications;
                stageBlock = (substage.value as AcceptingApplications).started_accepting_applicants_at_block.toNumber();
            }
            if (substage.type === ActiveOpeningStageKeys.ReviewPeriod) {
                status = OpeningStatus.InReview;
                stageBlock = (substage.value as ReviewPeriod).started_review_period_at_block.toNumber();
            }
            if (substage.type === ActiveOpeningStageKeys.Deactivated) {
                status = (substage.value as Deactivated).cause.type === OpeningDeactivationCauseKeys.Filled
                    ? OpeningStatus.Complete
                    : OpeningStatus.Cancelled;
                stageBlock = (substage.value as Deactivated).deactivated_at_block.toNumber();
            }
            if (stageBlock) stageDate = new Date(await this.blockTimestamp(stageBlock));
        }

        return {
            status: status || OpeningStatus.Unknown,
            block: stageBlock,
            date: stageDate
        }
    }
}
