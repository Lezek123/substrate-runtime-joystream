#!/usr/bin/env bash

set -e

sed -i 's/sanitizeNullCharacter(entity, field);/\/\/sanitizeNullCharacter(entity, field);/g' ./node_modules/@joystream/hydra-processor/lib/db/subscribers.js
