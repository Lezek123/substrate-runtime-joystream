import { FlowProps } from '../../Flow'
import {
  ApplyOnOpeningsHappyCaseFixture,
  CancelOpeningsFixture,
  CreateOpeningsFixture,
  WithdrawApplicationsFixture,
  ApplicantDetails,
} from '../../fixtures/workingGroups'

import Debugger from 'debug'
import { FixtureRunner } from '../../Fixture'
import { AddStakingAccountsHappyCaseFixture, BuyMembershipHappyCaseFixture } from '../../fixtures/membership'
import { workingGroups, LEADER_OPENING_STAKE } from '../../consts'
import { assert } from 'chai'

export default async function openingAndApplicationStatusFlow({ api, query, env }: FlowProps): Promise<void> {
  const APPLICATION_CREATE_N = parseInt(env.APPLICATION_STATUS_CREATE_N || '')
  const APPLICATION_WITHDRAW_N = parseInt(env.APPLICATION_STATUS_WITHDRAW_N || '')
  assert.isAbove(APPLICATION_CREATE_N, 0)
  assert.isAbove(APPLICATION_WITHDRAW_N, 0)
  assert.isBelow(APPLICATION_WITHDRAW_N, APPLICATION_CREATE_N)

  await Promise.all(
    workingGroups.map(async (group) => {
      const debug = Debugger(`flow:opening-and-application-status:${group}`)
      debug('Started')
      api.enableDebugTxLogs()

      // Transfer funds to leader staking acc to cover opening stake
      const leaderStakingAcc = await api.getLeaderStakingKey(group)
      await api.treasuryTransferBalance(leaderStakingAcc, LEADER_OPENING_STAKE)

      // Create an opening
      const createOpeningFixture = new CreateOpeningsFixture(api, query, group)
      const openingRunner = new FixtureRunner(createOpeningFixture)
      await openingRunner.run()
      const [openingId] = createOpeningFixture.getCreatedOpeningIds()
      const { stake: openingStake, metadata: openingMetadata } = createOpeningFixture.getDefaultOpeningParams()

      // Create some applications
      const roleAccounts = (await api.createKeyPairs(APPLICATION_CREATE_N)).map((kp) => kp.address)
      const stakingAccounts = (await api.createKeyPairs(APPLICATION_CREATE_N)).map((kp) => kp.address)
      const rewardAccounts = (await api.createKeyPairs(APPLICATION_CREATE_N)).map((kp) => kp.address)

      const buyMembershipFixture = new BuyMembershipHappyCaseFixture(api, query, roleAccounts)
      await new FixtureRunner(buyMembershipFixture).run()
      const memberIds = buyMembershipFixture.getCreatedMembers()

      const applicantContexts = roleAccounts.map((account, i) => ({
        account,
        memberId: memberIds[i],
      }))

      await Promise.all(
        applicantContexts.map((applicantContext, i) => {
          const addStakingAccFixture = new AddStakingAccountsHappyCaseFixture(api, query, applicantContext, [
            stakingAccounts[i],
          ])
          return new FixtureRunner(addStakingAccFixture).run()
        })
      )
      await Promise.all(stakingAccounts.map((a) => api.treasuryTransferBalance(a, openingStake)))

      const applicants: ApplicantDetails[] = memberIds.map((memberId, i) => ({
        memberId,
        roleAccount: roleAccounts[i],
        stakingAccount: stakingAccounts[i],
        rewardAccount: rewardAccounts[i],
      }))
      const applyOnOpeningFixture = new ApplyOnOpeningsHappyCaseFixture(api, query, group, [
        {
          openingId,
          openingMetadata,
          applicants,
        },
      ])
      const applyRunner = new FixtureRunner(applyOnOpeningFixture)
      await applyRunner.run()
      const applicationIds = await applyOnOpeningFixture.getCreatedApplicationsByOpeningId(openingId)

      // Withdraw some applications
      const withdrawApplicationsFixture = new WithdrawApplicationsFixture(
        api,
        query,
        group,
        roleAccounts.slice(0, APPLICATION_WITHDRAW_N),
        applicationIds.slice(0, APPLICATION_WITHDRAW_N)
      )
      const withdrawApplicationsRunner = new FixtureRunner(withdrawApplicationsFixture)
      await withdrawApplicationsRunner.run()

      // Cancel the opening
      const cancelOpeningFixture = new CancelOpeningsFixture(api, query, group, [openingId])
      const cancelOpeningRunner = new FixtureRunner(cancelOpeningFixture)
      await cancelOpeningRunner.run()

      // Run query node check
      await Promise.all([withdrawApplicationsRunner.runQueryNodeChecks(), cancelOpeningRunner.runQueryNodeChecks()])

      debug('Done')
    })
  )
}
