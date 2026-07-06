# GS1 Glossary

Terms used across the GS1 modules in `packages/dto/src/unique-product-identifiers/gs1/` and
the decision records in [`docs/decisions/`](../decisions/0001-gs1-ai-table-generated-from-ref-gs1-org.md).

**Application Identifier (AI)** — A 2-4 digit numeric prefix defined by the GS1 General
Specifications that says what the data following it means (`01` = GTIN, `10` = batch/lot,
`17` = expiration date). The full registry lives at <https://ref.gs1.org/ai> and is vendored
into `gs1-ai-table.ts` (541 entries).

**GS1 General Specifications (GenSpecs)** — GS1's master standard defining all AIs, their
formats, and usage rules. Updated roughly yearly; a new release is the trigger for manually
regenerating our vendored table.

**GS1 Digital Link** — Web-URI syntax for GS1 identification, e.g.
`https://resolver.example/01/04006381333931/10/LOT-42/21/SN-007`. Built by
`buildGs1DigitalLink()`; path order is key → qualifiers, data attributes go in the query
string.

**Primary identifier / key AI (`type: "I"`)** — An AI that can start a Digital Link path
(GTIN `01`, SSCC `00`, GMN `8013`, …). Derived from `gs1DigitalLinkPrimaryKey` upstream.

**Key qualifier (`type: "Q"`)** — An AI that refines a key inside the Digital Link path
(batch `10`, serial `21`, CPV `22`, TPX `235`). Upstream models qualifier _hierarchies_ as
nested alternative sets (GTIN: `[["22","10","21"],["235"]]`); our table keeps the first set
flattened in `qualifiers`.

**Data attribute (`type: "D"`)** — A non-key AI carried in the Digital Link query string
(expiry `17`, net weight `3103`). `Gs1DataAttributesSchema` accepts exactly these AIs and
validates each value against the table regex.

**Element-string-only AI (`type: "N"`)** — An AI that GS1 permits in barcodes/element
strings but not anywhere in a Digital Link (`03`, `7041`, `8014`, `8200`). Our addition to
the type union; see ADR 0002.

**Element string** — The human-readable barcode rendering with parenthesised AIs:
`(01) 04006381333931 (10) LOT-42`. Produced by `formatGs1ElementString()`.

**GTIN / GTIN-14** — Global Trade Item Number, the product-level key (AI `01`). Accepted at
8/12/13/14 digits, mod-10 check-digit validated, stored zero-padded to 14 digits
(`normalizeToGtin14`).

**GMN** — Global Model Number (AI `8013`), the model-level key — relevant for model-scoped
Digital Product Passports. A Digital Link primary key since the current GenSpecs (was
misclassified as a data attribute in the old vendored table).

**Check digit** — Trailing mod-10 digit of numeric GS1 keys, weights 3,1,3,1,… from the
right (`isValidGtinCheckDigit`). Not expressible in the table regexes; validated in code.

**CSET-82** — GS1's 82-character set for alphanumeric AI values (batch, serial): digits,
letters, and 20 punctuation characters. Enforced by `Cset82ComponentSchema`, max 20 chars.

**Fixed length / FNC1 (`fixedLength`)** — Whether an AI's value has a predefined length in
barcodes. Variable-length AIs need an FNC1 separator when concatenated. Derived as
`!separatorRequired` from upstream.

**Decimal-place family (`390n`)** — AI groups whose fourth digit `n` encodes the number of
decimal places (`3100`-`3105` = net weight with 0-5 decimals). The table lists every member
individually; GS1's translation data collapses them to one `n`-suffixed key, which
`getGs1AiDescription()` resolves.

**Provenance header** — The comment block atop each generated file recording source URL,
retrieval date, entry count, and SHA-256 of the upstream payload. The substitute for version
pinning, since ref.gs1.org publishes no versions (ADR 0001).
