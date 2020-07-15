import Api from '../../Api'
import StateAwareCommandBase from '../../base/StateAwareCommandBase'
import { ApiPromise } from '@polkadot/api'
import { CLIError } from '@oclif/errors'

export default class ApiReadOldState extends StateAwareCommandBase {
  static description = 'Read some old state using new node!'
  private api: ApiPromise | undefined

  async init() {
    await super.init()
    const apiUri: string = this.getPreservedState().apiUri
    this.api = (await Api.create(apiUri, true)).getOriginalApi();
  }

  getApi() {
    if (!this.api) throw new CLIError('Trying to get api before initialized!');
    return this.api;
  }

  async run() {
    console.log('Trying to query old api method (dataDirectory.primaryLiaisonAccountId)...')
    const res = await this.getApi().query.dataDirectory.primaryLiaisonAccountId();
    console.log('Result:', res);
  }
}
