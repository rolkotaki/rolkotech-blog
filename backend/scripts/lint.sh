#!/usr/bin/env bash

set -e
set -x


REPO_ROOT_DIR=$(dirname $(realpath $0))/../..
BACKEND_DIR="$REPO_ROOT_DIR/backend"

(
    cd "$BACKEND_DIR"
    ruff check app
    ruff format app --check
)
