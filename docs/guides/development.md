# Local development

## 1) Install dependencies

```bash
pnpm install
```

## 2) Configure environment

Create your local environment file:

```bash
cp .env.dev.example .env.dev
```

Then update secrets and tokens in `.env.dev`.

## 3) Generate MongoDB key file

```bash
openssl rand -base64 756 > docker/mongo_keyfile
chmod 0400 docker/mongo_keyfile
```

## 4) Start local infrastructure

Use the project helper:

```bash
make dev
```

This starts required services from `docker-compose.dev.yml` (MongoDB, MinIO, and ClamAV).

Mail is off by default: the backend logs the verification, password-reset and invitation links instead of sending them. To send mail through [Mailpit](https://mailpit.axllent.org/) (a local mail catcher with a web inbox), uncomment the mail block in `.env.dev` — `COMPOSE_PROFILES=mail` plus the `OPEN_DPP_MAIL_*` variables — and rerun `make dev`.

## 5) Start the application

```bash
pnpm run dev
```

After startup:

- open-dpp: <http://localhost:3000>
- Mailpit (only with the `mail` profile): <http://localhost:8025>

## 6) Run the end-to-end tests

The Playwright suite in `apps/e2e` drives a real browser against a running app,
so keep the infrastructure from step 4 and the app from step 5 up. It reads
verification and revoke mails from Mailpit, so the `mail` block in `.env.dev`
must be enabled, and it signs its own users up, so the instance needs
`OPEN_DPP_INSTANCE_SIGNUP_ENABLED` and
`OPEN_DPP_INSTANCE_ORGANIZATION_CREATION_ENABLED` set to `"true"` in `.env.dev`.

```bash
pnpm run test:e2e      # headless
pnpm run test:e2e:ui   # interactive Playwright UI
```

To run a single project or spec, go through Playwright directly:

```bash
pnpm run test:e2e -- --project=account
```

CI runs the `setup`, `chromium` and `account` projects on every pull request
(`.github/workflows/e2e.yml`); `firefox` and `webkit` are local-only.
