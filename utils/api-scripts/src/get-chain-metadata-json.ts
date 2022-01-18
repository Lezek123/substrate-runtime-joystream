import { ApiPromise, WsProvider } from '@polkadot/api'
import { types } from '@joystream/types'

async function main() {
  // Initialise the provider to connect to the local node
  const provider = new WsProvider('ws://127.0.0.1:9944')
  const api = await ApiPromise.create({ provider, types })
  const chainMetadata = await api.rpc.state.getMetadata()
  console.log(JSON.stringify(chainMetadata.toJSON(), null, 4))
  api.disconnect()
}

main()
  .then(() => process.exit(0))
  .catch(console.error)
