#! /usr/bin/env bash

set -e


REPO_ROOT_DIR=$(dirname $(realpath $0))/../..
VENV_ACTIVATE_PATH="$REPO_ROOT_DIR/venv/bin/activate"
BACKEND_DIR="$REPO_ROOT_DIR/backend"
export PYTHONPATH="$PYTHONPATH:$BACKEND_DIR"

# Ensure venv exists
if [[ ! -f "$VENV_ACTIVATE_PATH" ]]; then
    echo "Virtual environment not found at $VENV_ACTIVATE_PATH"
    exit 1
fi

# Run migrations
(
    cd "$BACKEND_DIR"
    alembic upgrade head
)

# Create initial data in DB
(
    source "$VENV_ACTIVATE_PATH"
    cd "$BACKEND_DIR"
    python app/initial_data.py
)
