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
- `docker/`, `docker-compose*.yml` — local infrastructure setup (MongoDB, RustFS, Mailpit).

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

Set required secrets and API keys in `.env.dev`.

### Start local infrastructure

```bash
make dev
```

### Run the application

```bash
pnpm run dev
```

Useful URLs after startup:

- App: `http://localhost:3000`
- Mailpit: `http://localhost:8025`

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

Start the services first:

```bash
make dev
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

## Changesets

Every pull request that changes a workspace package must add a changeset — a small Markdown file under `.changeset/` that describes the change for the next release. The `@open-dpp/*` packages are version-locked, so the repository releases as one unit: a change that ships without a changeset never appears in a version bump or a `CHANGELOG.md`.

A dedicated `changeset` CI job enforces this on every pull request against `main`.

### When a changeset is required

Required when the PR touches files inside a workspace package:

- `apps/main/`, `apps/client/`
- `packages/*`
- `docs/`

Not required when the PR touches only files outside those directories — root configuration, `.github/`, `Dockerfile`, `Makefile`, `README.md`, or this file — or only `apps/e2e/`, which is excluded from releases via `ignore` in [`.changeset/config.json`](./.changeset/config.json).

If you are unsure, run the same check CI runs:

```bash
pnpm changeset status --since=origin/main
```

### Adding a changeset

```bash
pnpm changeset
```

Select `@open-dpp/api-client` (the `fixed` group bumps every other `@open-dpp/*` package along with it), pick `patch` / `minor` / `major`, and write a summary aimed at the people reading the changelog. Commit the generated `.changeset/*.md` file with your code.

See [RELEASING.md](./RELEASING.md#adding-a-changeset-to-your-pr-contributor-flow) for the full contributor flow.

### Changes that need no release note

Refactors, test-only changes, and internal cleanups still touch a workspace package, but have nothing to tell users. Declare that explicitly with an empty changeset:

```bash
pnpm changeset --empty
```

This writes a `.changeset/*.md` file with no packages in it. The CI job accepts it, `changeset version` consumes it without bumping anything, and the PR carries a visible record that the omission was deliberate rather than forgotten.

### Exemptions

The CI job skips two kinds of pull request that cannot carry a changeset of their own:

- The `chore: version packages` PR from the `changeset-release/main` branch, which consumes changesets instead of adding them.
- Dependency updates from `renovate[bot]`, or any PR labelled `dependencies`.

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
- [ ] A changeset was added (`pnpm changeset`, or `pnpm changeset --empty`), if the PR changes a workspace package.

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
