import { getTypeRegistry, Null, u128, u64, u32, Vec, Option, Text } from '@polkadot/types'
import { Enum } from '@polkadot/types/codec'
import { BlockNumber, Balance } from '@polkadot/types/interfaces'
import { JoyStruct, JoyEnum } from '../common'
import { StakeId } from '../stake'

import { GenericJoyStreamRoleSchema } from './schemas/role.schema.typings'

import ajv from 'ajv'

import * as role_schema_json from './schemas/role.schema.json'

export class ApplicationId extends u64 {}
export class OpeningId extends u64 {}

export class CurrentBlock extends Null {}
export class ExactBlock extends u32 {} // BlockNumber

export const ActivateOpeningAtDef = {
  CurrentBlock,
  ExactBlock,
} as const
export const ActivateOpeningAtKeys: { [k in keyof typeof ActivateOpeningAtDef]: k } = {
  CurrentBlock: 'CurrentBlock',
  ExactBlock: 'ExactBlock',
} as const
export type ActivateOpeningAtKey = keyof typeof ActivateOpeningAtDef
// TODO: Replace with JoyEnum
export class ActivateOpeningAt extends Enum.with(ActivateOpeningAtDef) {}

export enum ApplicationDeactivationCauseKeys {
  External = 'External',
  Hired = 'Hired',
  NotHired = 'NotHired',
  CrowdedOut = 'CrowdedOut',
  OpeningCancelled = 'OpeningCancelled',
  ReviewPeriodExpired = 'ReviewPeriodExpired',
  OpeningFilled = 'OpeningFilled',
}

export class ApplicationDeactivationCause extends Enum {
  constructor(value?: any, index?: number) {
    super(
      [
        ApplicationDeactivationCauseKeys.External,
        ApplicationDeactivationCauseKeys.Hired,
        ApplicationDeactivationCauseKeys.NotHired,
        ApplicationDeactivationCauseKeys.CrowdedOut,
        ApplicationDeactivationCauseKeys.OpeningCancelled,
        ApplicationDeactivationCauseKeys.ReviewPeriodExpired,
        ApplicationDeactivationCauseKeys.OpeningFilled,
      ],
      value,
      index
    )
  }
}

export type UnstakingApplicationStageType = {
  deactivation_initiated: BlockNumber
  cause: ApplicationDeactivationCause
}
export class UnstakingApplicationStage extends JoyStruct<UnstakingApplicationStageType> {
  constructor(value?: UnstakingApplicationStageType) {
    super(
      {
        deactivation_initiated: u32, // BlockNumber
        cause: ApplicationDeactivationCause,
      },
      value
    )
  }

  get cause(): ApplicationDeactivationCause {
    return this.getField<ApplicationDeactivationCause>('cause')
  }
}

export type InactiveApplicationStageType = {
  deactivation_initiated: BlockNumber
  deactivated: BlockNumber
  cause: ApplicationDeactivationCause
}
export class InactiveApplicationStage extends JoyStruct<InactiveApplicationStageType> {
  constructor(value?: InactiveApplicationStageType) {
    super(
      {
        deactivation_initiated: u32, // BlockNumber
        deactivated: u32,
        cause: ApplicationDeactivationCause,
      },
      value
    )
  }

  get cause(): ApplicationDeactivationCause {
    return this.getField<ApplicationDeactivationCause>('cause')
  }
}

export class ActiveApplicationStage extends Null {}

// TODO: Find usages and replace with "JoyEnum-standard"
export enum ApplicationStageKeys {
  Active = 'Active',
  Unstaking = 'Unstaking',
  Inactive = 'Inactive',
}
export class ApplicationStage extends JoyEnum({
  Active: ActiveApplicationStage,
  Unstaking: UnstakingApplicationStage,
  Inactive: InactiveApplicationStage,
} as const) {}

export type IApplicationRationingPolicy = {
  max_active_applicants: u32
}
export class ApplicationRationingPolicy extends JoyStruct<IApplicationRationingPolicy> {
  constructor(value?: IApplicationRationingPolicy) {
    super(
      {
        max_active_applicants: u32,
      },
      value
    )
  }

