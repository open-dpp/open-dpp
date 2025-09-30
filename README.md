# <div align="center"><img  src="https://github.com/user-attachments/assets/4ecd546b-ad7c-4c1d-bee4-e06518c41ec8" width="100"/> </br>open-dpp</div>

open-dpp is an open-source platform for managing digital product passports (DPPs).

> **Note:** This repository is under active development and is rapidly evolving. Features, APIs, and architecture may change frequently, and a stable release has not yet been established. We recommend using open-dpp for testing and experimentation purposes only at this stage.

# Deployment

## Local Development

### Install

```shell
npm run install:all
```

### Build and run with docker

```
NODE_ENV=production
```

```shell
npm run build -- --all
cd /apps/main/client
npm run build
docker compose build
docker compose up
```

Now navigate to https://open-dpp.localhost:20080 and accept the security warning coming from using
a local certificate for https.

For email verification go to https://mail.open-dpp.localhost:20080.

// TODO: timing issue. open-dpp seems not to wait for keycloak such that the syncing fails for first docker compose up.

### Run tests

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
