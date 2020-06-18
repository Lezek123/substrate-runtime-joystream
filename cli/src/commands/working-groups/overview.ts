import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase';
import { displayHeader, displayNameValueTable, displayTable } from '../../helpers/display';
import { formatBalance } from '@polkadot/util';
import chalk from 'chalk';

export default class WorkingGroupsOverview extends WorkingGroupsCommandBase {
    static description = 'Shows an overview of given working group (current lead and workers)';
    static flags = {
        ...WorkingGroupsCommandBase.flags,
    };

    async run() {
        const lead = await this.getApi().groupLead(this.group);
        const members = await this.getApi().groupMembers(this.group);

        displayHeader('Group lead');
        if (lead) {
            displayNameValueTable([
                { name: 'Member id:', value: lead.lead.member_id.toString() },
                { name: 'Member handle:', value: lead.profile.handle.toString() },
                { name: 'Role account:', value: lead.lead.role_account_id.toString() },
            ]);
        }
        else {
            this.log(chalk.yellow('No lead assigned!'));
        }

        displayHeader('Members');
        const membersRows = members.map(m => ({
            'Worker id': m.workerId.toString(),
            'Member id': m.memberId.toString(),
            'Member handle': m.profile.handle.toString(),
            'Stake': formatBalance(m.stake),
            'Earned': formatBalance(m.earned)
        }));
        displayTable(membersRows, 5);
    }
  }
