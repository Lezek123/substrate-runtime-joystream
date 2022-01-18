SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

yarn run --silent ts-node src/get-chain-metadata-json.ts
