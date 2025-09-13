#!/usr/bin/env bash

set -e
set -x


REPO_ROOT_DIR=$(dirname $(realpath $0))/../..
FRONTEND_DIR="$REPO_ROOT_DIR/frontend"

(
    cd "$FRONTEND_DIR"

    # Run linters
    npm run lint
    npm run format:check
)
