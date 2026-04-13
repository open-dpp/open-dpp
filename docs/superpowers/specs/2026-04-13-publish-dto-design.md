# Design: Publish @open-dpp/dto to npm

**Date:** 2026-04-13
**Branch:** 401-add-unified-version-bump-script
**Status:** Approved

## Problem

`@open-dpp/api-client` is published to npm and depends on `@open-dpp/dto` via `workspace:*`. When Changesets publishes `@open-dpp/api-client`, pnpm replaces the `workspace:*` reference with the resolved version number (e.g. `^0.2.0`). A consumer installing `@open-dpp/api-client` from npm would then try to install `@open-dpp/dto` from npm — but `@open-dpp/dto` is currently `private: true` and not published, causing the install to fail.

## Decision

Publish `@open-dpp/dto` as a standalone public package on npm, versioned in lock-step with `@open-dpp/api-client` via the existing `fixed` group in `.changeset/config.json`.

## Approach

Minimal — no new build targets, no structural changes. Two edits to `packages/dto/package.json`:

1. Remove `"private": true`
2. Add `"publishConfig": {"access": "public"}`

This mirrors exactly what `@open-dpp/api-client` already does. The rest of the pipeline requires no changes:

- **Versioning**: The `fixed: [["@open-dpp/*"]]` group in `.changeset/config.json` already bumps `@open-dpp/dto` alongside every other package.
- **Building**: `pnpm release` runs `pnpm build` (Turbo) before `changeset publish`, so the `dist/` output is always fresh.
- **Publishing**: `changeset publish` skips packages with `"private": true`. Removing that flag is the only gate to clear.
- **Exports / files**: The existing `exports`, `files: ["dist", "src"]`, and `tsconfig.build.json` are already correct for a published package — same pattern as `api-client`.

## Files Changed

| File | Change |
|------|--------|
| `packages/dto/package.json` | Remove `"private": true`; add `"publishConfig": {"access": "public"}` |
| `RELEASING.md` | Update overview, contributor flow, and verification steps to reflect two published packages |

## RELEASING.md Updates

Three locations need updating:

1. **Overview paragraph** — currently says "Only `@open-dpp/api-client` is actually published". Change to: both `@open-dpp/dto` and `@open-dpp/api-client` are published; all other packages remain `private: true`.

2. **Contributor flow — step 1** — currently says "select `@open-dpp/api-client`". Update to note that selecting either published package triggers the `fixed` group bump; `@open-dpp/api-client` remains the conventional choice.

3. **Verify the release — step 5** — add a check for `npmjs.com/package/@open-dpp/dto` alongside the existing `@open-dpp/api-client` check.

## What This Does Not Change

- No new build configuration or second build target for `dto`
- No ESM output added to `dto` (deferred; CJS-only is sufficient for current consumers)
- No changes to the release workflow (`.github/workflows/release.yml`)
- No changes to the changeset config
- No version bump in this PR — the first release after this lands will publish `@open-dpp/dto` at whatever version the `fixed` group produces
