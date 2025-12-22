# RolkoTech Blog - Backend

FastAPI project implementing the REST APIs and backend functionalities.

## Requirements

- [PostgreSQL](https://www.postgresql.org/)
- [Docker](https://www.docker.com/)
- [uv](https://docs.astral.sh/uv/)
- [MailerSend](https://www.mailersend.com/) account (or feel free to change it)

## Run With Docker Compose

Clone the repository and go to the root folder.<br>
Start an instance of the backend:

```
docker compose up -d db backend_prestart backend
```

The database data and coverage results are mapped into the `docker` folder in your repository root, so changes will be kept if you run it again, unless you delete this folder.

Open in the browser: [localhost:8000/docs](http://localhost:8000/docs)

Stop and remove all containers:

```
docker compose down -v
```

### Docker Compose for Development

Use the development version of Docker Compose so that your local repo is volume shared and your local changes are reflected inside the container.

```
docker compose -f docker-compose.dev.yml up -d db backend_prestart backend
```

Open in the browser: [localhost:8000/docs](http://localhost:8000/docs)

Stop and remove all containers:

```
docker compose -f docker-compose.dev.yml down -v
```

## Local Development

Follow these steps to run the backend locally.

### Create Database

Run the following commands on `psql`, the PostgreSQL terminal (replace `youruser` and `yourpassword` with your desired credentials):

```
CREATE DATABASE rolkotech_blog;
CREATE USER youruser WITH password 'yourpassword';
ALTER ROLE youruser SET client_encoding TO 'utf8';
ALTER ROLE youruser SET default_transaction_isolation TO 'read committed';
ALTER ROLE youruser SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE rolkotech_blog TO youruser;
ALTER DATABASE rolkotech_blog OWNER TO youruser;
ALTER ROLE youruser createdb;
```

### Create the `.env` file

As a template, you can use the `.env_template` file that I committed to the repository.

### Install `uv`

I use `uv` as the package manager. To install `uv`, please follow this [simple guide](https://docs.astral.sh/uv/getting-started/installation/).

_If you still use `pip`, you can skip the `uv` part and check below for instructions._

### Install Python packages with `uv`

From the `backend` folder execute:

```
uv sync --group dev
```

Then you can activate the virtual environment:

```
source .venv/bin/activate
```

And to deactivate:

```
deactivate
```

### Install Python packages with `pip`

If you prefer `pip`, I committed to the repository the `requirements.txt` files as well.

Run from the backend folder:

```
python3 -m venv venv
source venv/bin/activate
pip3 install -r requirements_dev.txt
```

### Database Migration

To run the database migration and create the superuser, you can simply run the following script from the `backend` folder:

```
./scripts/prestart.sh
```

Or, as `alembic` is already configured for this project, you can use `alembic` directly to run the migration:

```
alembic upgrade head
```

Then, when you make changes in the models, run:

```
alembic revision --autogenerate -m "Your migration description"
# Sometimes you manually have to add import for `sqlmodel` in the generated script.
alembic upgrade head
```

To create the superuser, you can call this Python script, assuming you have the virtual environment activated:

```
python app/initial_data.py
```

## Run Backend

To run the FastAPI backend in development mode, run from the `backend` folder:

```
fastapi dev ./app/main.py
```

Backend: [localhost:8000](http://localhost:8000/) (Concatenate your API version string if you have.)<br>
Backend docs: [localhost:8000/docs](http://localhost:8000/docs)

## Production Features

- **Rate Limiting**: Implemented with `slowapi` on login (5/min), signup and password reset (3/min)
- **Health Check**: `/health` endpoint returns status, environment, and version
- **Gunicorn**: Production server with 4 workers using `Uvicorn` worker class
- **Logging**: Environment-aware JSON logging
- **SEO**: Dynamic `sitemap.xml` endpoint at `/api/sitemap.xml`

## Run Tests

Run tests using the script from the `backend` folder:

```
./scripts/test.sh
```

Rate limiting is disabled during tests via `TEST_MODE=True` environment variable.

When the tests are run, a file named `htmlcov/index.html` is generated in the `backend/coverage`, you can open it in your browser to see the coverage results.

Run tests with `pytest`:

```
pytest --cov=app --cov-report=html
open htmlcov/index.html
```

## Run Linters

Run linters using the script from the `backend` folder:

```
./scripts/lint.sh
```

Run linters with `Ruff`:

```
ruff check app
ruff format app --check
```

With `ruff format app --diff` you can see the changes that would be applied by `ruff format app`.

#

FastAPI's open source [full stack template](https://github.com/fastapi/full-stack-fastapi-template) was a great reference and guide, to which I was happy to contribute with [this PR](https://github.com/fastapi/full-stack-fastapi-template/pull/1672) to fix a bug.
