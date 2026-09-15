---
"@open-dpp/dto": major
"@open-dpp/api-client": major
"@open-dpp/main": minor
"@open-dpp/client": minor
---

Organization slugs are an internal detail equal to the organization id, so organization names no longer need to be unique.

- `POST /organizations` accepts `{ name }` only and validates it (non-empty after trimming). A `slug` in the body is ignored; `logo` and `metadata` are no longer part of the create type (they were never forwarded).
- `OrganizationDto` is now a zod schema in `@open-dpp/dto` (re-exported by `@open-dpp/api-client`): `slug` is removed, the never-sent `updatedAt` is gone, and `createdAt` is an ISO string instead of `Date`.
- Organization responses no longer include the always-empty `members` array.
- Existing organizations are backfilled to `slug = id` on every startup.
- The raw better-auth routes `/organization/update` and `/organization/check-slug` return 403, like `/organization/create` already did.
