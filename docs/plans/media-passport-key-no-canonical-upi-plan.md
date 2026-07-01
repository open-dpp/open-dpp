# Plan — Media keyed by passportId; remove the canonical/default internal UPI

Implements [ADR 0006](../adr/0006-media-keyed-by-passport-no-canonical-upi.md) (amends [ADR 0005](../adr/0005-user-creatable-internal-upis.md)).

## Goal

Remove the auto-minted, read-only **canonical** `OPEN_DPP_UUID` UPI that every passport mints today. Re-key passport media on `passportId`; serve public media **through a permalink** (access dies with the permalink) and backoffice media through an authed `passportId` route. Keep `OPEN_DPP_UUID` as a purely user-creatable identity record (ADR 0005 create path stays; canonical machinery goes).

## Locked decisions

- **Media key = `passportId`.** S3 `product-passport-files/{passportId}/{dataFieldId}`; DB lookup `(dataFieldId, referenceId)`. No S3 move (each row stores `objectName`, the read-time source of truth).
- **Public media via permalink** — anonymous `GET /media/permalink/{permalinkIdOrSlug}/{dataFieldId}/{info,download}` → `resolveToPassport` (publish/ownership gate) → serve by `passportId`. Deleting the permalink / unpublishing revokes access. No soft "active" flag (deactivated = deleted-or-unpublished).
- **Backoffice media via authed `passportId`** — `{GET,POST} /media/dpp/passport/{passportId}/{dataFieldId}/…`, org-ownership-gated (drafts have no permalink).
- **Internal UPI** — user-creatable, zero-or-many, freely deletable while draft. No auto-mint, no canonical, no read-only row. GTIN/EAN stay read-only.
- **Existing auto-minted rows left in place** (non-destructive) as ordinary deletable internal UPIs.
- **AI chat** resolves `passportId` directly. **`getUniqueProductIdentifierOfPassport`** deleted (no callers).

## Migration ordering (must hold)

Steps 1–2 ship and the backfill runs **before** any canonical-code removal (steps 4–5). The existing canonical rows stay, so the `media.uniqueProductIdentifier → UPI.referenceId` mapping survives for backfill/idempotency.

---

## Phase 1 — Media re-key (additive, no behavior removed yet)

Files: `apps/main/src/media/infrastructure/media.schema.ts`, `media.service.ts`, `apps/main/src/media/presentation/media.controller.ts`.

1. **Schema:** add nullable `referenceId: string | null` to `MediaDbSchema`. Keep `uniqueProductIdentifier` (nullable) for backfill traceability. Add index `{ dataFieldId: 1, referenceId: 1 }`.
2. **Service:** parametrize `uploadFileOfProductPassport` / `getFilestreamOfProductPassport` / `findOneDppFileOrFail` on `passportId` (referenceId). New uploads: `objectName` path = `[PRODUCT_PASSPORT_FILES, passportId]`; store `referenceId`. Lookup by `(dataFieldId, referenceId)`.
   - _Tests:_ upload→store under passportId path + referenceId set; retrieval by `(dataFieldId, passportId)`; single-file-per-field enforced by `(dataFieldId, referenceId)`.
3. **Backfill** (`media` infra, one-shot service or migration): for every media doc with `uniqueProductIdentifier != null && referenceId == null`, look up the UPI, set `referenceId = upi.referenceId`. Idempotent; log counts.
   - _Test:_ legacy doc (uniqueProductIdentifier only) → after backfill has correct referenceId; retrieval by passportId then works against the stored (old) objectName.

## Phase 2 — New media routes

Files: `media.controller.ts`, `permalink.application.service.ts` (reuse `resolveToPassport`), api-client media namespace.

4. **Backoffice routes** (authed + org-ownership, mirror the existing ownership checks):
   - `POST /media/dpp/passport/:passportId/:dataFieldId`
   - `GET /media/dpp/passport/:passportId/:dataFieldId/{info,download}`
