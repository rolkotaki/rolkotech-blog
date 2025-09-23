# RolkoTech Blog - Frontend

React project with TypeScript implementing the frontend.

## Requirements

- [Node.js](https://nodejs.org/en)

## Run With Docker Compose

Clone the repository and go to the root folder.<br>
Start an instance of the website (backend and frontend):

```
docker compose up -d
```

The database data and coverage results are mapped into the `docker` folder in your repository root, so changes will be kept if you run it again, unless you delete this folder.

Open in the browser: [localhost](http://localhost/)

Stop and remove all containers:

```
docker compose down -v
```

### Docker Compose for Development

Use the development version of Docker Compose so that your local repos are volume shared and your local changes are reflected inside the containers.

```
docker compose -f docker-compose.dev.yml up -d
```

Open in the browser: [localhost:5173](http://localhost:5173/)

Stop and remove all containers:

```
docker compose -f docker-compose.dev.yml down -v
```

## Local Development

Follow these steps to run the frontend locally.

### Install Packages

To install the npm packages, run from the `frontend` folder:

```
npm install
```

## Run Frontend

To run the frontend in development mode, run from the `frontend` folder:

```
npm run dev
```

Frontend: [localhost:5173](http://localhost:5173/)

## Build Frontend

To build the frontend, run from the `frontend` folder:<br>
_(Make sure your `BACKEND_HOST` and `API_VERSION_STR` environment variables are available.)_

```
npm run build
```

The built files will be in the `dist` folder.

To preview the build locally:

```
npm run preview
```

Open in the browser: [localhost:4173](http://localhost:4173/)<br>
(Make sure you have it added to the CORS setting.)

## End-to-end Tests

The frontend implements end-to-end tests using [Playwright](https://playwright.dev/). In the `playwright.config.ts` there are several projects defined with different browsers for desktop and mobile as well. If you want to run the tests locally, choose one project and comment the others, otherwise there will be issues with several projects using the same database.

To run the Playwright tests, you need to have the test data initialized in the database and the backend running.<br>
You can either run the Docker Compose for Playwright:

```
docker compose -f docker-compose.playwright.yml up -d
```

Or you can do it manually from the `backend` folder:

```
./scripts/create_test_data.sh
source .venv/bin/activate
fastapi dev ./app/main.py
```

_I recommend using the Docker Compose, this way you don't overwrite and clean your data in the local database._

Now you can run the Playwright tests from the `frontend` folder:

```
npx playwright test --headed
```

The `--headed` argument makes the tests run in headed browsers. If you don't need that, just run:

```
npx playwright test
```

In the `package.json` I added serveral `npm` commands (scripts), feel free to take a look at them for more options.

When the tests have finished, stop the Docker Compose:

```
docker compose -f docker-compose.playwright.yml down -v
```

## Linting and Formatting

Run the linter and formatter using the script from the `frontend` folder:

```
./scripts/lint.sh
```

### Linting

The project uses [ESLint](https://eslint.org/) for linting.

Run linting:

```
npm run lint
```

To fix auto-fixable issues:

```
npm run lint -- --fix
```

### Formatting

The project uses [Prettier](https://prettier.io/) for code formatting.

Format all files automatically:

```
npm run format
```

Check if files are formatted correctly without changing them:

```
npm run format:check
```
