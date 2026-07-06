# ADR 0001: Generate the GS1 AI table from ref.gs1.org

**Status:** Accepted (2026-07-06)

## Context

`packages/dto/src/unique-product-identifiers/gs1/gs1-ai-table.ts` was a one-shot vendoring of
the `aitable` array from [GS1DigitalLinkToolkit.js](https://github.com/gs1/GS1DigitalLinkToolkit.js)
(commit `facedb87`, Apache-2.0). No generator existed; the file was produced once and committed.
The toolkit's table lags GS1's living reference: 476 entries versus 541 currently published at
<https://ref.gs1.org/ai>, with stale regexes (e.g. dates as `\d{6}` instead of real month/day
validation) and missing DPP-relevant AIs (8013 GMN, 235 TPX, the 4300-series shipping AIs).

Sources evaluated:

| Source                              | License          | Versioning   | Long descriptions            | Regexes               | i18n                |
| ----------------------------------- | ---------------- | ------------ | ---------------------------- | --------------------- | ------------------- |
| GS1DigitalLinkToolkit.js `aitable`  | Apache-2.0       | commit pin   | yes                          | yes                   | no                  |
| `gs1/gs1-syntax-dictionary`         | Apache-2.0       | release tags | **no** (short codes: "GTIN") | **no** (linter specs) | no                  |
| ref.gs1.org/ai bulk JSON + page TSV | GS1 terms of use | **none**     | yes                          | yes                   | yes (13+ languages) |

The syntax dictionary was seriously considered for its license and pinnable releases, but it
cannot regenerate `gs1-ai-constants.ts` (constant names derive from long English descriptions)
and carries no translations — both hard requirements. Any source mix would still pull GS1's
description texts from ref.gs1.org, so the Apache-2.0 purity it offers is unobtainable for the
parts that matter.

## Decision

Generate all GS1 AI artifacts from **ref.gs1.org only**:

- **Table data** (541 AIs, formats, regexes, Digital-Link flags): `https://ref.gs1.org/ai/`
  with `Accept: application/json`.
- **Translations**: the tab-separated translation block embedded in the same page's HTML
  (GS1 maintains it from their translation spreadsheet; there is no separate endpoint).

Pipeline:

- Generator lives at the repo root: `scripts/gs1-generator/index.mts`
  (TypeScript, executed with the tsx root devDependency), invoked via `pnpm gen:gs1`.
- Only the generated TypeScript files are committed (no raw upstream snapshots):
  `gs1-ai-table.ts`, `gs1-ai-constants.ts`, `gs1-ai-i18n.ts`.
- Every generated file carries a provenance header: source URL, retrieval date (UTC),
  entry count, and the SHA-256 of the upstream payload it was derived from.
- **Drift handling is manual.** ref.gs1.org has no version identifiers, ETag, or
  Last-Modified. Regeneration happens when GS1 publishes a new General Specifications
  release (roughly yearly) or a data bug surfaces. No CI network access, no scheduled jobs.

License position, recorded with eyes open: ref.gs1.org content is published under GS1's
terms of use ("AS IS", GS1 IP policy) — not an open-source license. The vendored material is
factual standards data (identifier codes, formats, validation rules) that GS1 publishes at
these endpoints precisely so implementers can consume it; the provenance headers give
attribution (© GS1) and record retrieval date and hash. The previous Apache-2.0 provenance
claim is dropped.

## Consequences

- Table is current (541 AIs) and regenerable; freshness is one script run away.
- Reproducibility is date+hash based, not version-pin based — two runs on different days may
  differ. The committed file is the reviewed artifact; upstream changes surface as diffs.
- The TSV extraction reads an undocumented artifact embedded in an HTML page. It can break
  silently on a GS1 redesign; the generator fails loudly and a human fixes it at the next
  manual regen. Accepted as the cost of the only i18n source in existence.
- Behavioral data changes versus the toolkit snapshot are accepted wholesale — see
  [ADR 0002](./0002-gs1-ai-table-shape-and-derivation.md).
