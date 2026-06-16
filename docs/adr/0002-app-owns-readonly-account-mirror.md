---
status: accepted
---

# Credentials are verified against an app-owned, read-only mirror of better-auth's Account collection

## Context

Sensitive self-service changes (today: an Email Change) must re-confirm the User by their current password. The password lives in better-auth's `account` collection, and better-auth's programmatic ways to reach it are both _internal_, not part of its stable public API: `$context.internalAdapter` (account/user lookups) and `$context.password.checkPassword(userId, ctx)`. The latter would do the lookup for us but needs a synthesized better-auth _endpoint context_ to carry the password, which is a deeper and more fragile coupling than the problem warrants. The app already mirrors better-auth's `user`, `session`, and `account` collections with its own Mongoose schemas — guarded by `better-auth-schema-sync.spec` — but the `account` mirror was modelled and never used.

## Decision

Verify credentials through an app-owned, **read-only** mirror of the `account` collection. A dedicated `identity/accounts` module owns the `Account` schema, domain entity, and an `AccountsRepository` whose only job is to read the `credential` Account for a User. `AccountsService.verifyPassword(userId, plaintext): boolean` reads that Account and compares the hash using better-auth's one pure primitive, `password.verify({ hash, password })`. Sensitive flows depend on that boolean; they do not touch better-auth internals. Better-auth remains the **sole writer** of the `account` collection — the repository exposes no writes.

## Consequences

- The only better-auth-internal surface left in a password check is the pure `password.verify` primitive. The account _read_ goes through the app's own repository, consistent with every other repository, and the password hash never leaves the accounts module.
- The `account` collection is now co-owned for **reads**, so the app is coupled to its persisted shape. better-auth stores `_id`/`userId` as `ObjectId` (verified empirically; the previously-unused schema wrongly typed them as `string`). Drift — a renamed field, or `userId` changing type — is caught by `better-auth-schema-sync.spec`, now extended to assert the `userId` ObjectId type the repository relies on.
- Read-only is a **discipline, not a DB constraint**: writing the `account` collection from the app would bypass better-auth's credential invariants, so the repository deliberately offers no `save`/`update`/`delete`.
- Rejected: `internalAdapter.findUserByEmail(..., { includeAccounts })` + reconciling `found.user.id === userId` (the prior approach) — correct, but couples each caller to an internal API and reads oddly, looking a User up by email only to re-check the id it was already given. Rejected: `password.checkPassword(userId, ctx)` — removes our lookup but requires faking better-auth's endpoint context, trading a small, explicit coupling for a larger hidden one.
