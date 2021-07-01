import { FlowProps } from '../../Flow'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { HireWorkersFixture } from '../../fixtures/workingGroups/HireWorkersFixture'
import { workingGroups } from '../../consts'
import { InitializeForumConfig, InitializeForumFixture } from '../../fixtures/forum'
import { DEFAULT_OPENING_PARAMS } from '../../fixtures/workingGroups'
import { CreateProposalsFixture, ProposalCreationParams, TestedProposal } from '../../fixtures/proposals'
import { Utils } from '../../utils'
import { OpeningMetadata } from '@joystream/metadata-protobuf'
import { ApplicationId, OpeningId } from '@joystream/types/working-group'
import { BuyMembershipHappyCaseFixture } from '../../fixtures/membership'
import _ from 'lodash'

export default async function initializeStagingNetwork({ api, query }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:initialize-staging-network')
  debug('Started')
  api.enableDebugTxLogs()

  const workersN = 3
  const forumConfig: InitializeForumConfig = {
    numberOfCategories: 3,
    threadsPerCategory: 3,
    postsPerThread: 3,
    moderatorsPerCategory: 1,
    numberOfForumMembers: 3,
  }

  // Init workers in each group
  await Promise.all(
    workingGroups.map(async (group) => {
      const hireWorkersFixture = new HireWorkersFixture(api, query, group, workersN)
      await new FixtureRunner(hireWorkersFixture).run()
    })
  )

  // Init forum
  const initializeForumFixture = new InitializeForumFixture(api, query, forumConfig)
  await new FixtureRunner(initializeForumFixture).run()

  // Init proposals
  const accountsToFund = (await api.createKeyPairs(5)).map((key) => key.address)
  const membershipLeadOpeningId = (await api.query.membershipWorkingGroup.openingById.entries()).map(
    ([storageKey]) => storageKey.args[0] as OpeningId
  )[0]
  const membershipLeadApplicationId = (await api.query.membershipWorkingGroup.applicationById.entries()).map(
    ([storageKey]) => storageKey.args[0] as ApplicationId
  )[0]
  const membershipLeadId = (await api.query.membershipWorkingGroup.currentLead()).unwrap()

  const proposals: TestedProposal[] = [
    { details: { AmendConstitution: 'New constitution' } },
    {
      details: { FundingRequest: accountsToFund.map((a, i) => ({ account: a, amount: (i + 1) * 1000 })) },
    },
    { details: { Signal: 'Text' } },
    { details: { SetCouncilBudgetIncrement: 1_000_000 } },
    { details: { SetCouncilorReward: 100 } },
    { details: { SetInitialInvitationBalance: 10 } },
    { details: { SetInitialInvitationCount: 5 } },
    { details: { SetMaxValidatorCount: 100 } },
    { details: { SetMembershipPrice: 500 } },
    { details: { SetReferralCut: 25 } },
    {
      details: { UpdateWorkingGroupBudget: [10_000_000, 'Content', 'Negative'] },
    },
    {
      details: {
        CreateWorkingGroupLeadOpening: {
          description: Utils.metadataToBytes(OpeningMetadata, DEFAULT_OPENING_PARAMS.metadata),
          reward_per_block: DEFAULT_OPENING_PARAMS.reward,
          stake_policy: {
            leaving_unstaking_period: DEFAULT_OPENING_PARAMS.unstakingPeriod,
            stake_amount: DEFAULT_OPENING_PARAMS.stake,
          },
          working_group: 'Membership',
        },
      },
    },
    { details: { CancelWorkingGroupLeadOpening: [membershipLeadOpeningId, 'Membership'] } },
    {
      details: {
        FillWorkingGroupLeadOpening: {
          opening_id: 0,
          successful_application_id: membershipLeadApplicationId,
          working_group: 'Membership',
        },
      },
    },
    { details: { CreateBlogPost: ['Blog title', 'Blog text'] } },
    // { details: { EditBlogPost: [999, 'New title', 'New text'] } },
    // { details: { LockBlogPost: 999 } },
    // { details: { UnlockBlogPost: 999 } },
    { details: { SetMembershipLeadInvitationQuota: 50 } },
    { details: { DecreaseWorkingGroupLeadStake: [membershipLeadId, 100, 'Membership'] } },
    { details: { SetWorkingGroupLeadReward: [membershipLeadId, 50, 'Membership'] } },
    { details: { SlashWorkingGroupLead: [membershipLeadId, 100, 'Membership'] } },
  ]

  Utils.assert(proposals.length <= 20, `Initial proposals number shouldn't exceed 20`)

  const [proposalCreatorKey] = (await api.createKeyPairs(1, true, 'Proposals creator')).map((kp) => kp.address)
  const buyMembershipFixture = new BuyMembershipHappyCaseFixture(api, query, [proposalCreatorKey])
  await new FixtureRunner(buyMembershipFixture).run()

  const createProposalsParams: ProposalCreationParams[] = proposals.map(({ details }) => {
    const proposalDetails = api.createType('ProposalDetails', details)
    const { type, value: detailsValue } = proposalDetails
    return {
      asMember: buyMembershipFixture.getCreatedMembers()[0],
      title: `${_.startCase(type)}`,
      description: `Test ${type} proposal`,
      type,
      details: detailsValue,
    }
  })

  const createProposalsFixtre = new CreateProposalsFixture(api, query, createProposalsParams)
  await new FixtureRunner(createProposalsFixtre).run()

  debug('Done')
}
