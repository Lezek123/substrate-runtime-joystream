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

    const currentBlock = await this.getApi().derive.chain.bestNumber();
    console.log('Current block', currentBlock.toNumber());

    const blockHash1 = await this.getApi().rpc.chain.getBlockHash(1);
    const accAt1 = await this.getApi().query.dataDirectory.primaryLiaisonAccountId.at(blockHash1);
    console.log('dataDirectory.primaryLiaisonAccountId at block 1:', accAt1.toJSON());

    const blockHash10 = await this.getApi().rpc.chain.getBlockHash(20);
    const accAt10 = await this.getApi().query.dataDirectory.primaryLiaisonAccountId.at(blockHash10);
    console.log('dataDirectory.primaryLiaisonAccountId at block 20:', accAt10.toJSON());
  }
}
