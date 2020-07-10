import React from 'react';
import * as Yup from 'yup';
import {
  withProposalFormData,
  ProposalFormExportProps,
  ProposalFormContainerProps,
  ProposalFormInnerProps,
  genericFormDefaultOptions
} from './GenericProposalForm';
import {
  GenericWorkingGroupProposalForm,
  FormValues as WGFormValues,
  defaultValues as wgFromDefaultValues
} from './GenericWorkingGroupProposalForm';
import { FormField, InputFormField } from './FormFields';
import { withFormContainer } from './FormContainer';
import './forms.css';
import { Dropdown, DropdownItemProps, Header, Checkbox } from 'semantic-ui-react';
import _ from 'lodash';
import Validation from '../validationSchema';
import { useTransport, usePromise } from '@polkadot/joy-utils/react/hooks';
import { OpeningData, ParsedApplication } from '@polkadot/joy-utils/types/workingGroups';
import { PromiseComponent } from '@polkadot/joy-utils/react/components';
import { formatBalance } from '@polkadot/util';
import { withCalls } from '@polkadot/react-api';
import { Option } from '@polkadot/types';
import { BlockNumber } from '@polkadot/types/interfaces';
import { u32 as U32, u128 as U128 } from '@polkadot/types/primitive';
import { getFormErrorLabelsProps, FormErrorLabelsProps } from './errorHandling';
import { RewardPolicy } from '@joystream/types/working-group';
import { FillOpeningParameters } from '@joystream/types/proposals';
import { WorkingGroup } from '@joystream/types/common';
import { OpeningId, ApplicationId } from '@joystream/types/hiring';
import { ApplicationsDetails } from '@polkadot/joy-utils/react/components/working-groups/ApplicationDetails';

export type FormValues = WGFormValues & {
  openingId: string;
  successfulApplicant: string;
  includeReward: boolean;
  rewardAmount: string;
  rewardNextBlock: string;
  rewardRecurring: boolean;
  rewardInterval: string;
};

const defaultValues: FormValues = {
  ...wgFromDefaultValues,
  openingId: '',
  successfulApplicant: '',
  includeReward: true,
  rewardAmount: '',
  rewardNextBlock: '',
  rewardRecurring: true,
  rewardInterval: ''
};

type FormAdditionalProps = {}; // Aditional props coming all the way from export component into the inner form.
type ExportComponentProps = ProposalFormExportProps<FormAdditionalProps, FormValues>;
type FormContainerProps = ProposalFormContainerProps<ExportComponentProps> & {
  currentBlock?: BlockNumber;
};
type FormInnerProps = ProposalFormInnerProps<FormContainerProps, FormValues>;

type RewardPolicyFieldsProps = Pick<FormInnerProps, 'values' | 'handleChange' | 'setFieldValue'> & {
  errorLabelsProps: FormErrorLabelsProps<FormValues>;
};
const RewardPolicyFields: React.FunctionComponent<RewardPolicyFieldsProps> = ({
  values,
  errorLabelsProps,
  handleChange,
  setFieldValue
}) => {
  return (
    <>
      <InputFormField
        label="Amount per payout"
        unit={formatBalance.getDefaults().unit}
        onChange={handleChange}
        name={'rewardAmount'}
        error={errorLabelsProps.rewardAmount}
        value={values.rewardAmount}
        placeholder={'ie. 100'}
      />
      <InputFormField
        label="Next payment at block"
        onChange={handleChange}
        name={'rewardNextBlock'}
        error={errorLabelsProps.rewardNextBlock}
        value={values.rewardNextBlock}
      />
      <FormField>
        <Checkbox
          toggle
          onChange={(e, data) => { setFieldValue('rewardRecurring', data.checked); }}
          label={'Recurring'}
          checked={values.rewardRecurring}/>
      </FormField>
      { values.rewardRecurring && (
        <InputFormField
          label="Reward interval"
          onChange={handleChange}
          name={'rewardInterval'}
          error={errorLabelsProps.rewardInterval}
          value={values.rewardInterval}
          unit={'Blocks'}
        />
      ) }
    </>
  );
};
const valuesToFillOpeningParams = (values: FormValues): FillOpeningParameters => (
  new FillOpeningParameters({
    working_group: new WorkingGroup(values.workingGroup),
    successful_application_id: new ApplicationId(values.successfulApplicant),
    opening_id: new OpeningId(values.openingId),
    reward_policy: new (Option.with(RewardPolicy))(
      values.includeReward
        ? new RewardPolicy({
          amount_per_payout: new U128(values.rewardAmount),
          next_payment_at_block: new U32(values.rewardNextBlock),
          payout_interval: new (Option.with('BlockNumber'))(
            values.rewardRecurring ? values.rewardInterval : null
          ) as Option<BlockNumber>
        })
        : null
    ) as Option<RewardPolicy>
  })
);

