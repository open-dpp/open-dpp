# Internal (open-dpp) UPIs are user-creatable, with a pinned canonical row

The add-UPI surface was GS1-only even though the domain's `ExternalIdentifierType` already models an `OPEN_DPP_UUID` ("internal") type. We make internal UPIs **user-creatable and many-per-passport** so the management surface (list + add dialog) is **type-aware** — GS1 and internal now, with room for EU-registry-style types later.

Internal UPIs are **not on any public resolve path** — permalinks reach a passport via their presentation configuration, and the GS1 Digital Link resolver keys off the GS1 key; neither consults an internal UPI (see [glossary → Resolve / scan process](../reference/glossary.md)). The only consumers of an internal UPI are two backoffice/AI lookups: `getUniqueProductIdentifierOfPassport` and `chat.gateway`. Both call `findByReferenceIdAndType(referenceId, OPEN_DPP_UUID)`, which was **newest-wins** — so a hand-minted internal UPI would silently repoint them. We pin the **canonical** internal UPI to the **auto-minted, oldest row** per passport (selection changes from _newest-wins_ to _oldest-wins_). User-minted internal UPIs are always newer, never canonical, carry no external identity data, are draft-gated and deletable; the canonical row stays read-only and undeletable.

## Considered Options

- **A new non-canonical internal type distinct from `OPEN_DPP_UUID`** — rejected: it invents a second vocabulary for the same "UUID _is_ the identity" concept. The existing type fits once canonical selection is made deterministic.
- **Keep newest-wins and add a `canonical: boolean` flag** — rejected for this branch: a schema field plus backfill to express what _oldest-by-`createdAt`_ already gives deterministically (the auto-mint always precedes any user mint). Revisit only if a passport ever needs to _re-designate_ its canonical row.
- **Leave internal read-only / display-only (GS1 the only creatable type)** — rejected: it does not meet the goal of managing internal identities. It remains the safe lower bound if the inertness in the consequences below proves unacceptable.
- **Make internal UPIs scannable (own permalink) in this slice** — deferred: that changes the resolve surface, which this branch explicitly keeps frozen. It is an _addition_ to relations, not a _change_, and can land later without revisiting this ADR.

## Consequences

- The canonical lookup `findByReferenceIdAndType(referenceId, OPEN_DPP_UUID)` selects the **oldest** matching row (was newest). Its only consumers are the backoffice `getUniqueProductIdentifierOfPassport` (`passport.controller.ts:214`) and AI chat (`chat.gateway.ts:50`) — **not** the public resolve surface. Because the auto-minted row precedes any user mint, every passport keeps the same canonical internal UPI, so both lookups are unchanged. The public scan/resolve surface is unaffected by construction (it never reads internal UPIs).
- The "system row is read-only" guard (create/update/delete → 409, `upi-collection.service.ts`) narrows from _"`type === OPEN_DPP_UUID`"_ to _"the canonical row."_ Non-canonical internal UPIs are deletable while the passport is a draft; the canonical row is never deletable.
- Internal UPIs carry no external identity data (the identity is the `uuid`), so they are **create + delete only** — there is no update path. `PATCH` stays GS1-only.
- The create endpoint / DTO **branches on type**: GS1 takes `gtin` + optional `batch`/`serial`; internal takes no identity payload and mints a `uuid`.
- **No data migration.** No unique index blocks multiple `gtin = null` rows (the only unique UPI index is the GS1 `(gtin, batch, serial)` partial index). The change is selection-order + guard logic + the create branch.
- A non-canonical internal UPI has **no permalink and is not scannable** on this branch — it is an inert identity/list record until permalink wiring is added. Accepted as the cost of keeping the resolve surface frozen.
