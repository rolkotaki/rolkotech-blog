#!/usr/bin/env bash

set -e


REPO_ROOT_DIR=$(dirname $(realpath $0))/../..
VENV_ACTIVATE_PATH="$REPO_ROOT_DIR/venv/bin/activate"
BACKEND_DIR="$REPO_ROOT_DIR/backend"
export PYTHONPATH="$PYTHONPATH:$BACKEND_DIR"

(
    # Use the virtual environment if it exists, otherwise use the system Python
    [[ -f "$VENV_ACTIVATE_PATH" ]] && source "$VENV_ACTIVATE_PATH" || echo "Virtual environment not found, continuing with system Python"

    cd "$BACKEND_DIR"
    
    # Run migrations
    alembic upgrade head

    # Create initial data in DB
    python app/initial_data.py
)