const FillWorkingGroupLeaderOpeningForm: React.FunctionComponent<FormInnerProps> = props => {
  const { handleChange, setFieldValue, values, myMemberId, errors, touched } = props;
  const errorLabelsProps = getFormErrorLabelsProps<FormValues>(errors, touched);
  const transport = useTransport();
  // TODO: Abstract this repetitive logic
  const [allOpenings, openingsError, openingsLoading] = usePromise<OpeningData[]>(
    () => transport.workingGroups.allOpenings(values.workingGroup),
    [],
    [values.workingGroup]
  );
  const openingsOptions: DropdownItemProps[] = allOpenings
    // Filter by "ReviewPeriod" only
    .filter(od =>
      od.hiringOpening.stage.isOfType('Active') &&
      od.hiringOpening.stage.asType('Active').stage.isOfType('ReviewPeriod')
    )
    // Map to options
    .map(od => {
      const hrt = od.hiringOpening.parse_human_readable_text_with_fallback();
      return {
        text: `${od.id.toString()}: ${hrt.headline} (${hrt.job.title})`,
        value: od.id.toString()
      };
    });
  const [activeApplications, applError, applLoading] = usePromise<ParsedApplication[]>(
    () => values.openingId !== ''
      ? transport.workingGroups.openingActiveApplications(values.workingGroup, parseInt(values.openingId))
      : new Promise((resolve, reject) => resolve([] as ParsedApplication[])),
    [],
    [values.workingGroup, values.openingId]
  );
  const applicationsOptions = activeApplications
    .map(a => {
      return {
        text: `${a.wgApplicationId}: ${a.member.handle}`,
        image: a.member.avatar_uri.toString() ? { avatar: true, src: a.member.avatar_uri.toString() } : undefined,
        description:
          (a.stakes.application ? `Appl. stake: ${formatBalance(a.stakes.application)}` : '') +
          (a.stakes.role ? (a.stakes.application && ', ') + `Role stake: ${formatBalance(a.stakes.role)}` : ''),
        value: a.wgApplicationId.toString()
      };
    });

  return (
    <GenericWorkingGroupProposalForm
      {...props}
      txMethod="createFillWorkingGroupLeaderOpeningProposal"
      proposalType="FillWorkingGroupLeaderOpening"
      submitParams={[
        myMemberId,
        values.title,
        values.rationale,
        '{STAKE}',
        valuesToFillOpeningParams(values)
      ]}
    >
      <PromiseComponent error={openingsError} loading={openingsLoading} message="Fetching openings...">
        <FormField
          label="Working Group Opening"
          error={errorLabelsProps.openingId}>
          <Dropdown
            onChange={(...args) => {
              setFieldValue('successfulApplicants', []);
              // "as any" assert is required due to some invalid typing of Formik's "handleChange" function (it takes 2 args, not 1)
              return (handleChange as any)(...args);
            }}
            placeholder={'Select an opening'}
            name={'openingId'}
            selection
            options={openingsOptions}
            value={values.openingId}
          />
        </FormField>
      </PromiseComponent>
      { values.openingId && (
        <PromiseComponent error={applError} loading={applLoading} message="Fetching applications...">
          <FormField
            label="Successful applicant"
            error={errorLabelsProps.successfulApplicant}>
            <Dropdown
              placeholder="Select successful applicant"
              fluid
              selection
              options={applicationsOptions}
              value={values.successfulApplicant}
              onChange={handleChange}
              name="successfulApplicant"/>
          </FormField>
          {values.successfulApplicant && (<>
            <Header as="h3">Selected applicant:</Header>
            <ApplicationsDetails applications={
              [activeApplications.find(a => a.wgApplicationId.toString() === values.successfulApplicant)!]
            }/>
            <Header as="h3">Reward policy:</Header>
            <FormField>
              <Checkbox
                toggle
                onChange={(e, data) => { setFieldValue('includeReward', data.checked); }}
                label={'Include reward'}
                checked={values.includeReward}/>
            </FormField>
            { values.includeReward && <RewardPolicyFields {...{ values, errorLabelsProps, handleChange, setFieldValue }}/> }
          </>)}
        </PromiseComponent>
      ) }
    </GenericWorkingGroupProposalForm>
  );
};

const FormContainer = withFormContainer<FormContainerProps, FormValues>({
  mapPropsToValues: (props: FormContainerProps) => ({
    ...defaultValues,
    ...(props.initialData || {})
  }),
  validationSchema: (props: FormContainerProps) => Yup.object().shape({
    ...genericFormDefaultOptions.validationSchema,
    ...Validation.FillWorkingGroupLeaderOpening(props.currentBlock?.toNumber() || 0)
  }),
  handleSubmit: genericFormDefaultOptions.handleSubmit,
  displayName: 'FillWorkingGroupLeaderOpeningForm'
})(FillWorkingGroupLeaderOpeningForm);

export default withCalls<ExportComponentProps>(
  ['derive.chain.bestNumber', { propName: 'currentBlock' }]
)(
  withProposalFormData<FormContainerProps, ExportComponentProps>(FormContainer)
);
