# <div align="center"><img  src="https://github.com/user-attachments/assets/4ecd546b-ad7c-4c1d-bee4-e06518c41ec8" width="100"/> </br>open-dpp</div>

open-dpp is an open-source platform for managing digital product passports (DPPs).

> **Note:** This repository is under active development and is rapidly evolving. Features, APIs, and architecture may change frequently, and a stable release has not yet been established. We recommend using open-dpp for testing and experimentation purposes only at this stage.

# Local Development
## Install dependencies

```shell
npm run install:all
```

## Build and run with docker

```shell
docker build -t ghcr.io/open-dpp/open-dpp .
docker compose up
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
* Create secrets with your favorite secret generator and replace all secrets in .env
* Adapt all urls to your domain

```
docker compose up
```