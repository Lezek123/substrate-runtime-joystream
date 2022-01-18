import fs from 'fs'
import { createType } from '@joystream/types'
import { Metadata } from '@polkadot/types'

const inputFile = process.argv[2]

async function main() {
  const metadataJson = JSON.parse(fs.readFileSync(inputFile).toString())
  console.log(createType<Metadata, 'Metadata'>('Metadata', metadataJson).toHex())
}

main()
  .then(() => process.exit(0))
  .catch(console.error)