5. **Public route** (`@AllowAnonymous`):
   - `GET /media/permalink/:permalinkIdOrSlug/:dataFieldId/{info,download}` → `resolveToPassport(idOrSlug)` (404 on unknown/deleted permalink; not-published-and-not-member → denied) → `findOneDppFile(dataFieldId, passport.id)` → stream.
   - _Tests:_ published passport + valid permalink → 200; deleted permalink → 404; unpublished passport, anonymous → denied; cross-permalink of same passport still serves (per-permalink gate).
6. **api-client:** add `uploadDppMedia(passportId, …)`, `getMediaInfoByPassport`, `downloadByPassport`, and `getMediaInfoByPermalink` / `downloadByPermalink`. Keep old methods until the frontend cutover (Phase 6), then remove.

## Phase 3 — AI chat + endpoint cleanup

Files: `apps/main/src/ai/presentation/chat.gateway.ts`, `apps/main/src/ai/chat.service.ts`, `apps/main/src/passports/presentation/passport.controller.ts`, `packages/api-client/src/dpp/passport/passports.namespace.ts`.

7. `chat.gateway` already resolves the passport from the permalink — pass `passport.id` to `chatService.askAgent` instead of fetching the canonical UPI uuid. `chat.service` takes `passportId` and loads the passport directly (drop `findOneOrFail(upiUuid)`).
   - _Tests:_ chat resolves context from passportId; no UPI lookup.
8. Delete `getUniqueProductIdentifierOfPassport` (`passport.controller.ts:199-220`) + its OpenAPI path + the api-client method. Grep-confirm zero callers first.

## Phase 4 — Stop auto-mint

Files: `apps/main/src/passports/presentation/passport.controller.ts` (createPassport ~306, importPassport ~956), `apps/main/src/passports/domain/passport.ts`.

9. Remove the `passport.createUniqueProductIdentifier()` save from create + import. Keep the domain method (used by tests / explicit creation) or delete if fully unused after test updates.
   - _Tests:_ creating a passport yields **zero** UPIs; media upload works without any UPI present.

## Phase 5 — Remove canonical machinery (amends ADR 0005)

Files: `unique-product-identifier.repository.ts`, `upi-collection.service.ts`, `packages/dto/.../unique-product-identifier-list-item.dto.ts`, `packages/testing/.../unique-product-identifier.factory.ts`, `apps/client/.../UniqueProductIdentifierListView.vue`.

10. `findByReferenceIdAndType`: remove the `OPEN_DPP_UUID` oldest-wins special-case + legacy-null tolerance **iff** no caller remains (after Phase 3 the canonical consumers are gone; `gs1-identity.service` uses `GS1`). If the method becomes GS1-only, simplify it; otherwise delete.
11. `upi-collection.service`: delete `isCanonicalInternal`; drop `canonical` from `get` / `listByPassport` / `createInternal`; the `delete` guard becomes "GS1 or internal → deletable while draft; GTIN/EAN → 409" (no canonical branch).
12. `UniqueProductIdentifierListItemDto`: remove the `canonical` field. Update the testing factory (drop `canonical`).
13. Frontend `UniqueProductIdentifierListView.vue`: delete-gating no longer reads `canonical` — all internal + GS1 rows deletable while draft; remove the "system read-only" label path.
14. Update/remove the ADR 0005 canonical tests (repository oldest-wins regression, service canonical delete-guard, the `canonical`-flag list test, the controller/dto canonical assertions).

## Phase 6 — Frontend media cutover

Files: `apps/client/src/stores/media.ts`, `composables/media-file.ts`, `composables/aas-gallery.ts`, `components/media/*` (`FileField`, `MediaFieldView`, `MediaPreview`, `MediaInput`, galleria), public presentation page.

15. Backoffice components pass `passportId` (already in scope via route/passport store) to the media store instead of the canonical UPI uuid.
16. Public presentation page builds media URLs from the **resolved permalink** (idOrSlug) it already has, hitting `/media/permalink/…`.
17. Remove the old `:upi` media routes + old api-client methods once nothing references them.

## Phase 7 — Docs & verification

