#!/bin/bash

set -e

main() {
    local dest="/asset/node_modules/@terascope/standard-asset-apis"
    if [ -d "$dest" ]; then
        echo "* copying the files from standard-asset-apis"
        rm "$dest"
        cp -R ./packages/standard-asset-apis/* "$dest"
    fi
}

main "$@"
