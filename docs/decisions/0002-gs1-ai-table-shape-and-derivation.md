# ADR 0002: GS1 AI table keeps its entry shape; ref.gs1.org fields are derived into it

**Status:** Accepted (2026-07-06)

## Context

ref.gs1.org publishes a different model than the vendored `Gs1AiTableEntry`. It has no single
`type` field — instead `gs1DigitalLinkPrimaryKey`, nested `gs1DigitalLinkQualifiers`
(alternative qualifier hierarchies, e.g. GTIN: `[["22","10","21"],["235"]]`), and
`validAsDataAttribute`, which overlap (AI `01` is both a primary key and valid as a data
attribute). Its `title` is a short code ("GTIN"); the long name lives in `description`.
`formatString` includes the AI prefix (`N2+N14`). `shortcode` (Digital Link convenience
alphas, deprecated since DL 1.2) and positional `checkDigit` codes do not exist upstream —
and have **zero consumers** in this repo.

Current consumers read only `type` and `regex` (`gs1-digital-link.ts`,
`Gs1DataAttributesSchema`) plus `type` + `title` (the `gs1-ai-constants.ts` generator).

## Decision

Keep the existing `Gs1AiTableEntry` shape and derive it from ref.gs1.org data:

| Field                     | Derivation                                                                                                                                                                       |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ai`                      | `applicationIdentifier`                                                                                                                                                          |
| `title`                   | `description` (long English name)                                                                                                                                                |
| `format`                  | `formatString` minus its leading AI-prefix component (`N2+N14` → `N14`)                                                                                                          |
| `type`                    | precedence **I > Q > D > N**: `I` if `gs1DigitalLinkPrimaryKey`; else `Q` if the AI appears in any AI's `gs1DigitalLinkQualifiers`; else `D` if `validAsDataAttribute`; else `N` |
| `fixedLength`             | `!separatorRequired`                                                                                                                                                             |
| `regex`                   | `regex` (verbatim, anchored fragment)                                                                                                                                            |
| `qualifiers`              | first `gs1DigitalLinkQualifiers` set, flattened (compat with previous flat list)                                                                                                 |
| `shortcode`, `checkDigit` | **deleted** — gone upstream, zero consumers                                                                                                                                      |

`type` gains a fourth value **`"N"`** (element-string-only: not usable in a GS1 Digital
Link) for the 4 AIs that are neither primary key, qualifier, nor data attribute
(`03`, `7041`, `8014`, `8200`). The table stays complete at 541 entries; existing consumers
compare against `"D"`/`"I"`/`"Q"` and are unaffected.

`gs1-ai-constants.ts` is regenerated with the same naming rule (verified to reproduce all
476 existing names exactly): trim → strip parentheticals → uppercase → collapse
non-alphanumerics to `_` → strip edge `_`; same-name collisions within a kind get a `_<AI>`
suffix.

### Accepted behavioral changes (toolkit snapshot → ref.gs1.org, measured)

- **+65 AIs, 0 removed** (03, 235, 3950-55, 417, 4300-4333, 7011, 7040/41, 715-717,
  7240-7259, 8013-related, 8030, 8040-8043, …).
- **117 D-type regexes stricter** — dates validate real month/day: `999999` for AI 17
  (expiry) is now rejected; `Gs1DataAttributesSchema` and `buildGs1DataAttributeQuery`
  reject/throw where they previously accepted.
- **Type flips:** 8013 GMN `D→I`, 8020 `D→Q`, 8200 `D→N`.
- **~29 constant renames** (02, 37, 254, 400, 416, 7030-7039, 7230-7239, 8017, 8018, 8026, 8112) plus 59 new `Gs1DataAttributeAi` members. Verified: no code outside
  `gs1-ai-constants.ts` on any `split/*` branch references a renamed member; core members
  (GTIN, batch, serial, SSCC, expiry) are name-stable.

No override/pinning layer: GS1's current data is taken wholesale. This is safe **now**
because the consuming permalink feature (split/2+) is unmerged and no production data
exists; the same change after GA would need a data migration review.

## Consequences

- Zero churn in `gs1-digital-link.ts` and DTO consumers; split/2+ branches only need
  rebase-time fixes to test literals that pin old table contents (known drill).
- Validation is materially more correct (real date checks, current AI set, GMN usable as a
  Digital Link primary key for model-level passports).
- An exhaustive `switch` over `type` would need an `"N"` arm — none exist today.
