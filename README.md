## Local Development
### Install
```shell
npm i
cd /apps/main/client
npm install 
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
