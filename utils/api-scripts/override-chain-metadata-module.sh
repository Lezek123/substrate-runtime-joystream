MODULE=$1
METADATA_PATH=$(readlink -f $2)

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

echo "Overriding $MODULE module in $METADATA_PATH..."
./export-chain-metadata.sh > new-chain-metadata.json
MODULE_INDEX=$(cat $METADATA_PATH | jq ".metadata.v12.modules[] | select(.name==\"$MODULE\") | .index")
NEW_MODULE_JSON=$(cat ./new-chain-metadata.json | jq ".metadata.v12.modules[] | select(.name==\"$MODULE\")")
cat $METADATA_PATH \
  | jq "(.metadata.v12.modules[] | select(.name==\"$MODULE\")) = $NEW_MODULE_JSON" \
  | jq "(.metadata.v12.modules[] | select(.name==\"$MODULE\") | .index) = $MODULE_INDEX" \
  > overriden-metadata.json
mv overriden-metadata.json $METADATA_PATH
rm new-chain-metadata.json
