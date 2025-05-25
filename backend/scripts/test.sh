#!/usr/bin/env bash

set -e
set -x


REPO_ROOT_DIR=$(dirname $(realpath $0))/../..
VENV_ACTIVATE_PATH="$REPO_ROOT_DIR/venv/bin/activate"
BACKEND_DIR="$REPO_ROOT_DIR/backend"

(
    # Use the virtual environment if it exists, otherwise use the system Python
    [[ -f "$VENV_ACTIVATE_PATH" ]] && source "$VENV_ACTIVATE_PATH" || echo "Virtual environment not found, continuing with system Python"

    cd "$BACKEND_DIR"

    # Run tests with coverage
    coverage run --source=app -m pytest -p no:warnings "$@"
    coverage report --show-missing
    coverage html --title "Coverage $(date '+%Y-%m-%d %H:%M:%S')" 
)
