# Glossary — Identifiers & Permalinks

The ubiquitous language for unique product identifiers and the public resolve surface. These terms are routinely confused; this is the canonical disambiguation.

## Identity

**Unique Product Identifier (UPI)** — A record carrying _what a passport is_ externally. It references a passport (`referenceId`) and has an `ExternalIdentifierType`. It is **not** a URL — scannability is a permalink concern (see below).

**External Identifier Type** — The discriminator on a UPI (`packages/dto/src/gs1/external-identifier-type.ts`). Values: `OPEN_DPP_UUID`, `GS1`, `GTIN`, `EAN`.

**Internal UPI (`OPEN_DPP_UUID`)** — A UPI whose identity _is_ its own `uuid`; it carries no external data. **Purely user-created** ([ADR 0005](../adr/0005-user-creatable-internal-upis.md)), zero-or-many per passport, freely deletable while the passport is a draft. Not auto-minted and not on any resolve, media, or AI path.

**Canonical (internal) UPI** — _Removed._ [ADR 0005](../adr/0005-user-creatable-internal-upis.md) pinned a single auto-minted, read-only "canonical" internal UPI as the load-bearing key for media, AI chat, and `getUniqueProductIdentifierOfPassport`. [ADR 0006](../adr/0006-media-keyed-by-passport-no-canonical-upi.md) dissolved the concept: media keys on `passportId`, AI chat resolves the passport directly, the endpoint is gone, and the auto-mint is removed. No internal UPI is "special" anymore.

**GS1 UPI / GS1 identity** — A UPI of type `GS1` carrying a `Gs1Identity`: a GTIN (normalized to GTIN-14) plus optional batch (AI `10`) and serial (AI `21`). Many-per-passport; user-creatable and editable while the passport is a draft.

**GTIN / EAN types** — Read-only system rows; not creatable via the API.

**Granularity** — The level a GS1 identity's keys imply: `model` (bare GTIN), `batch` (GTIN + batch), `item` (GTIN + serial). `null` for non-GS1 UPIs.

## Resolve surface

**Permalink** — A _public, resolvable URL_ pointing at a passport. The scannable artifact (the QR target). A passport may have several. Two `kind`s:

- **Presentation permalink** — References a presentation configuration (`base/{slug|id}`). One per configuration (unique partial index on `presentationConfigurationId`).
- **GS1 Digital Link permalink** — A permalink whose URL is rendered in GS1 Digital Link shape (`base/01/{gtin}/10/{batch}/21/{serial}`). It references a GS1 UPI **only to format that URL** — resolution still reaches the passport via the permalink's presentation configuration, _not_ via the UPI. One per UPI. See [ADR 0001](../adr/0001-polymorphic-permalink.md).

**Primary permalink** — The presentation permalink a passport resolves through when several exist (ADR 0001). Governs resolution; not frozen on publish.

**Resolve / scan process** — Two public entry points, **neither of which consults an internal UPI**:

1. **Permalink** (`/p/{slug|id}`) → passport via `presentationConfigurationId → config.referenceId` (`resolveToPassport`). Identical for both permalink kinds; a GS1‑link's `uniqueProductIdentifierId` is never read to resolve.
2. **GS1 Digital Link** (`/01/{gtin}[/10/{batch}][/21/{serial}]`, mounted outside `/api`) → looks up the GS1 UPI by exact key (`findByGs1Key`) and 302‑redirects to that passport's permalink URL.

Internal UPIs are inert with respect to resolution — they are never scanned and never on either path.

## Media

**Media key** — A passport file's storage key is its **`passportId`** ([ADR 0006](../adr/0006-media-keyed-by-passport-no-canonical-upi.md)): S3 path `product-passport-files/{passportId}/{dataFieldId}`, DB lookup `(dataFieldId, referenceId)`. The stored `objectName` is the source of truth on read, so legacy files keep their old path. _(Before ADR 0006 the key was the canonical internal UPI uuid.)_

**Public media access** — Anonymous media reads go **through a permalink**: `GET /media/permalink/{permalinkIdOrSlug}/{dataFieldId}/…` resolves the permalink → passport (the same publish/ownership gate as the page), then serves by `passportId`. Deleting the permalink or unpublishing the passport revokes access — media inherits the permalink's lifecycle.

**Backoffice media access** — Authenticated, org-ownership-gated reads/writes keyed by `passportId` (`/media/dpp/passport/{passportId}/…`). Used while editing/previewing a draft, which has no public permalink yet.

## Lifecycle

**Draft-gate / publish-freeze** — A UPI's or permalink's identity may be created/edited/deleted only while the referenced passport is a **draft**; it freezes once the passport is published (409 otherwise).
