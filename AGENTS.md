## Cursor Cloud specific instructions

### Overview

open-dpp is a **pnpm + Turborepo monorepo** for managing Digital Product Passports (DPPs). It consists of:
- **Backend** (`apps/main`): NestJS API server on port 3000
- **Frontend** (`apps/client`): Vue 3 + Vite SPA on port 5173 (dev server)
- **Shared packages** in `packages/` (dto, api-client, env, permission, exception, testing, config-eslint)

### Standard commands

See `README.md` and root `package.json` for the full list. Key scripts:
- `pnpm install` — install dependencies
- `pnpm run build` — build all packages and apps
- `pnpm run dev` — start backend + frontend in watch mode
- `pnpm run lint` — ESLint across all packages
- `pnpm test` — unit/integration tests (uses in-memory MongoDB; no Docker needed)

### Infrastructure services (Docker)

Development requires Docker containers defined in `docker-compose.dev.yml`:
- **MongoDB 7** (replica set) on port 20005
- **MinIO** (S3-compatible storage) on port 9000
- **Mailpit** (email testing) on port 8025 (UI) / 8026 (SMTP)
- **ClamAV** (virus scanning) on port 20006

Start them with:
```sh
docker compose --env-file .env.dev -f docker-compose.dev.yml up -d
```

**Important caveats:**
- Before first run, create the MongoDB keyfile: `openssl rand -base64 756 > docker/mongo_keyfile && sudo chown 999:999 docker/mongo_keyfile && chmod 0400 docker/mongo_keyfile`
- The `.env.dev` file must exist (copy from `.env.dev.example`). The `OPEN_DPP_URL` must be set to `http://localhost:3000` (not `http://localhost`) for auth callback validation to work in dev mode.
- `OPEN_DPP_SERVICE_TOKEN` and `OPEN_DPP_AAS_TOKEN` must be at least 16 characters.

### Accessing the app in dev mode

In development, the NestJS backend at **http://localhost:3000** proxies all non-`/api` routes to the Vite dev server (port 5173). Always access the app at `http://localhost:3000`, not `http://localhost:5173`, to avoid `INVALID_CALLBACK_URL` errors during signup/signin (the auth `trustedOrigins` is set to `OPEN_DPP_URL`).

### Running tests

- **Unit/integration tests** (`pnpm test`): Uses `mongodb-memory-server` (in-memory MongoDB). No Docker services needed.
- **Frontend tests** (`pnpm test:client`): Vitest with jsdom. No Docker services needed.
- **E2E tests** (`pnpm test:e2e`): Playwright. Requires the full stack running (Docker + `pnpm run dev`).

### Email verification

During testing, emails are captured by Mailpit at http://localhost:8025. After user signup, a verification email is sent there. Click the "Verify email" link in Mailpit to complete verification.
