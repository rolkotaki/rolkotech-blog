#!/usr/bin/env bash

set -e
set -x


REPO_ROOT_DIR=$(dirname $(realpath $0))/../..
VENV_ACTIVATE_PATH="$REPO_ROOT_DIR/venv/bin/activate"
BACKEND_DIR="$REPO_ROOT_DIR/backend"

# Ensure venv exists
if [[ ! -f "$VENV_ACTIVATE_PATH" ]]; then
    echo "Virtual environment not found at $VENV_ACTIVATE_PATH"
    exit 1
fi

# Run tests with coverage
(
    source "$VENV_ACTIVATE_PATH"
    cd "$BACKEND_DIR"

    coverage run --source=app -m pytest -p no:warnings "$@"
    coverage report --show-missing
    coverage html --title "Coverage $(date '+%Y-%m-%d %H:%M:%S')" 
)