  get max_active_applicants(): u32 {
    return this.getField<u32>('max_active_applicants')
  }
}

export type WaitingToBeingOpeningStageVariantType = {
  begins_at_block: BlockNumber
}
export class WaitingToBeingOpeningStageVariant extends JoyStruct<WaitingToBeingOpeningStageVariantType> {
  constructor(value?: WaitingToBeingOpeningStageVariantType) {
    super(
      {
        begins_at_block: u32,
      },
      value
    )
  }

  get begins_at_block(): BlockNumber {
    return this.getField<BlockNumber>('begins_at_block')
  }
}

// TODO: Find usages and replace them with JoyEnum helpers
export enum OpeningDeactivationCauseKeys {
  CancelledBeforeActivation = 'CancelledBeforeActivation',
  CancelledAcceptingApplications = 'CancelledAcceptingApplications',
  CancelledInReviewPeriod = 'CancelledInReviewPeriod',
  ReviewPeriodExpired = 'ReviewPeriodExpired',
  Filled = 'Filled',
}

class OpeningDeactivationCause_CancelledBeforeActivation extends Null {}
class OpeningDeactivationCause_CancelledAcceptingApplications extends Null {}
class OpeningDeactivationCause_CancelledInReviewPeriod extends Null {}
class OpeningDeactivationCause_ReviewPeriodExpired extends Null {}
class OpeningDeactivationCause_Filled extends Null {}

export class OpeningDeactivationCause extends JoyEnum({
  CancelledBeforeActivation: OpeningDeactivationCause_CancelledBeforeActivation,
  CancelledAcceptingApplications: OpeningDeactivationCause_CancelledAcceptingApplications,
  CancelledInReviewPeriod: OpeningDeactivationCause_CancelledInReviewPeriod,
  ReviewPeriodExpired: OpeningDeactivationCause_ReviewPeriodExpired,
  Filled: OpeningDeactivationCause_Filled,
} as const) {}

export type IAcceptingApplications = {
  started_accepting_applicants_at_block: BlockNumber
}
export class AcceptingApplications extends JoyStruct<IAcceptingApplications> {
  constructor(value?: IAcceptingApplications) {
    super(
      {
        started_accepting_applicants_at_block: u32,
      },
      value
    )
  }

  get started_accepting_applicants_at_block(): BlockNumber {
    return this.getField<BlockNumber>('started_accepting_applicants_at_block')
  }
}

export type IReviewPeriod = {
  started_accepting_applicants_at_block: BlockNumber
  started_review_period_at_block: BlockNumber
}
export class ReviewPeriod extends JoyStruct<IReviewPeriod> {
  constructor(value?: IReviewPeriod) {
    super(
      {
        started_accepting_applicants_at_block: u32,
        started_review_period_at_block: u32,
      },
      value
    )
  }

  get started_accepting_applicants_at_block(): BlockNumber {
    return this.getField<BlockNumber>('started_accepting_applicants_at_block')
  }

  get started_review_period_at_block(): BlockNumber {
    return this.getField<BlockNumber>('started_review_period_at_block')
  }
}

export type IDeactivated = {
  cause: OpeningDeactivationCause
  deactivated_at_block: BlockNumber
  started_accepting_applicants_at_block: BlockNumber
  started_review_period_at_block: Option<BlockNumber>
}
export class Deactivated extends JoyStruct<IDeactivated> {
  constructor(value?: IDeactivated) {
    super(
      {
        cause: OpeningDeactivationCause,
        deactivated_at_block: u32,
        started_accepting_applicants_at_block: u32,
        started_review_period_at_block: Option.with(u32),
      },
      value
    )
  }

  get cause(): OpeningDeactivationCause {
    return this.getField<OpeningDeactivationCause>('cause')
  }

  get deactivated_at_block(): BlockNumber {
    return this.getField<BlockNumber>('deactivated_at_block')
  }

  get started_accepting_applicants_at_block(): BlockNumber {
    return this.getField<BlockNumber>('started_accepting_applicants_at_block')
  }

  get started_review_period_at_block(): BlockNumber {
    return this.getField<BlockNumber>('started_review_period_at_block')
  }
}

