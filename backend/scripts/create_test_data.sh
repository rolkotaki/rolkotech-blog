#!/usr/bin/env bash

set -e


REPO_ROOT_DIR=$(dirname $(realpath $0))/../..
BACKEND_DIR="$REPO_ROOT_DIR/backend"
VENV_ACTIVATE_PATH="$BACKEND_DIR/.venv/bin/activate"
export PYTHONPATH="$PYTHONPATH:$BACKEND_DIR"

(
    # Use the virtual environment if it exists, otherwise use the system Python
    [[ -f "$VENV_ACTIVATE_PATH" ]] && source "$VENV_ACTIVATE_PATH" || echo "Virtual environment not found, continuing with system Python"

    cd "$BACKEND_DIR"
    
    # Run migrations
    alembic upgrade head

    # Create initial testdata in DB
    python app/initial_test_data.py
)
