// Deployments currently have bad support when it comes to TypeScript
// which is why this re-export file is required (see: https://soliditydeveloper.com/typescript)
/* global artifacts */
module.exports = require('./deploy_contracts')(artifacts)
