require('ts-node').register({
  files: true,
})

module.exports = {
  networks: {
    // We currently use Ganache as development network
    development: {
      host: '127.0.0.1',
      port: 8545,
      network_id: 5777,
      gas: 6721975,
    },
  },
  compilers: {
    solc: {
      version: '^0.6.0',
      settings: {
        optimizer: {
          enabled: true,
          runs: 1000,
        },
      },
      evmVersion: 'istanbul',
    },
  },
  mocha: {
    timeout: 60000,
  },
}