18. OpenAPI: add the new media paths, remove `getUniqueProductIdentifierOfPassport` + old `:upi` media paths.
19. Full suites green: `test:main`, `test:client`, `test:api-client`, dto + testing packages; client `vue-tsc`; `lint`.
20. **Security review** on the new anonymous `/media/permalink/...` route (authz parity: it must apply the same publish/ownership gate as the public page; confirm no path-traversal via `dataFieldId`; confirm a draft's media is never anonymously reachable).

---

## Risks / open points

- **Production migration:** media is a core released feature, so real media is keyed by the canonical UPI uuid — the `referenceId` backfill is mandatory and must precede canonical-code removal. Rows stay in place, so the mapping persists.
- **Backoffice-vs-public split** is an interpretation lock (public = permalink-gated, backoffice = authed-passportId). Revisit if _all_ access should be permalink-gated (would break draft editing).
- **"Deactivated permalink"** = deleted-or-unpublished today. A soft per-permalink active toggle is a separate additive change if wanted.
- **`media.uniqueProductIdentifier` column** is kept nullable (not dropped) for traceability; new rows leave it null.

## Phase 6 — FINAL approach (Design C: permalink-gated read, membership via the File value)

**Supersedes Design B below.** Media is **many-to-many** with passports (the same mediaId can be a File `value` in many passports), so a per-media `referenceId` is the wrong shape. Decisions (from the owner):

- **No `referenceId` field, no denormalization.** The File element's `value` (mediaId) is the only passport↔media link. → revert the Phase-1 `referenceId` column + every Design-B usage, and **delete the media backfill** (nothing to backfill).
- **Public file media reads go through a permalink-scoped route, gated exactly like other passport data:** `resolveToPassport(idOrSlug)` (the existing publish/ownership gate) → serve the `mediaId` **only if it is among that passport's File-element values** (read-time membership, computed from the passport's submodels; cache per passport). Deactivate/unpublish the permalink → 404, like all passport data. This prevents using one passport's permalink to pull an unrelated mediaId.
- **`/media/:id` stays public for now** — the **branding logo stays public** through it, and the backoffice keeps using it. Adding auth to `/media/:id` (branding exempt) is a **future** change, out of scope. → **revert the step-2 harden**.
- **Backoffice/upload unchanged** — file fields upload via general `/media/upload`; no passport-scoped upload/read route needed.

### Work

