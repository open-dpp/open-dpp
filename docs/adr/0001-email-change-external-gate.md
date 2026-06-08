---
status: accepted
---

# Email changes are gated by an external Email Change Request, not better-auth alone

## Context

better-auth's change-email verification token is a stateless JWT. Once issued it cannot be invalidated server-side, so better-auth alone cannot guarantee that a *revoked* email change won't complete if the (still-valid) verification link is later clicked. We need a revoke that is a real guarantee, not best-effort, and we need a "pending email change" state to show the user.

## Decision

We keep an external **Email Change Request** record (one per user) and gate better-auth's `user.email` update in `databaseHooks.user.update.before` on its existence: the change completes only while an authorizing request exists. **Revoke** = deleting the request, which turns a subsequent click of the verification link into a no-op. The same record backs the "pending email change" UI state and the completion notification.

## Consequences

- The gate resolves the user from the **signed verification token** and looks the request up by `userId` (via the request repository), so there is **no** global-unique `newEmail` constraint and **no** cross-user address reservation. Real address uniqueness is still enforced at completion by the `user.email` unique constraint.
- The request carries a **TTL aligned to better-auth's `emailVerification.expiresIn`** (one shared constant) so the two lifetimes cannot drift.
- The **only** coupling to better-auth's token format is the `before` hook (covered by integration tests that drive the real `changeEmail → verifyEmail` path). `previousEmail` is persisted on the request so the `after` hook does not re-parse the token. The gate's collection access lives in **one shared helper**, not scattered raw queries.
- Rejected alternative: better-auth's native change-email flow alone. Simpler, but "cancel" could not actually prevent completion within the token's validity window.
