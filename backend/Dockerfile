FROM python:3.13.3

# https://docs.astral.sh/uv/guides/integration/docker/#installing-uv
COPY --from=ghcr.io/astral-sh/uv:0.7.13 /uv /uvx /bin/

COPY . /app/
WORKDIR /app/backend/

ENV PYTHONUNBUFFERED 1
ENV PYTHONPATH=/rolkotech-blog/backend
ENV PATH="/app/backend/.venv/bin:$PATH"
ENV UV_COMPILE_BYTECODE=1

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked --group dev
