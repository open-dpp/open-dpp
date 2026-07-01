# Media keys on passportId; no canonical/default internal UPI

[ADR 0005](./0005-user-creatable-internal-upis.md) made internal (`OPEN_DPP_UUID`) UPIs user-creatable while pinning a single auto-minted **canonical** row per passport, because that row was the load-bearing key for three things: media storage, AI chat, and the `getUniqueProductIdentifierOfPassport` endpoint. Presentation/preview never used it — the public page resolves through **permalinks** (`presentationConfigurationId → config.referenceId → passport`), and the canonical UPI uuid was additionally (and silently) acting as the **opaque public handle** for a passport's media.

We remove the canonical/default internal UPI entirely. **Media keys on `passportId`**, AI chat resolves the passport directly, and the unused `getUniqueProductIdentifierOfPassport` endpoint is dropped. The `OPEN_DPP_UUID` type **survives as a purely user-creatable identity record** — no auto-mint, no canonical, no read-only row; internal UPIs are freely deletable while the passport is a draft. Public media access is re-anchored to the **permalink**, so media inherits the permalink's lifecycle: deleting a permalink (or unpublishing the passport) revokes anonymous media access.

## Considered Options

- **Serve public media by `passportId` directly (anonymous)** — rejected: it leaks the internal `passportId` into public, anonymous media URLs and, more importantly, keeps media permanently readable regardless of permalink state. We want media access to die with the permalink.
- **Keep an opaque per-passport media handle** — rejected: that handle _is_ the canonical UPI; keeping it is renaming, not removing, and still grants permanent anonymous access.
- **Delete the `OPEN_DPP_UUID` type entirely** — rejected for this change: the user-creatable internal identity record from ADR 0005 is kept for future identity needs (e.g. EU-registry-style types). Only the auto-mint + canonical machinery is removed.
- **Delete the existing auto-minted rows during migration** — rejected: the migration is non-destructive. The rows remain as ordinary, user-deletable internal UPIs (each pre-existing passport shows one internal UPI it did not explicitly create).

## Media access model

`passportId` is the internal storage key; the permalink is the public handle.

- **Public read** — `GET /media/permalink/{permalinkIdOrSlug}/{dataFieldId}/{info,download}` (`@AllowAnonymous`): resolves the permalink → passport through the existing publish/ownership gate (`resolveToPassport`), then serves media by `(dataFieldId, passportId)`. A deleted permalink or an unpublished passport breaks resolution → access denied. _No explicit per-permalink "active" flag exists today; "deactivated" means deleted-or-unpublished. A soft toggle would be a small additive change._
- **Backoffice read/write** — `{GET,POST} /media/dpp/passport/{passportId}/{dataFieldId}/…` (authenticated, org-ownership-gated): drafts have no public permalink, so editing and preview use an authed `passportId` path.

## Consequences

- **Media re-key (DB-only migration, no S3 move).** Each media row stores its own `objectName` (`media.schema.ts`), so the S3 path is never recomputed on read. Migration adds `referenceId` to media rows and backfills it from `media.uniqueProductIdentifier → UPI.referenceId`. Old files keep their stored path; new uploads path under `product-passport-files/{passportId}/{dataFieldId}`. Lookup changes from `(dataFieldId, uniqueProductIdentifier)` to `(dataFieldId, referenceId)`.
- **The canonical machinery is removed** (amending ADR 0005): the oldest-wins `OPEN_DPP_UUID` branch of `findByReferenceIdAndType`, `isCanonicalInternal`, the `canonical` field on `UniqueProductIdentifierListItemDto`, and the canonical read-only delete-guard. Internal UPIs become freely deletable while draft; GTIN/EAN system rows stay read-only.
- **Auto-mint is removed** from passport create + import (`passport.createUniqueProductIdentifier()` is no longer called); the domain method may remain for tests/explicit use.
- **AI chat rewires to `passportId`** (`chat.gateway` / `chat.service` drop the canonical-UPI lookup).
- **`getUniqueProductIdentifierOfPassport` is deleted** (no callers in app, e2e, or client).
- **Existing data:** auto-minted rows are left in place (non-destructive). The `media.uniqueProductIdentifier` column is kept (nullable) for backfill traceability; new rows leave it null.
- **Migration order:** (1) add + backfill `media.referenceId`; (2) add the new media routes + switch lookup/upload to `passportId`; (3) stop auto-mint, rewire AI chat, drop `getUniqueProductIdentifierOfPassport`; (4) remove the canonical code. Steps 1–2 must precede any canonical-code removal.
