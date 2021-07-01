import electCouncil from '../flows/council/elect'
import { scenario } from '../Scenario'
import leadOpening from '../flows/working-groups/leadOpening'
import initializeStagingNetwork from '../flows/staging/initializeStagingNetwork'

scenario(async ({ job, env }) => {
  const councilJob = job('electing council', electCouncil)
  const sudoHireLead = job('sudo hire leads', leadOpening).requires(councilJob)
  job('init staging network', [initializeStagingNetwork]).requires(sudoHireLead)
})