export const ActiveOpeningStageDef = {
  AcceptingApplications: AcceptingApplications,
  ReviewPeriod: ReviewPeriod,
  Deactivated: Deactivated,
} as const
export type ActiveOpeningStageKey = keyof typeof ActiveOpeningStageDef

export class ActiveOpeningStage extends JoyEnum(ActiveOpeningStageDef) {}

export type ActiveOpeningStageVariantType = {
  stage: ActiveOpeningStage
  applications_added: Vec<ApplicationId> //BTreeSet<ApplicationId>,
  active_application_count: u32
  unstaking_application_count: u32
  deactivated_application_count: u32
}
export class ActiveOpeningStageVariant extends JoyStruct<ActiveOpeningStageVariantType> {
  constructor(value?: ActiveOpeningStageVariantType) {
    super(
      {
        stage: ActiveOpeningStage,
        applications_added: Vec.with(ApplicationId), //BTreeSet<ApplicationId>,
        active_application_count: u32,
        unstaking_application_count: u32,
        deactivated_application_count: u32,
      },
      value
    )
  }

  get stage(): ActiveOpeningStage {
    return this.getField<ActiveOpeningStage>('stage')
  }

  get is_active(): boolean {
    return this.stage.isOfType('AcceptingApplications')
  }
}

// TODO: Find usages and replace them with JoyEnum helpers
export enum OpeningStageKeys {
  WaitingToBegin = 'WaitingToBegin',
  Active = 'Active',
}

export class OpeningStage extends JoyEnum({
  WaitingToBegin: WaitingToBeingOpeningStageVariant,
  Active: ActiveOpeningStageVariant,
} as const) {}

export enum StakingAmountLimitModeKeys {
  AtLeast = 'AtLeast',
  Exact = 'Exact',
}

export class StakingAmountLimitMode extends Enum {
  constructor(value?: any, index?: number) {
    super([StakingAmountLimitModeKeys.AtLeast, StakingAmountLimitModeKeys.Exact], value, index)
  }
}

export type IStakingPolicy = {
  amount: Balance
  amount_mode: StakingAmountLimitMode
  crowded_out_unstaking_period_length: Option<BlockNumber>
  review_period_expired_unstaking_period_length: Option<BlockNumber>
}
export class StakingPolicy extends JoyStruct<IStakingPolicy> {
  constructor(value?: IStakingPolicy) {
    super(
      {
        amount: u128,
        amount_mode: StakingAmountLimitMode,
        crowded_out_unstaking_period_length: Option.with(u32),
        review_period_expired_unstaking_period_length: Option.with(u32),
      },
      value
    )
  }

  get amount(): u128 {
    return this.getField<u128>('amount')
  }

  get amount_mode(): StakingAmountLimitMode {
    return this.getField<StakingAmountLimitMode>('amount_mode')
  }

  get crowded_out_unstaking_period_length(): Option<u32> {
    return this.getField<Option<u32>>('crowded_out_unstaking_period_length')
  }

  get review_period_expired_unstaking_period_length(): Option<u32> {
    return this.getField<Option<u32>>('review_period_expired_unstaking_period_length')
  }
}
export const schemaValidator: ajv.ValidateFunction = new ajv({ allErrors: true }).compile(role_schema_json)

const OpeningHRTFallback: GenericJoyStreamRoleSchema = {
  version: 1,
  headline: 'Unknown',
  job: {
    title: 'Unknown',
    description: 'Unknown',
  },
  application: {},
  reward: 'Unknown',
  creator: {
    membership: {
      handle: 'Unknown',
    },
  },
}

export type IOpening = {
  created: BlockNumber
  stage: OpeningStage
  max_review_period_length: BlockNumber
  application_rationing_policy: Option<ApplicationRationingPolicy>
  application_staking_policy: Option<StakingPolicy>
  role_staking_policy: Option<StakingPolicy>
  human_readable_text: Text // Vec<u8>,
}

