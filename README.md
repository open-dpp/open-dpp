# <div align="center"><img  src="https://github.com/user-attachments/assets/4ecd546b-ad7c-4c1d-bee4-e06518c41ec8" width="100"/> </br>open-dpp</div>

open-dpp is an open-source platform for managing digital product passports (DPPs).

> **Note:** This repository is under active development and is rapidly evolving. Features, APIs, and architecture may change frequently, and a stable release has not yet been established. We recommend using open-dpp for testing and experimentation purposes only at this stage.

# Local Development
## Install dependencies
```shell
pnpm install
```

## Configure environment
```shell
cp .env.dev.example .env.dev
```
Replace the secrets and api tokens marked with:
* change-to-secure-mongo-password
* change-to-a-secret-key
* your-mistral-key
* secure-keycloak-password

## Build
Build packages
```shell
cd packages
pnpm run build
```
Build frontend, backend, mcp
```shell
pnpm run build
```

## Run
Download all necessary docker images
```shell
docker compose -f docker-compose.dev.yml pull
```
Start all containers with
```shell
docker compose -f docker-compose.dev.yml up
```
Run ui with
```shell
pnpm run dev
```
Run backend with
```shell
pnpm run dev:main
```

Now navigate to http://open-dpp.localhost:20080

For email verification go to https://mail.open-dpp.localhost:20080.

## Run tests

To run the backend tests you have to run

```shell
docker compose up
npm run test
```

To run frontend unit tests:

```shell
cd apps/main/client
npm run test
```

To run frontend component tests

```shell
cd apps/main/client
npm run cypress:headless
```

# Deployment
// TODO curl command to download all files for deployment

* Create a directory for the project
* Download docker-compose.yml
* Download .env-example and rename it to .env
* Download Caddyfile
* Download keycloak-realm.json
* Create secrets with your favorite secret generator and replace all secrets in .env
* Adapt all urls to your domain

```
docker compose up
```