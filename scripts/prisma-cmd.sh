#!/bin/bash

if [ -z "$1" ]; then
    echo "Usage: npm run prisma:cmd <command_name>"
    echo "Available commands:"
    ls -1 scripts/commands/*.ts | xargs -n 1 basename -s .ts
    exit 1
fi

COMMAND_FILE="scripts/commands/$1.ts"

if [ ! -f "$COMMAND_FILE" ]; then
    echo "Command file not found: $COMMAND_FILE"
    echo "Available commands:"
    ls -1 scripts/commands/*.ts | xargs -n 1 basename -s .ts
    exit 1
fi

npx ts-node "$COMMAND_FILE"
