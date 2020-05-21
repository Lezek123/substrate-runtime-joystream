import BN from 'bn.js';
import React from 'react';

import { I18nProps } from '@polkadot/react-components/types';
import { ApiProps } from '@polkadot/react-api/types';
import { withCalls, withMulti } from '@polkadot/react-api/with';
import { u8aToHex, formatNumber } from '@polkadot/util';
import { Input, InputFile, Labelled } from '@polkadot/react-components/index';
import { Balance } from '@polkadot/types/interfaces';

import translate from './translate';
import { nonEmptyStr } from '@polkadot/joy-utils/index';
import TxButton from '@polkadot/joy-utils/TxButton';
import InputStake from '@polkadot/joy-utils/InputStake';
import TextArea from '@polkadot/joy-utils/TextArea';
import { MyAddressProps, withOnlyMembers } from '@polkadot/joy-utils/MyAccount';

type Props = ApiProps & I18nProps & MyAddressProps & {
  minStake?: Balance
};

type State = {
  stake?: BN,
  name?: string,
  description?: string,
  wasmCode?: Uint8Array,
  isStakeValid?: boolean,
  isNameValid?: boolean,
  isDescriptionValid?: boolean,
  isWasmCodeValid?: boolean
};

class Component extends React.PureComponent<Props, State> {

  state: State = {};

  render () {
    const { stake, name, description, wasmCode, isStakeValid, isWasmCodeValid } = this.state;
    const isFormValid = this.isFormValid();

    const wasmFilePlaceholder = wasmCode && isWasmCodeValid
      ? formatNumber(wasmCode.length) + ' bytes'
      : 'Drag and drop a WASM file here';

    const wasmHex = isFormValid ? u8aToHex(wasmCode) : null;

    return (
      <div>
        <InputStake
          min={this.minStake()}
          isValid={isStakeValid}
          onChange={this.onChangeStake}
        />
        <div className='ui--row'>
          <Input
            label='Proposal name:'
            value={name}
            onChange={this.onChangeName}
          />
        </div>
        <div className='ui--row'>
          <TextArea
            rows={3}
            autoHeight={true}
            label='Full description:'
            placeholder='Provide full description of your proposal: new features, improvements, bug fixes etc.'
            onChange={this.onChangeDescription}
            value={description}
          />
        </div>
        <div className='ui--row'>
          <div className='full'>
            <InputFile
              // clearContent={!wasmCode && isWasmCodeValid}
              // isError={!isWasmCodeValid}
              label='WASM code of runtime upgrade:'
              placeholder={wasmFilePlaceholder}
              onChange={this.onChangeWasmCode}
            />
          </div>
        </div>
        <Labelled style={{ marginTop: '.5rem' }}>
          <TxButton
            isDisabled={!isFormValid}
            label='Submit my proposal'
            params={[stake, name, description, wasmHex]}
            tx='proposals.createProposal'
          />
        </Labelled>
      </div>
    );
  }

  private onChangeName = (name?: string) => {
    // TODO validate min / max len based on properties from Substrate:
    const isNameValid = nonEmptyStr(name);
    this.setState({ name, isNameValid });
  }

  private onChangeDescription = (description?: string) => {
    // TODO validate min / max len based on properties from Substrate:
    const isDescriptionValid = nonEmptyStr(description);
    this.setState({ description, isDescriptionValid });
  }

  private onChangeWasmCode = (wasmCode: Uint8Array) => {
    // TODO validate min / max len based on properties from Substrate:
    let isWasmCodeValid = wasmCode && wasmCode.length > 0;
    this.setState({ wasmCode, isWasmCodeValid });
  }

  private minStake = (): BN => {
    return this.props.minStake || new BN(1);
  }

  private onChangeStake = (stake?: BN): void => {
    const isStakeValid = stake && stake.gte(this.minStake());
    this.setState({ stake, isStakeValid });
  }

  private isFormValid = (): boolean => {
    const s = this.state;
    return (
      s.isStakeValid &&
      s.isNameValid &&
      s.isDescriptionValid &&
      s.isWasmCodeValid
    ) ? true : false;
  }
}

export default withMulti(
  Component,
  translate,
  withOnlyMembers,
  withCalls<Props>(
    ['query.proposals.minStake', { propName: 'minStake' }]
  )
);