export class Opening extends JoyStruct<IOpening> {
  constructor(value?: IOpening) {
    super(
      {
        created: u32,
        stage: OpeningStage,
        max_review_period_length: u32,
        application_rationing_policy: Option.with(ApplicationRationingPolicy),
        application_staking_policy: Option.with(StakingPolicy),
        role_staking_policy: Option.with(StakingPolicy),
        human_readable_text: Text, // Vec.with(u8),
      },
      value
    )
  }

  parse_human_readable_text(): GenericJoyStreamRoleSchema | string | undefined {
    const hrt = this.getField<Text>('human_readable_text')

    if (!hrt) {
      return undefined
    }

    const str = hrt.toString()

    try {
      const obj = JSON.parse(str)
      if (schemaValidator(obj) === true) {
        return (obj as unknown) as GenericJoyStreamRoleSchema
      }
      console.log('parse_human_readable_text JSON schema validation failed:', schemaValidator.errors)
    } catch (e) {
      console.log('parse_human_readable_text JSON schema validation failed:', e.toString())
    }

    return str
  }

  parse_human_readable_text_with_fallback(): GenericJoyStreamRoleSchema {
    const hrt = this.parse_human_readable_text()

    if (typeof hrt !== 'object') {
      return OpeningHRTFallback
    }

    return hrt
  }

  get created(): BlockNumber {
    return this.getField<BlockNumber>('created')
  }

  get stage(): OpeningStage {
    return this.getField<OpeningStage>('stage')
  }

  get max_review_period_length(): BlockNumber {
    return this.getField<BlockNumber>('max_review_period_length')
  }

  get application_rationing_policy(): Option<ApplicationRationingPolicy> {
    return this.getField<Option<ApplicationRationingPolicy>>('application_rationing_policy')
  }

  get application_staking_policy(): Option<StakingPolicy> {
    return this.getField<Option<StakingPolicy>>('application_staking_policy')
  }

  get role_staking_policy(): Option<StakingPolicy> {
    return this.getField<Option<StakingPolicy>>('role_staking_policy')
  }

  get human_readable_text(): Text {
    return this.getField<Text>('human_readable_text')
  }

  get max_applicants(): number {
    const appPolicy = this.application_rationing_policy
    if (appPolicy.isNone) {
      return 0
    }
    return appPolicy.unwrap().max_active_applicants.toNumber()
  }

  get is_active(): boolean {
    switch (this.stage.type) {
      case OpeningStageKeys.WaitingToBegin:
        return true

      case OpeningStageKeys.Active:
        return (this.stage.value as ActiveOpeningStageVariant).is_active
    }

    return false
  }
}

export type IApplication = {
  opening_id: OpeningId
  application_index_in_opening: u32
  add_to_opening_in_block: BlockNumber
  active_role_staking_id: Option<StakeId>
  active_application_staking_id: Option<StakeId>
  stage: ApplicationStage
  human_readable_text: Text
}

export class Application extends JoyStruct<IApplication> {
  constructor(value?: IOpening) {
    super(
      {
        opening_id: OpeningId,
        application_index_in_opening: u32,
        add_to_opening_in_block: u32,
        active_role_staking_id: Option.with(StakeId),
        active_application_staking_id: Option.with(StakeId),
        stage: ApplicationStage,
        human_readable_text: Text,
      },
      value
    )
  }

  get stage(): ApplicationStage {
    return this.getField<ApplicationStage>('stage')
  }

  get active_role_staking_id(): Option<StakeId> {
    return this.getField<Option<StakeId>>('active_role_staking_id')
  }

  get active_application_staking_id(): Option<StakeId> {
    return this.getField<Option<StakeId>>('active_application_staking_id')
  }

  get human_readable_text(): Text {
    return this.getField<Text>('human_readable_text')
  }
}

export function registerHiringTypes() {
  try {
    getTypeRegistry().register({
      ApplicationId: 'u64',
      OpeningId: 'u64',
      Application,
      ApplicationStage,
      // why the prefix? is there some other identically named type?
      'hiring::ActivateOpeningAt': ActivateOpeningAt,
      ApplicationRationingPolicy,
      OpeningStage,
      StakingPolicy,
      Opening,
    })
  } catch (err) {
    console.error('Failed to register custom types of hiring module', err)
  }
}
