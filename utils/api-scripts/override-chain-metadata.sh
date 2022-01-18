SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
INPUT_PATH_1=$(readlink -f $1 || echo "")
INPUT_PATH_2=$(readlink -f $2 || echo "")
NEW_METADATA_JSON_PATH=${INPUT_PATH_1:=$(readlink -f "$SCRIPT_PATH/../../mock-metadata.json")}
ROOT_CHAIN_METADATA_PATH=${INPUT_PATH_2:=$(readlink -f "$SCRIPT_PATH/../../chain-metadata.json")}

echo "Overriding $ROOT_CHAIN_METADATA_PATH based on $NEW_METADATA_JSON_PATH..."

cd $SCRIPT_PATH
yarn run --silent ts-node ./src/encode-metadata.ts $NEW_METADATA_JSON_PATH > tmp-chain-metadata-encoded
jq -R '{ jsonrpc: "2.0", result: ., id: 1 }' tmp-chain-metadata-encoded > $ROOT_CHAIN_METADATA_PATH
rm tmp-chain-metadata-encoded
