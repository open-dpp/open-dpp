# Contributing to open-dpp

Thank you for your interest in contributing to open-dpp.

We welcome contributions of all sizes, including bug fixes, documentation improvements, tests, refactorings, and new features.

## Before you start

- For larger changes, open an issue first to discuss scope and approach.
- For small fixes (typos, docs improvements, minor bug fixes), you can usually open a PR directly.
- Keep pull requests focused. Smaller, well-scoped PRs are easier to review and merge.

## Architecture and on-ramp

This repository is a pnpm + Turborepo monorepo. If you are new to open-dpp, start by understanding the runtime boundaries (backend API, frontend app, shared packages, and supporting infrastructure), then pick a small issue in one area.

### System layout

- `apps/main/src/` — NestJS backend API and domain logic.
- `apps/client/src/` — Vue frontend that consumes backend APIs.
- `apps/e2e/` — Playwright end-to-end tests.
- `packages/` — shared libraries (`dto`, `api-client`, `env`, `exception`, `permission`, `testing`).
- `docs/` — VitePress documentation and guides.
- `docker/`, `docker-compose*.yml` — local infrastructure setup (MongoDB, MinIO, Mailpit, ClamAV).

Primary runtime boundaries:

- API/runtime boundary: `apps/client` ↔ `apps/main`.
- Data boundary: `apps/main` ↔ MongoDB and object storage services.
- Shared contract boundary: apps ↔ `packages/*` (types, DTOs, helpers).

### How the pieces fit

The frontend calls backend endpoints and websocket/chat features exposed by `apps/main`. The backend orchestrates domain services, persistence, and integrations, while shared packages provide common schemas, client types, and utilities used across applications. Supporting Docker services provide local persistence, media, email testing, and malware scanning.

### Starter issues

Start with issues labeled for newcomers:

- [good first issue](https://github.com/open-dpp/open-dpp/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)
- [help wanted](https://github.com/open-dpp/open-dpp/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22)
- [Issue tracker](https://github.com/open-dpp/open-dpp/issues)

## Development setup

### Prerequisites

- Node.js (LTS)
- `pnpm`
- Docker + Docker Compose
- `openssl`

### Install dependencies

```bash
pnpm install
```

### Configure environment

```bash
cp .env.dev.example .env.dev
```

Set required secrets and API keys in `.env.dev`. The `dev` and `test` scripts also load an optional `.env` file for local overrides; create an empty one with `touch .env` to silence a harmless "missing file" warning if you have no overrides.

### Generate the MongoDB keyfile

Local MongoDB runs as a single-node replica set (required for the multi-document transactions the backend uses), which needs a shared keyfile. This file is intentionally not committed, so generate it once before starting the infrastructure:

```bash
openssl rand -base64 756 > docker/mongo_keyfile
chmod 600 docker/mongo_keyfile
```

The `chmod 600` is required — MongoDB refuses to start if the keyfile is group- or world-readable.

### Build shared packages

The apps import the shared `packages/*` from their compiled `dist/` output, and `pnpm run dev` does not build the packages automatically. Build them once before the first run (and again after changing a package):

```bash
pnpm run build
```

### Start local infrastructure

```bash
pnpm exec make dev
```

This starts MongoDB, MinIO, Mailpit, and ClamAV via Docker Compose. Run it with `pnpm exec` so the local `dotenvx` CLI is found on your `PATH`; plain `make dev` only works if `dotenvx` is installed globally.

### Run the application

```bash
pnpm run dev
```

Useful URLs after startup:

- App: `http://localhost:3000`
- Mailpit: `http://localhost:8025` — open this to confirm your sign-up email and verify your account.

## Quality checks

Please run relevant checks before opening a pull request.

### Lint

```bash
pnpm run lint
```

### Build

```bash
pnpm run build
```

### Tests

Start test services first:

```bash
make test
```

Then run tests:

```bash
pnpm run test
```

You can also run scoped tests:

```bash
pnpm run test:main
pnpm run test:client
pnpm run test:e2e
```

## Releasing

For information on how releases and versioning work, see [RELEASING.md](./RELEASING.md).

## Pull request guidelines

When opening a PR, please:

1. Describe what changed and why.
2. Link related issues (for example, `Closes #123`).
3. Include testing notes (what you ran and the result).
4. Add screenshots or short recordings for UI changes.
5. Update documentation when behavior, configuration, or APIs change.

### PR checklist

- [ ] Changes are focused and scoped.
- [ ] Code follows existing project patterns and style.
- [ ] Relevant tests were added or updated.
- [ ] Lint/build/tests pass locally.
- [ ] Documentation was updated where needed.

## Documentation contributions

Documentation lives in the `docs/` directory.

For docs-only changes, you can open a PR directly. Keep content concise, clear, and consistent with existing style.

## Reporting bugs

Please open a GitHub issue and include:

- What you expected to happen
- What actually happened
- Steps to reproduce
- Relevant logs or screenshots
- Environment details (OS, Node version, browser if relevant)

## Suggesting features

Please open a GitHub issue with:

- The problem you want to solve
- Your proposed solution
- Any alternatives you considered
- Potential impact on users

## Security issues

Please do **not** report security vulnerabilities in public issues.

Use GitHub Security Advisories (private vulnerability reporting) for this repository, or contact the maintainers through the repository’s security contact channel if available.

## Community expectations

Be respectful and constructive in issues and pull requests.

We value collaboration, clear communication, and helpful reviews.
