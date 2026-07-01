# GS1-UPI Test-Finishing Plan

**Status:** proposed
**Branch:** `gs1-upi`
**Decided via:** grilling session — GS1-UPI tests are being *finished* on this branch (not shelved), so the orphaned fixture factories added in `6f5c5311` are kept and wired up, not deleted.

## The actual gap (one sentence)

It is **not** missing test suites — every intended-consumer spec already exists and passes. The gap is that **all 9 GS1 / permalink / UPI fixture factories are imported by nothing except their own `*.factory.spec.ts` + the package barrel**, while **~15 real specs hand-inline the exact shapes those factories emit**. So this is overwhelmingly **refactor-to-adopt** (swap inline fixtures for factory builds), plus **one** genuine new-coverage item.

## Hard constraint — `packages/dto` specs stay inline (do NOT touch)

`@open-dpp/testing` **depends on** `@open-dpp/dto`. Adopting the testing factories inside `packages/dto/**` specs would invert that into a dependency cycle. Therefore every dto-layer spec that inlines a gs1/permalink/upi shape stays inline **by design** and produces **zero** work items:

- `packages/dto/src/gs1/gs1-data-attributes.dto.spec.ts`, `gs1-digital-link.spec.ts`
- `packages/dto/src/permalinks/permalink.dto.spec.ts`
- `packages/dto/src/unique-product-identifier/{create,update,list-item}-*.dto.spec.ts`

## Other guardrails

- **Behavior-preserving only.** A factory's default must equal the previously-inlined shape (`gs1DataAttributesPlainFactory` default is `{ "17": "251231" }`, which matches the dominant inline). Where a spec used a different shape, drive it via the transient `entries` / params override — never change what the spec asserts.
- **Invalid / malformed cases stay inline.** The factories only emit valid maps; `{ "9999": ... }` / `{ "99zz": ... }` 400-path fixtures keep their inline literals.
- **Each adopt is its own tiny, reviewable diff.** No behavior change ⇒ specs stay green at every step.

---

## Work items

### Phase 0 — Factory polish first (the deferred Group A factory items)

These factories are about to become the single source of truth across ~15 specs, so clean them **before** adoption, not after.

| id | action | target | notes |
|----|--------|--------|-------|
| P0.1 | polish | `permalink-request.factory.ts` | drop `Omit<PermalinkUpdateRequest, never>` no-op; stop hand-copying params per-field — let fishery merge |
| P0.2 | polish | `unique-product-identifier-{,create-request,update-request}.factory.ts` | remove `params.x !== undefined ? …` merge-reinvention; collapse duplicated `batch`/`serial` transient+params paths; hoist the shared GTIN literal (`"4006381333931"`) to one const |
| P0.3 | polish | `permalink-public.factory.ts` + `permalinks.factory.ts` | extract the shared gs1/presentation branch logic (differs only by the 5 public-only fields); collapse the triple-nested `transient ?? params ?? default` ternaries |
| P0.4 | polish | all `*.factory.ts` | trim the 10–20 line JSDoc blocks to one line each |

### Phase 1 — Adopt: api-client (cheapest, no DB)

| id | action | target spec | factory |
|----|--------|-------------|---------|
| 1.1 | adopt | `api-client/.../permalinks/permalinks.namespace.spec.ts` | `permalinkGs1LinkCreateRequestPlainFactory` (+ `permalinkUpdateRequestPlainFactory`) |
| 1.2 | adopt | `api-client/.../unique-product-identifiers/unique-product-identifiers.namespace.spec.ts` | `uniqueProductIdentifierCreateRequestPlainFactory` / `…UpdateRequest…` |

### Phase 2 — Adopt: backend (`apps/main`)

| id | action | target spec | factory |
|----|--------|-------------|---------|
| 2.1 | adopt | `permalink/domain/permalink.spec.ts` | `gs1DataAttributesPlainFactory` (bare map for `create`/`fromPlain`) |
| 2.2 | adopt | `permalink/infrastructure/permalink.repository.spec.ts` | `gs1DataAttributesPlainFactory.build({}, { transient: { entries: { "17":…, "3103":… } } })` |
| 2.3 | adopt | `permalink/application/services/permalink.application.service.spec.ts` | request factory + `gs1DataAttributesPlainFactory` (valid cases only; invalid-AI inline) |
| 2.4 | adopt | `permalink/presentation/permalink.controller.spec.ts` | `permalinkGs1LinkCreateRequestPlainFactory` / `…UpdateRequest…` (valid payloads; 400 cases inline) |
| 2.5 | adopt | `unique-product-identifier/**` specs (`upi-collection.service`, `unique-product-identifier.controller`, `unique.product.identifier.domain`, `repository`) | `uniqueProductIdentifierPlainFactory` / create-request / update-request |

### Phase 3 — Adopt: frontend (`apps/client`)

| id | action | target spec | factory |
|----|--------|-------------|---------|
| 3.1 | adopt | `components/permalinks/Gs1DataAttributesField.spec.ts` | `gs1DataAttributesPlainFactory` — **the single best direct consumer** (the component's `modelValue` *is* a `Gs1DataAttributes` map; default = line-118 emit, transient `entries` = line-236 props) |
| 3.2 | adopt | `components/permalinks/Gs1LinkQrCode.spec.ts`, `PermalinkEditDialog.spec.ts`, `PermalinkCreateGs1LinkDialog.spec.ts` | `permalinkPublicFactory` (gs1 data comes free) / request factory |
| 3.3 | adopt | `view/permalinks/PermalinkListView*.spec.ts`, `composables/permalink-preview.spec.ts` | `permalinkPublicFactory` / `permalinksFactory` |
| 3.4 | adopt | `components/unique-product-identifier/{UniqueProductIdentifierCreateDialog,Gs1DigitalLinkPromptDialog}.spec.ts`, `view/unique-product-identifiers/UniqueProductIdentifierListView.spec.ts` | upi factories |

### Phase 4 — The one genuine new-coverage item

| id | action | target | notes |
|----|--------|--------|-------|
| 4.1 | new | domain round-trip spec | `plain → fromPlain → toPlain` equality for `Permalink` (+ `UniqueProductIdentifier`) using the factories as the `plain` source — the only real coverage gap the research surfaced |

### Phase 5 — Verify

- `pnpm run test:api-client`, `pnpm run test:client`, targeted `apps/main` specs for every touched file, `packages/dto` unaffected.
- Confirm **zero** factory remains imported-only-by-its-own-spec (the original smell). Any that does after Phase 1–3 is a real delete candidate, not a keep — revisit it then.

## Suggested order

`P0.1–P0.4 → 1.1, 1.2 → 2.1–2.5 → 3.1–3.4 → 4.1 → Phase 5`

Phase 0 first (clean the source of truth), then adopt cheapest-layer-first so each step is a tiny green diff.

## Risks / open questions

- **R1:** a spec's inlined shape may differ subtly from the factory default (extra AI, different GTIN). Mitigation: use transient/params overrides; never edit assertions to match a factory.
- **R2:** frontend specs may rely on the *exact object identity* of an inlined fixture across assertions; adopt per-spec and run that spec immediately.
- **Q1:** Phase 4 — round-trip for both `Permalink` and `UniqueProductIdentifier`, or just whichever the research flagged? (Confirm scope before writing 4.1.)