1. [x] **Revert** referenceId everywhere: `media.schema` field + index, `media.ts` domain, `uploadMedia` param + `uploadMediaForPassport` + `getPassportMediaById*`, the `/media/:id` harden; **deleted** `media-backfill.service(.spec)` + module wiring + `PassportMediaController` + spec + the api-client `*Passport*` methods.
2. [x] **Membership-gated permalink read** (`MediaPermalinkController`): `GET /media/permalink/:idOrSlug/by-id/:mediaId/{info,download}` → resolveToPassport → `passportReferencesMedia(passport, mediaId)` (collects the passport's File-element values via `SubmodelRepository.findByIds` + a recursive File collector) → serve via `getFilestreamById`. Keeps `setSafeMediaHeaders`.
3. [x] **Frontend:** public page's File rendering (`presentation/SubmodelElementValue` → `MediaFieldView`) routes through `fetchPermalinkMedia` (permalink from `route.params.permalink`); backoffice editor/activity-history + branding unchanged. Removed the store's dead dpp wrappers (`uploadDppMedia`/`getDppMediaInfo`/`downloadDppMedia`/`fetchDppMedia`) + the api-client dpp methods.
4. [x] Tests + security review (membership/IDOR) — green; gate verified at `resolveToPassport` (unpublished/anonymous → 404) + `passportReferencesMedia` (cross-passport IDOR → 404). **OpenAPI skipped:** the whole media domain — including the existing public `/media/:id/*` routes — is absent from the curated `zod-openapi` doc; documenting only these two would be inconsistent. Future: a single "document the public media surface" pass.

### Phase 7 closeout (adversarial workflow: suites + OpenAPI audit + 4-lens security review)

- [x] **#19 remaining suites:** `@open-dpp/dto` 293✓, `@open-dpp/testing` 87✓ (no `test:dto`/`test:testing` root scripts; ran via turbo package filter).
- [x] **#18 OpenAPI staleness:** clean — no doc path references any deleted route (`getUniqueProductIdentifierOfPassport`, `/media/dpp`, `:upi`, canonical auto-mint); every documented path maps to a live controller.
- [x] **#20 security:** 4 lenses (IDOR / draft-exposure / header-XSS / authz-parity), 16 findings — gate confirmed sound (no cross-passport IDOR, draft/deactivated → 404, nosniff+allowlist defeats MIME-XSS). Two genuine **LOW** issues found in _both_ the new permalink handlers and the pre-existing bare `/media/:id` handlers, fixed at the root in `media-response.util.ts`:
  - **`streamMedia`** — finalizes the response on a mid-stream S3 error after headers are sent (`res.destroy(err)`), closing the socket/FD-leak. Replaces the duplicated pipe+error blocks in both download handlers.
  - **`toPublicMediaInfo`** — anonymous `/info` now returns only the `MediaInfoDto` shape (`id,title,mimeType,size`); the raw `Media` domain object no longer leaks `bucket`/`objectName`/`eTag`/`versionId`/`ownedByOrganizationId`/`createdByUserId`. Applied to both the permalink and bare `/info` routes.
  - **Refuted (1):** "element-granular gate bypass" — moot, since the media bytes are unconditionally public via the bare `/media/:id` route anyway (auth on it is the accepted future change).

---

## Phase 6 — SUPERSEDED (Design B: per-media referenceId)

**Discovery (Phase 6 mapping):** the frontend's passport media is **media-id-based**, not dpp-keyed. A File submodel element's `value` IS a standalone `mediaId` (uploaded via general `POST /media/upload`, no passport link), rendered via anonymous `GET /media/:id/download`. The `/media/dpp/:upi/...` routes have **zero consumers** (no frontend, e2e, OpenAPI, or backend-internal). So the canonical-UPI removal never threatened frontend media, and the Phase-2 `dataFieldId`-keyed routes have no consumer. The real security gap: a `mediaId` is a permanent, ungated anonymous handle.

**Decision (Design B):** keep the File `value` as the `mediaId`; **link each file-field media to its passport** (`media.referenceId = passportId`); route public reads through the permalink and refuse anonymous by-id access to passport-linked media. Migration is a DB backfill (no passport-data rewrite).

### Backend

1. **Passport-linked upload (backoffice):** `POST /media/passport/:passportId` (authed + ownership) → general-style upload that sets `referenceId = passportId`; returns `{ mediaId }`. (The File value stays the mediaId.)
2. **Backoffice read (authed + ownership):** `GET /media/passport/:passportId/by-id/:mediaId/{info,download}` — verify `media.referenceId === passportId`.
3. **Public read (anonymous, permalink-gated):** `GET /media/permalink/:idOrSlug/by-id/:mediaId/{info,download}` — `resolveToPassport(idOrSlug)` → verify `media.referenceId === passport.id` → serve. Deleted permalink / unpublished passport → 404.
4. **Harden `GET /media/:id/{info,download}`** (anonymous): return 404 when `media.referenceId` is set — passport-linked media is never reachable by bare id. Non-passport media (branding logo, org library) is unaffected.
5. **Rework Phase-2 controllers** from `dataFieldId`-keyed to by-id (`MediaPermalinkController` → by-id-via-permalink; `PassportMediaController` → authed by-id). Service gains by-id-with-referenceId-check methods; the `dataFieldId`-keyed methods/routes are removed (no consumer).
6. **Backfill migration:** scan every passport's submodel **File** elements → their `value` (mediaId) → set that media's `referenceId = passportId`. (`media-backfill.service` extended; cross-collection: passports/AAS → media.)

### Frontend

7. **File-field upload (backoffice):** `MediaModal`/`FileField` upload via `/media/passport/:passportId` (the editor has `passportId`). Org-library uploads stay on general `/media/upload`.
8. **Media context:** thread a "media source" to the shared render components (`useMediaFile`, `MediaFieldView`, `MediaPreview`): backoffice → `passportId`; public → permalink `idOrSlug`. The composable picks the right route (`…/media/passport/:id/by-id/:mediaId` vs `…/media/permalink/:idOrSlug/by-id/:mediaId`).
9. **Branding logo + org media library** keep using `/media/:id` (non-passport media, `referenceId` null).

### Verify

10. OpenAPI for the new routes; full green suites; **security review** of the anonymous `/media/permalink/.../by-id/...` route + the `/media/:id` refusal (no IDOR: a mediaId of passport A must not resolve under passport B's permalink).

## Checklist

- [x] Phase 1 — media schema + service re-key + backfill (additive)
- [x] Phase 2 — new backoffice + permalink media routes + api-client
- [x] Phase 3 — AI chat → passportId; delete `getUniqueProductIdentifierOfPassport`
- [x] Phase 4 — stop auto-mint (create + import)
- [x] Phase 5 — remove canonical machinery (repo/service/dto/factory/frontend/tests)
- [x] Phase 6 (Design C) — no referenceId; membership-gated permalink read (`MediaPermalinkController`); public File rendering routed through the permalink; `/media/:id` + branding stay public; dead dpp wrappers removed
- [x] Phase 7 — full green suites + security review (membership/IDOR). OpenAPI deliberately skipped (media domain is undocumented; see Design C Work #4)
- [x] Phase 8 — `/media/:id` authentication lockdown (was the accepted residual; pulled into scope)

## Phase 8 — `/media/:id` authentication lockdown (pulled into scope)

Closes the residual from Phase 6: anonymous `GET /media/:id/{download,info}` could still serve any passport-file media to anyone who knew the (UUID) mediaId — so unpublishing a passport didn't revoke byte access.

**Backend**

- `GET /media/:id/{download,info}` → **authenticated** (`@AllowAnonymous` removed; global `AuthGuard` default-denies anonymous). Backoffice (authenticated) unchanged.
- New public, **ownership-gated** org logo route `GET /branding/logo/:mediaId` (`BrandingController`): serves a media only if it is the **effective** branding logo of the media's _owning_ org (`isOrganizationLogo` resolves via `findOneByOrganizationId`, covering the legacy `organization.logo` fallback) **and** the media is an image. `BrandingModule → MediaModule` (cycle-free direction; `Media→Branding` cycles via `Aas`). Documented in `branding.path.ts`.

**Frontend** (completing Design C — `MediaPreview` had been re-fetching by bare id):

- `MediaPreview` takes an optional `objectUrl`; when provided it renders that and never bare-fetches. `MediaFieldView` passes the permalink-resolved `fileUrl` down → the public page is now 100% permalink-gated (and the redundant double-fetch is gone).
- Branding logo fetch rerouted to `apiClient.dpp.branding.downloadLogo` (`/branding/logo/:id`).

**Adversarial security review (workflow):** 3 lenses + refutation; suites green (1203 backend / 121 api-client / 391 client / tsc / lint).

- ✅ anonymous arbitrary-media-by-id path fully closed; the only anonymous media bytes are a passport's own File media via its permalink, and an org's own (image) branding logo.
- 🔧 **Fixed (regression I introduced):** legacy `org.logo`-only orgs 404'd on their logo because the gate checked only `BrandingDoc` — now resolved via the effective-logo source. Regression test added.
- 🔧 **Fixed (LOW):** an org could expose its own private _non-image_ passport file as a "logo" — the image-type guard blocks it.
- 🔧 **Fixed (pre-existing MEDIUM, cross-org IDOR):** the bare `/media/:id/{download,info}` **and `DELETE /media/:id`** are now scoped — `MediaController` checks `MembersService.isMemberOfOrganization(session.userId, media.ownedByOrganizationId)` (authz derived from the MEDIA's owning org, not the active-org header — per the cross-tenant IDOR memory). Non-members get 404. Consumer map first confirmed every legitimate reader is a member of the media's org (all backoffice; invitations render no media; no avatar/admin/marketplace cross-org reads), so no flow breaks. `MediaModule → OrganizationsModule` (cycle-free). Unit tests cover member/non-member on all three routes; full backend suite green.
  - A follow-up adversarial review (security-reviewer agent) found one **LOW existence oracle**: not-found (`NotFoundInDatabaseException`) vs not-member (`NotFoundException`) returned distinguishable 404 bodies, enabling mediaId enumeration. **Fixed** — `loadMediaForMember` collapses both into the same `NotFoundException` (uniform 404); test added.
