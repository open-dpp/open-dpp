# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

open-dpp is an open-source platform for managing Digital Product Passports (DPPs) based on the IEC 63278 Asset Administration Shell (AAS) standard. It is a **pnpm + Turborepo monorepo** with a NestJS backend, Vue 3 frontend, shared packages, and E2E tests.

## Commands

```bash
# Install
pnpm install

# Build
pnpm run build                # all apps + packages
pnpm run build:main           # backend only

# Dev (requires Docker services running first)
make dev                      # start Docker services (MongoDB, MinIO, Mailpit, ClamAV)
pnpm run dev                  # start all apps
pnpm run dev:main             # backend only

# Lint
pnpm run lint

# Test (requires: make test to start test Docker services)
pnpm run test                 # all tests
pnpm run test:main            # backend (Jest)
pnpm run test:client          # frontend (Vitest)
pnpm run test:e2e             # Playwright E2E

# Run a single backend test
cd apps/main && NODE_OPTIONS=--experimental-vm-modules pnpm exec jest path/to/file.spec.ts

# Run a single frontend test
cd apps/client && pnpm exec vitest run src/path/to/file.spec.ts
```

Environment is injected via `@dotenvx/dotenvx` from `.env.dev` + `.env`. Copy `.env.dev.example` to `.env.dev` and fill in secrets before running.

## Repository Structure

```
apps/main/           # NestJS backend (port 3000)
apps/client/         # Vue 3 + Vite frontend (port 5173, proxied through backend)
apps/e2e/            # Playwright E2E tests
packages/dto/        # Shared Zod schemas and TS types for all DTOs
packages/api-client/ # Typed axios-based API client
packages/env/        # Zod-validated env schema + NestJS EnvModule
packages/exception/  # ValueError, NotFoundError, NotSupportedError + NestJS filters
packages/permission/ # CASL-based permission helpers
packages/testing/    # Fishery factories for test data
```

## Architecture

### Tech Stack

- **Backend**: NestJS v11, Mongoose (MongoDB 7), Better Auth, LangChain + Mistral/Ollama
- **Frontend**: Vue 3, Pinia, PrimeVue, Tailwind CSS v4, Vite 7
- **Testing**: Jest + @swc/jest (backend), Vitest (frontend), Cypress (component), Playwright (E2E)
- **Validation**: Zod everywhere (DTOs, env vars, route params)

### Domain-Driven Design Module Structure

Every backend feature module in `apps/main/src/` follows this layout:

```
feature/
├── domain/            # Pure domain logic, no framework deps
│   └── entity.ts      # Private constructor + static create/fromPlain factories
├── application/
│   └── services/      # Use-case orchestration
├── infrastructure/
│   ├── entity.repository.ts   # Mongoose-backed repository
│   └── entity.schema.ts       # Mongoose @Schema
└── presentation/
    └── controller.ts  # NestJS @Controller
```

### Key Domain Patterns

- **Immutable entities**: Private constructors with `static create()` and `static fromPlain()` factory methods. `toPlain()` for serialization. Never mutate domain objects — create new instances.
- **Repository abstraction**: Generic helpers in `apps/main/src/lib/repositories.ts` (`save`, `findOne`, `findOneOrFail`, `findByIds`). Never call Mongoose models directly from services or controllers.
- **Environment vs ExpandedEnvironment**: `Environment` stores only IDs (refs to shells/submodels). `ExpandedEnvironment` is the fully hydrated version loaded from DB. `EnvironmentService` manages loading/persisting within MongoDB transactions.
- **Visitor pattern**: AAS submodel element trees use `IVisitor<ContextT, R>` (in `aas/domain/visitor.ts`). Implementations: `JsonVisitor`, `ModifierVisitor`, `ValueModifierVisitor`, `ValueVisitor`.
- **Submodel element registry**: Classes registered at startup via `aas/domain/submodel-base/submodel-registry.ts`, mapping `KeyTypesType` to classes with `fromPlain`.
- **AAS interface segregation**: Controllers implement `IAasReadEndpoints`, `IAasCreateEndpoints`, `IAasModifyEndpoints`, `IAasDeleteEndpoints` from `aas/presentation/aas.endpoints.ts`.
- **Schema versioning**: Mongoose documents carry `_schemaVersion` (e.g. `"1.0.0"`). All `save()` calls pass the version constant.
- **Error hierarchy**: Use `ValueError` for domain validation, `NotFoundError` for missing entities. Import from `@open-dpp/exception`.

### Testing Patterns

- **Backend integration tests** use `MongoMemoryReplSet` (real MongoDB with transaction support). `createAasTestContext()` in `aas/presentation/aas.test.context.ts` bootstraps the full module stack.
- **MongoDB connection in tests**: A single `MongoMemoryReplSet` is started in Jest global setup (`apps/main/test/global-setup.ts`) and shared via `process.env.OPEN_DPP_MONGODB_URI`. **NEVER** create connections directly with `mongoose.connect()` or `mongoose.createConnection()` in test files. Always use a NestJS `TestingModule` with `MongooseModule.forRootAsync` and `generateMongoConfig` — this gives each test suite an isolated database (random UUID name) and proper connection lifecycle via `module.close()`. See `apps/main/src/items/infrastructure/items.service.spec.ts` for the reference pattern.
- **Test factories**: Fishery factories in `packages/testing/src/fixtures/` generate valid plain objects matching Zod schemas.
- **Package imports in tests**: Jest resolves `@open-dpp/*` via `moduleNameMapper` to `packages/*/src`.
- **`ignoreIds()`**: Helper in `apps/main/test/utils.for.test.ts` replaces all `id` fields with `expect.any(String)` for assertions on objects with generated UUIDs.

### Auth & Multi-tenancy

- Better Auth handles sessions (stored in MongoDB). `AuthGuard` validates session or service tokens.
- `@AuthSession()` extracts typed `Session`. `@AllowAnonymous()` / `@OptionalAuth()` opt out.
- All resources belong to an `organizationId`. Ownership checked via `MembersService`.
- `PolicyGuard` enforces resource quota caps per organization.

### Cursor-based Pagination

Use `Pagination.create({ limit, cursor })` and `PagingResult`. Cursors are base64url-encoded JSON `{ createdAt, id }`.
