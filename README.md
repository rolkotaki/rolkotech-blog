# RolkoTech Blog

[![Test Backend](https://github.com/rolkotaki/rolkotech-blog/actions/workflows/test_backend.yml/badge.svg)](https://github.com/rolkotaki/rolkotech-blog/actions/workflows/test_backend.yml)
[![codecov](https://codecov.io/gh/rolkotaki/rolkotech-blog/graph/badge.svg?token=UYP0CNGWGI)](https://codecov.io/gh/rolkotaki/rolkotech-blog)
[![Lint Backend](https://github.com/rolkotaki/rolkotech-blog/actions/workflows/lint_backend.yml/badge.svg)](https://github.com/rolkotaki/rolkotech-blog/actions/workflows/lint_backend.yml)
[![Test Docker Compose](https://github.com/rolkotaki/rolkotech-blog/actions/workflows/test_docker_compose.yml/badge.svg)](https://github.com/rolkotaki/rolkotech-blog/actions/workflows/test_docker_compose.yml)
[![Lint Frontend](https://github.com/rolkotaki/rolkotech-blog/actions/workflows/lint_frontend.yml/badge.svg)](https://github.com/rolkotaki/rolkotech-blog/actions/workflows/lint_frontend.yml)
[![Playwright Tests](https://github.com/rolkotaki/rolkotech-blog/actions/workflows/playwright.yml/badge.svg)](https://github.com/rolkotaki/rolkotech-blog/actions/workflows/playwright.yml)

Full stack project with [FastAPI](https://fastapi.tiangolo.com/) and [React](https://react.dev/).

_This project is still in progress..._

## Description

My professional blog for publishing articles on a wide range of IT topics. This website is intended to replace my current blog ([rolkotech.com](https://rolkotech.com/)), which is built on Google's [blogger.com](https://www.blogger.com/).

Features of the website:

- User management
  - Sign up
  - Account activation
  - JWT authentication
  - User data update
  - Password recovery
  - Account deletion
  - Superusers with admin rights
- Blog posts
  - Create new blog posts
  - Edit and delete existing blog posts
  - Search blog posts
  - Mark blog posts as featured
- Tags
  - Create, update and delete tags
  - Assign tags to blog posts
  - Search blog posts by tags
- Comments
  - Comment on blog posts
  - Reply to comments
  - Edit and delete comments
  - Comment moderation for superusers
- Admin dashboard
  - Create new blog post
  - Image uploads
  - User management
  - API Docs

## Technology Stack

#### Backend

- [Python](https://www.python.org/): Programming language
- [FastAPI](https://fastapi.tiangolo.com/): Python web framework to build APIs
- [PostgreSQL](https://www.postgresql.org/): Database
- [SQLModel](https://sqlmodel.tiangolo.com/): SQL database interaction from Python (ORM)
- [Pydantic](https://docs.pydantic.dev/latest/): Data validation
- [alembic](https://alembic.sqlalchemy.org/en/latest/): Database migration tool
- [JWT](https://jwt.io/introduction): JSON Web Token user authentication
- [uv](https://docs.astral.sh/uv/): Python package and project manager
- [pytest](https://docs.pytest.org/en/stable/): Unit testing
- [Ruff](https://docs.astral.sh/ruff/linter/): Linting

#### Frontend

- [TypeScript](https://www.typescriptlang.org/): Programming language
- [React](https://react.dev/): JavaScript library for user interfaces
- [Vite](https://vite.dev/): Build tool for development
- [Tailwind](https://tailwindcss.com/): CSS framework
- [Axios](https://axios-http.com/): HTTP client for APIs
- [React Router](https://reactrouter.com/): Routing
- [React Markdown](https://www.npmjs.com/package/react-markdown): React component to render markdown
- [ESLint](https://eslint.org/): Linting and formatting
- [Prettier](https://prettier.io/): Formatting
- [Playwright](https://playwright.dev/): End-to-end tests

#### Generic

- [Docker](https://www.docker.com/): Docker compose for development, testing and deployment
- [GitHub Actions](https://docs.github.com/en/actions): CI workflows
- [MailerSend](https://www.mailersend.com/): Email API, SMTP service provider
- [VS Code](https://code.visualstudio.com/): Source code editor

## Backend

Backend docs: [backend/README.md](./backend/README.md).

## Frontend

Frontend docs: [frontend/README.md](./frontend/README.md).

## License

This project is licensed under the terms of the MIT license.
