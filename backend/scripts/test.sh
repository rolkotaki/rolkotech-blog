#!/usr/bin/env bash

set -e
set -x


REPO_ROOT_DIR=$(dirname $(realpath $0))/../..
BACKEND_DIR="$REPO_ROOT_DIR/backend"
VENV_ACTIVATE_PATH="$BACKEND_DIR/.venv/bin/activate"
COVERAGE_DIR="$BACKEND_DIR/coverage"
BLOGPOSTS_UPLOADS_DIR="$BACKEND_DIR/uploads/images/blogposts"

COMMIT_HASH="$1"
shift || true

(
    # Use the virtual environment if it exists, otherwise use the system Python
    [[ -f "$VENV_ACTIVATE_PATH" ]] && source "$VENV_ACTIVATE_PATH" || echo "Virtual environment not found, continuing with system Python"

    cd "$BACKEND_DIR"
    mkdir -p "$COVERAGE_DIR"

    # Set the test mode to True
    export TEST_MODE=True

    # Remove previously uploaded test images
    find "$BLOGPOSTS_UPLOADS_DIR" -type f -name "test_image*" -delete

    # Run tests with coverage
    TITLE=${COMMIT_HASH:-$(date '+%Y-%m-%d %H:%M:%S')}
    coverage run --source=app --data-file="$COVERAGE_DIR/.coverage" -m pytest -p no:warnings "$@"
    coverage report --show-missing --data-file="$COVERAGE_DIR/.coverage"
    coverage html --title "Coverage $TITLE" --directory="$COVERAGE_DIR/htmlcov" --data-file="$COVERAGE_DIR/.coverage"
    coverage xml -o "$COVERAGE_DIR/coverage.xml" --data-file="$COVERAGE_DIR/.coverage"
)
