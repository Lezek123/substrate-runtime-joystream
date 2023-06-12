import { scenario } from '../Scenario'
import buyingMemberships from '../flows/membership/buyingMemberships'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
scenario('Orion', async ({ job }) => {
  console.log('Running integration tests on PR branch')
  job('buying memberships', buyingMemberships)
})
