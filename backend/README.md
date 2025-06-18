# RolkoTech Blog - Backend

FastAPI backend implementing the REST APIs and backend functionalities of this project.

## Requirements

* [Docker](https://www.docker.com/)
* [uv](https://docs.astral.sh/uv/)
* [SendGrid](https://sendgrid.com/en-us): Having an account

## Run With Docker Compose

Clone the repository and go to the root folder.<br>
Start a clean instance of the website:
```
docker compose up -d
```
The database data (and coverage results) is mapped into the `docker/postgres_data` folder in your repository root, so changes will be kept if you run it again, unless you delete this folder or run `docker compose down -v`.

Open in the browser: [127.0.0.1:8000](http://127.0.0.1:8000/)

Stop and remove all containers:
```
docker compose down
```

## Local Development

Follow these steps to run the project locally.

### Create Database

Run the following commands on `psql`, the PostgreSQL terminal:
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

*If you still use `pip`, you can skip the `uv` part and check below for instuctions.*

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
```
# From the backend folder
python3 -m venv env
source env/bin/activate
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
Backend: [127.0.0.1:8000](http://127.0.0.1:8000/) (Concatenate your API version string if you have.)<br>
Backend docs: [127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

## Run Tests

Run tests using the script from the `backend` folder:
```
./scripts/test.sh
```
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
