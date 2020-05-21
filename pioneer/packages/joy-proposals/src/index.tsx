
import BN from 'bn.js';
import React from 'react';
import { Route, Switch } from 'react-router';

import { AppProps, I18nProps } from '@polkadot/react-components/types';
import { ApiProps } from '@polkadot/react-api/types';
import { withCalls } from '@polkadot/react-api/with';
import Tabs, { TabItem } from '@polkadot/react-components/Tabs';

// our app-specific styles
import './index.css';

// local imports and components
import translate from './translate';
import Dashboard from './Dashboard';
import Proposals from './Proposals';
import ProposalById from './ProposalById';
import NewForm from './NewForm';
import { queryToProp, ZERO } from '@polkadot/joy-utils/index';

// define out internal types
type Props = AppProps & ApiProps & I18nProps & {
  proposalCount?: BN,
  activeProposalIds?: BN[]
};

class App extends React.PureComponent<Props> {

  private buildTabs (): TabItem[] {
    const { t, proposalCount = ZERO, activeProposalIds = [] } = this.props;
    const activeCount = activeProposalIds.length;
    const finalizedCount = proposalCount.sub(new BN(activeCount)).toNumber();
    return [
      {
        isRoot: true,
        name: 'proposals',
        text: t('Dashboard')
      },
      {
        name: 'active',
        text: t('Active') + ` (${activeCount})`
      },
      {
        name: 'finalized',
        text: t('Finalized') + ` (${finalizedCount})`
      },
      {
        name: 'new',
        text: t('Create new')
      }
    ];
  }

  ActiveProposals = () => {
    return <Proposals {...this.props} title='Active proposals' showActiveOnly={true} />;
  }

  FinalizedProposals = () => {
    return <Proposals {...this.props} title='Finalized proposals' showFinalizedOnly={true} />;
  }

  render () {
    const { basePath } = this.props;
    const tabs = this.buildTabs();
    return (
      <main className='proposals--App'>
        <header>
          <Tabs basePath={basePath} items={tabs} />
        </header>
        <Switch>
          <Route path={`${basePath}/active`} component={this.ActiveProposals} />
          <Route path={`${basePath}/finalized`} component={this.FinalizedProposals} />
          <Route path={`${basePath}/new`} component={NewForm} />
          <Route path={`${basePath}/:id`} component={ProposalById} />
          <Route component={Dashboard} />
        </Switch>
      </main>
    );
  }
}

export default translate(
  withCalls<Props>(
    queryToProp('query.proposals.proposalCount'),
    queryToProp('query.proposals.activeProposalIds')
  )(App)
);
