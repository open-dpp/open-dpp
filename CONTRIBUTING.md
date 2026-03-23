# Contributing to open-dpp

Thank you for your interest in contributing to open-dpp.

We welcome contributions of all sizes, including bug fixes, documentation improvements, tests, refactorings, and new features.

## Before you start

- For larger changes, open an issue first to discuss scope and approach.
- For small fixes (typos, docs improvements, minor bug fixes), you can usually open a PR directly.
- Keep pull requests focused. Smaller, well-scoped PRs are easier to review and merge.

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
