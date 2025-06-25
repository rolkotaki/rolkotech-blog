# RolkoTech Blog

[![Test Backend](https://github.com/rolkotaki/rolkotech-blog/actions/workflows/test_backend.yml/badge.svg)](https://github.com/rolkotaki/rolkotech-blog/actions/workflows/test_backend.yml)
[![codecov](https://codecov.io/gh/rolkotaki/rolkotech-blog/graph/badge.svg?token=UYP0CNGWGI)](https://codecov.io/gh/rolkotaki/rolkotech-blog)
[![Lint Backend](https://github.com/rolkotaki/rolkotech-blog/actions/workflows/lint_backend.yml/badge.svg)](https://github.com/rolkotaki/rolkotech-blog/actions/workflows/lint_backend.yml)

Full stack project with [FastAPI](https://fastapi.tiangolo.com/) and React (possibly, still under consideration).

This project is still in progress ...

## Description

My personal professional blog to publish articles on a wide range of topics in the IT field. This website is to replace my current blog ([rolkotech.blogspot.com](https://rolkotech.blogspot.com/)) which uses Google's [blogger.com](https://www.blogger.com/).

Features of the website:
* User management
  - Sign up
  - Account activation
  - JWT authentication
  - Password recovery
  - Account deletion
  - Superusers with admin rights
* Blog posts
  - Create new blog posts
  - Edit and delete existing posts
* Tags
  - Create, update and delete tags
  - Assign tags to blog posts
* Comments
  - Comment on blog posts
  - Edit and delete comments

## Technology Stack

#### Backend
* [Python](https://www.python.org/): Programming language
* [FastAPI](https://fastapi.tiangolo.com/): Python web framework to build APIs
* [PostgreSQL](https://www.postgresql.org/): Database
* [alembic](https://alembic.sqlalchemy.org/en/latest/): Database migration tool
* [JWT](https://jwt.io/introduction): JSON Web Token user authentication
* [uv](https://docs.astral.sh/uv/): Python package and project manager
* [pytest](https://docs.pytest.org/en/stable/): Unit testing
* [Ruff](https://docs.astral.sh/ruff/linter/): Linting

#### Frontend
* Coming soon ...

#### Generic
* [Docker](https://www.docker.com/): Docker compose for testing, deploying and developing
* [GitHub Actions](https://docs.github.com/en/actions): CI workflows
* [SendGrid](https://sendgrid.com/en-us): Email API, SMTP service provider
* [VS Code](https://code.visualstudio.com/): Source code editor


## Backend

Backend docs: [backend/README.md](./backend/README.md).

## Frontend

Coming soon ...

## License

This project is licensed under the terms of the MIT license.
