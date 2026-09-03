# ASVS 5.0 & OWASP LLM Top 10 source material

Research ticket [#779](https://github.com/open-dpp/open-dpp/issues/779), part of map [#772](https://github.com/open-dpp/open-dpp/issues/772).
Researched 2026-09-03 against primary sources only (OWASP GitHub repositories and release
assets, owasp.org / genai.owasp.org project pages, creativecommons.org legal code and FAQ).
All counts below were computed from the official ASVS 5.0.0 export files; the commands are
reproducible from the URLs in § Findings 3.

## Question

To seed the Control Register: what is the authoritative chapter list of OWASP ASVS 5.0, how many
requirements are Level 2 per chapter, and which official machine-readable exports (CSV/JSON/XLSX)
exist? What does the CC BY-SA 4.0 licence require if requirement text is embedded in this repo
(attribution, share-alike vs. our licence)? Which OWASP Web Security Testing Guide sections serve
as the verification method per chapter? And what is the current OWASP Top 10 for LLM Applications
list (2025) with its official source?

## Short answer

- **ASVS 5.0.0** (released 2025-05-30, current stable; next planned release is a *patch* 5.0.1) has
  **17 chapters, 80 sections, 345 requirements: 70 L1, 183 L2, 92 L3**. In 5.0 every requirement
  carries exactly one level number `L` = the *lowest* level at which it is required; **L2 compliance
  means all L1 + L2 requirements = 253 (73 %)**. The per-chapter table is in § Findings 1.
- **Official exports**: CSV, JSON (nested + flat), XML, CycloneDX JSON, DOCX, PDF, plus `legacy.*`
  variants with 4.x-style tick-mark level columns. **No XLSX is published.** The CSV/JSON have the
  seven columns `chapter_id, chapter_name, section_id, section_name, req_id, req_description, L`.
  Pin the `v5.0.0_release` tag URL (§ Findings 3) — the `latest` release re-uses the *same 5.0.0 file
  names* for bleeding-edge content.
- **WSTG**: the stable version is **v4.2 (2020-12-03), 97 test cases in 12 categories**; there is
  **no official ASVS 5.0 ↔ WSTG mapping** (ASVS 5.0 deliberately dropped all external mappings in
  favour of the future OWASP CRE). § Findings 5 gives an editorial chapter → WSTG-ID mapping and
  names the gaps (V9 tokens, V10 OAuth, V16 logging, V17 WebRTC have no stable-WSTG tests; the
  development `latest` branch adds JWT/OAuth/MFA tests).
- **LLM Top 10**: the *2025* edition (2024-11-18, `LLM01:2025` … `LLM10:2025`) is the one the map
  names and the one whose text is on GitHub. **A 2026 edition was published 2026-08-04** (PDF only
  so far) with a re-ranked list and one renamed entry (System Prompt Leakage → Hidden Context
  Exposure). Ticket #789 must decide which edition to pin (§ Open questions).
- **Licence**: ASVS, WSTG and the LLM Top 10 are all **CC BY-SA 4.0**; open-dpp's `LICENSE` is
  **AGPL-3.0**. AGPL is *not* a "BY-SA Compatible License" (only Free Art 1.3 and GPLv3 one-way
  are), so ASVS-derived *Adapted Material* cannot be relicensed under AGPL. Embedding requirement
  text **verbatim** in a register with our own columns is a *collection*, which CC explicitly allows
  under any collection licence as long as the embedded text stays BY-SA and is attributed. The clean
  path is a directory-level notice: `security-review/` documentation under CC BY-SA 4.0, code stays
  AGPL. **This is a licensing decision for the maintainers**, not something the research can settle
  (§ Findings 7, § Open questions).

## Findings

### 1. ASVS 5.0.0 chapter inventory

Computed from `OWASP_Application_Security_Verification_Standard_5.0.0_en.flat.json` (release asset,
sha256 `8201b20e…2311`); cross-checked against the nested JSON (345 requirements, `{1: 70, 2: 183,
3: 92}`) and the CSV (345 data rows). The official text confirms the totals: "In 5.0.0 there are 70
L1 requirements out of a total of 345 requirements, representing 20%" ([0x05-For-Users-Of-4.0.md][for-users-of-4]).

| Chapter | Title | Sections | Total | L1 | L2 | L3 | Required for L2 (L1+L2) |
|---|---|---:|---:|---:|---:|---:|---:|
| V1 | Encoding and Sanitization | 5 | 30 | 8 | 19 | 3 | 27 |
| V2 | Validation and Business Logic | 4 | 13 | 4 | 7 | 2 | 11 |
| V3 | Web Frontend Security | 7 | 31 | 8 | 11 | 12 | 19 |
| V4 | API and Web Service | 4 | 16 | 2 | 8 | 6 | 10 |
| V5 | File Handling | 4 | 13 | 4 | 5 | 4 | 9 |
| V6 | Authentication | 8 | 47 | 13 | 22 | 12 | 35 |
| V7 | Session Management | 6 | 19 | 6 | 12 | 1 | 18 |
| V8 | Authorization | 4 | 13 | 4 | 3 | 6 | 7 |
| V9 | Self-contained Tokens | 2 | 7 | 4 | 3 | 0 | 7 |
| V10 | OAuth and OIDC | 7 | 36 | 5 | 24 | 7 | 29 |
| V11 | Cryptography | 7 | 24 | 3 | 11 | 10 | 14 |
| V12 | Secure Communication | 3 | 12 | 3 | 6 | 3 | 9 |
| V13 | Configuration | 4 | 21 | 1 | 12 | 8 | 13 |
| V14 | Data Protection | 3 | 13 | 2 | 7 | 4 | 9 |
| V15 | Secure Coding and Architecture | 4 | 21 | 3 | 10 | 8 | 13 |
| V16 | Security Logging and Error Handling | 5 | 17 | 0 | 16 | 1 | 16 |
| V17 | WebRTC | 3 | 12 | 0 | 7 | 5 | 7 |
| **Σ** | **17 chapters** | **80** | **345** | **70** | **183** | **92** | **253** |

Percentages: L1 20.3 %, L2 53.0 %, L3 26.7 %, cumulative L2 73.3 % — matching the standard's own
"around 20 % … around 50 % … around 70 %" ([0x03-What-is-the-ASVS.md][using-asvs]).

Sections per chapter (from the nested JSON; the "Documentation" section is always first where it
exists and pairs with implementation requirements — [0x03][using-asvs] § Documented security decisions):

- **V1** 1.1 Encoding and Sanitization Architecture (2) · 1.2 Injection Prevention (10) · 1.3 Sanitization (12) · 1.4 Memory, String, and Unmanaged Code (3) · 1.5 Safe Deserialization (3)
- **V2** 2.1 Validation and Business Logic Documentation (3) · 2.2 Input Validation (3) · 2.3 Business Logic Security (5) · 2.4 Anti-automation (2)
- **V3** 3.1 Web Frontend Security Documentation (1) · 3.2 Unintended Content Interpretation (3) · 3.3 Cookie Setup (5) · 3.4 Browser Security Mechanism Headers (8) · 3.5 Browser Origin Separation (8) · 3.6 External Resource Integrity (1) · 3.7 Other Browser Security Considerations (5)
- **V4** 4.1 Generic Web Service Security (5) · 4.2 HTTP Message Structure Validation (5) · 4.3 GraphQL (2) · 4.4 WebSocket (4)
- **V5** 5.1 File Handling Documentation (1) · 5.2 File Upload and Content (6) · 5.3 File Storage (3) · 5.4 File Download (3)
- **V6** 6.1 Authentication Documentation (3) · 6.2 Password Security (12) · 6.3 General Authentication Security (8) · 6.4 Authentication Factor Lifecycle and Recovery (6) · 6.5 General Multi-factor authentication requirements (8) · 6.6 Out-of-Band authentication mechanisms (4) · 6.7 Cryptographic authentication mechanism (2) · 6.8 Authentication with an Identity Provider (4)
- **V7** 7.1 Session Management Documentation (3) · 7.2 Fundamental Session Management Security (4) · 7.3 Session Timeout (2) · 7.4 Session Termination (5) · 7.5 Defenses Against Session Abuse (3) · 7.6 Federated Re-authentication (2)
- **V8** 8.1 Authorization Documentation (4) · 8.2 General Authorization Design (4) · 8.3 Operation Level Authorization (3) · 8.4 Other Authorization Considerations (2)
- **V9** 9.1 Token source and integrity (3) · 9.2 Token content (4)
- **V10** 10.1 Generic OAuth and OIDC Security (2) · 10.2 OAuth Client (3) · 10.3 OAuth Resource Server (5) · 10.4 OAuth Authorization Server (16) · 10.5 OIDC Client (5) · 10.6 OpenID Provider (2) · 10.7 Consent Management (3)
- **V11** 11.1 Cryptographic Inventory and Documentation (4) · 11.2 Secure Cryptography Implementation (5) · 11.3 Encryption Algorithms (5) · 11.4 Hashing and Hash-based Functions (4) · 11.5 Random Values (2) · 11.6 Public Key Cryptography (2) · 11.7 In-Use Data Cryptography (2)
- **V12** 12.1 General TLS Security Guidance (5) · 12.2 HTTPS Communication with External Facing Services (2) · 12.3 General Service to Service Communication Security (5)
- **V13** 13.1 Configuration Documentation (4) · 13.2 Backend Communication Configuration (6) · 13.3 Secret Management (4) · 13.4 Unintended Information Leakage (7)
- **V14** 14.1 Data Protection Documentation (2) · 14.2 General Data Protection (8) · 14.3 Client-side Data Protection (3)
- **V15** 15.1 Secure Coding and Architecture Documentation (5) · 15.2 Security Architecture and Dependencies (5) · 15.3 Defensive Coding (7) · 15.4 Safe Concurrency (4)
- **V16** 16.1 Security Logging Documentation (1) · 16.2 General Logging (5) · 16.3 Security Events (4) · 16.4 Log Protection (3) · 16.5 Error Handling (4)
- **V17** 17.1 TURN Server (2) · 17.2 Media (8) · 17.3 Signaling (2)

Chapter source files (tag `v5.0.0_release`): `5.0/en/0x10-V1-Encoding-and-Sanitization.md` …
`5.0/en/0x26-V17-WebRTC.md` ([folder listing][en-folder]).

### 2. What L1 / L2 / L3 mean in 5.0

Source: [0x03-What-is-the-ASVS.md][using-asvs] § Application Security Verification Levels, and
[0x05-For-Users-Of-4.0.md][for-users-of-4] § Rethinking Level Definitions.

- Levels are **priority-based**, decided "primarily based on risk reduction and also keeping in mind
  the effort to implement" — *not* on black-box testability as in 4.x, and no longer prescriptive
  ("organizations are encouraged to achieve the level that they feel like they should be achieving").
- **Each requirement has one level number**; "Each ASVS level indicates the security requirements that
  are required to achieve from that level, with the higher remaining level requirements as
  recommendations." So L2 = every requirement with `L ∈ {1, 2}`.
- **L1** — "minimum requirements … critical or basic, first-layer of defense requirements for
  preventing common attacks that do not require other vulnerabilities or preconditions". ~20 %.
- **L2** — "Most applications should be striving to achieve this level … less common attacks or more
  complicated protections against common attacks". ~50 % of requirements; ~70 % cumulative.
- **L3** — "the goal for applications looking to demonstrate the highest levels of security …
  defense-in-depth mechanisms or other useful but hard-to-implement controls". Final ~30 %.
- Formats: "5.x uses a simple number on all formats … For backwards compatibility, legacy versions of
  the CSV, JSON and XML outputs which still use tick marks are also generated."
- **Referencing**: use `v5.0.0-<chapter>.<section>.<requirement>` (lower-case `v`), e.g.
  `v5.0.0-1.2.5`, because identifiers change between versions ([0x03][using-asvs] § How to Reference).
- **Release strategy**: Major = renumbering (4.0.3 → 5.0.0, re-evaluation needed); Minor = add/remove
  requirements, numbering stable; Patch = requirements only removed/relaxed, "an application that
  complied with the previous release will comply with the patch release as well". The README states
  "The next release target will be a patch release, version 5.0.1" ([README][asvs-readme]).
- **Verification stance** ([0x04-Assessment_and_Certification.md][assessment]): OWASP certifies
  nobody; a report "should include scope, a summary of all requirements checked, the requirements
  where exceptions were noted", non-applicable requirements "must be noted in the report";
  "testable using automation != running an off the shelf tool"; documentation- or source-led hybrid
  testing is "strongly encouraged". This is the shape of the Review Run report template (#783).
- **Forking/tailoring is explicitly encouraged**: "each organization should create its own tailored
  ASVS, omitting irrelevant sections (e.g., GraphQL, WebSockets, SOAP, if unused)" while keeping
  identifier traceability ([0x03][using-asvs] § Forking the ASVS). The Control Register is such a fork.

### 3. Official machine-readable exports — exact locations

Release: [OWASP Application Security Verification Standard 5.0.0][release-5.0.0], tag
`v5.0.0_release`, published 2025-05-30T09:35:31Z. Eleven assets; download URL pattern
`https://github.com/OWASP/ASVS/releases/download/v5.0.0_release/OWASP_Application_Security_Verification_Standard_5.0.0_en.<ext>`:

| Asset (`…_5.0.0_en.` +) | Size | Shape |
|---|---:|---|
| `csv` | 105 446 B | 345 rows + header; columns `chapter_id,chapter_name,section_id,section_name,req_id,req_description,L`; **CRLF** line endings; sha256 `6124dba176dc563f66363a11ae0c47f9b86b8a4a84c66a793670bd196ed86cd5` |
| `flat.json` | 162 870 B | `{"requirements":[{chapter_id, chapter_name, section_id, section_name, req_id, req_description, L}]}` — same seven fields as the CSV, `L` is a string; sha256 `8201b20eec2908c3380ac600c91c8ba746346fbb808859366abb232027532311` |
| `json` | 149 407 B | nested: `{Name, ShortName, Version:"5.0.0", Description, Requirements:[{Shortcode:"V1", Ordinal, ShortName:"Encoding", Name, Items:[{Shortcode:"V1.1", Ordinal, Name, Items:[{Shortcode:"V1.1.1", Ordinal, Description, L}]}]}]}`; sha256 `bcdbec214d70abcfad9284a31d4f9e5134305831d628aad3aa85d7e26626cb35` |
| `xml` | 128 708 B | same nested model as XML |
| `cdx.json` | 151 621 B | CycloneDX "standards" BOM |
| `legacy.csv` / `legacy.json` / `flat.legacy.json` / `legacy.xml` | 108–272 KB | 4.x-style tick-mark level columns (L1/L2/L3 booleans) |
| `docx` / `pdf` | 216 KB / 516 KB | human-readable |

Notes:

- **No XLSX exists** in any 5.0.0 location (release assets, `5.0/docs_en/`, `5.0/`). Read the
  ticket's "CSV/JSON/XLSX" as CSV/JSON/XML.
- The same files live in the frozen branch `v5.0.0` at
  `https://raw.githubusercontent.com/OWASP/ASVS/v5.0.0/5.0/docs_en/<file>` (the URLs the
  [README][asvs-readme] and the [owasp.org project page][owasp-asvs] link to); cell-for-cell
  identical to the release asset, only the line endings differ (branch = LF).
- **Trap**: the GitHub release tagged `latest` ("Bleeding Edge", re-published 2026-07-28) ships assets
  under the *identical* names `…_5.0.0_en.csv` etc. Today its CSV is byte-identical to the release
  (same sha256), but it tracks `master` and will diverge — never seed from `releases/latest`.
- Generated by `5.0/tools/export.py` / `asvs.py` from the Markdown chapters ([tools][tools]).
  Translations at 5.0.0: `en tr ru fr ko pt` (`5.0/languages.txt`); **no German**.

### 4. From 4.0.3 to 5.0.0 — changelog and mapping files

Source: [0x05-For-Users-Of-4.0.md][for-users-of-4] and [5.0/mappings/README.md][mappings-readme].

- "Of the 286 requirements in version 4.0.3, only 11 remain unchanged, while 15 have undergone minor
  grammatical adjustments … In total 109 requirements (38%) are no longer separate requirements in
  version 5.0 with 50 simply being deleted, 28 removed as duplicates and 31 merged." Even unchanged
  requirements have new identifiers.
- New chapters: OAuth and OIDC (V10), WebRTC (V17); split out: Self-contained Tokens (V9), Web
  Frontend Security (V3), Secure Coding and Architecture (V15). Former V1 Architecture removed;
  input validation moved next to business logic (V2).
- **Direct mappings to CWE and NIST SP 800-63 were removed** ("The aim is to prepare a mapping with the
  OWASP Common Requirement Enumeration (CRE) project"). Just-in-case exports of the pre-removal
  mappings: `5.0/mappings/nist.md` and `5.0/mappings/v5.0.be_cwe_mapping.json` (keyed by the
  intermediate `v5.0.be` ids, not by final 5.0.0 ids).
- Mapping files (YAML, `v4.0.3-<id>: {tag-v5.0.0: "MOVED TO v5.0.0-13.1.1" | "DELETED, NOT IN SCOPE" |
  "DELETED, MERGED TO …" | …}`):
  `mapping_v4.0.3_to_v5.0.0.yml`, `mapping_v5.0.0_to_v4.0.3.yml`, plus `v5.0.be` intermediates —
  all in [`5.0/mappings/`][mappings-folder]. Useful only if a TÜViT scheme or a customer still
  references 4.0.3 ids (#773).
- Level distribution shift: "in v4.0.3 there were 128 L1 requirements out of a total of 278
  requirements, representing 46%. In 5.0.0 there are 70 L1 requirements out of a total of 345
  requirements, representing 20%." (The 286 vs 278 discrepancy is in the source text itself.)

### 5. WSTG as the verification method per chapter

**Stable version**: WSTG **v4.2**, released 2020-12-03 ([release v4.2][wstg-release]), published at
`https://owasp.org/www-project-web-security-testing-guide/v42/` and aliased as
`…/stable/`. The repo README says "We are currently working on release version 5.0" and that the
`master`/`latest` content is the development version ([WSTG README][wstg-readme]). WSTG asks that
reports cite `WSTG-<version>-<category>-<number>`, e.g. `WSTG-v42-INFO-02`, and link versioned URLs
(`…/v42/4-Web_Application_Security_Testing/…`) rather than `stable`/`latest`.

**v4.2 inventory** (from [`checklist/Testing_Checklist.md` at tag v4.2][wstg-checklist-42]; 97 test IDs):
WSTG-INFO 10 · WSTG-CONF 11 · WSTG-IDNT 5 · WSTG-ATHN 10 · WSTG-ATHZ 4 · WSTG-SESS 9 · WSTG-INPV 19 ·
WSTG-ERRH 2 · WSTG-CRYP 4 · WSTG-BUSL 9 · WSTG-CLNT 13 · WSTG-APIT 1.
The development checklist ([`checklists/checklist.md` on master][wstg-checklist-latest], 109 IDs)
adds, among others: CONF-12 Content Security Policy, CONF-14 Other HTTP Security Header
Misconfigurations, **ATHN-11 Multi-Factor Authentication**, **ATHZ-05 OAuth Weaknesses**,
**SESS-10 JSON Web Tokens**, SESS-11 Concurrent Sessions, INPV-20 Mass Assignment, CLNT-14 Reverse
Tabnabbing, APIT-02 API Broken Object Level Authorization. A JSON form exists
(`checklists/checklist.json`: `{categories: {<name>: {id, tests: [{name, id, reference, objectives}]}}}`)
and an Excel `WSTG-Checklist_v4.2.xlsx`.

**No official ASVS 5.0 ↔ WSTG mapping exists.** ASVS 5.0 removed all external mappings
(§ 4); the WSTG repo mentions ASVS only in prose (6 code-search hits, no mapping table); the ASVS
text positions WSTG as the answer to "how do I test this requirement" ([0x03][using-asvs] § Standard).
The table below is therefore **editorial** (this research), pinned to v4.2 IDs, with `latest`-only
IDs marked †:

| ASVS chapter | WSTG v4.2 tests that verify it | Gaps / notes |
|---|---|---|
| V1 Encoding and Sanitization | INPV-01/02 XSS, INPV-05 SQLi, INPV-06 LDAP, INPV-07 XML, INPV-09 XPath, INPV-11 Code injection (LFI/RFI), INPV-12 Command injection, INPV-15 HTTP splitting, INPV-17 Host header, INPV-18 SSTI; CLNT-01 DOM XSS, CLNT-03 HTML injection, CLNT-05 CSS injection | 1.5 Safe Deserialization has no WSTG test → code review |
| V2 Validation and Business Logic | BUSL-01 data validation, BUSL-02 forge requests, BUSL-03 integrity checks, BUSL-05 function-use limits, BUSL-06 workflow circumvention, BUSL-07 misuse defenses; INPV-03 verb tampering, INPV-04 parameter pollution | INPV-20 Mass Assignment † |
| V3 Web Frontend Security | SESS-02 cookie attributes, SESS-05 CSRF, CONF-07 HSTS, CLNT-04 client-side redirect, CLNT-06 resource manipulation, CLNT-07 CORS, CLNT-09 clickjacking, CLNT-11 web messaging, CLNT-12 browser storage, CLNT-13 XSSI | CONF-12 CSP †, CONF-14 other headers †, CLNT-14 tabnabbing †; header checks are ZAP-baseline automatable |
| V4 API and Web Service | APIT-01 GraphQL, CLNT-10 WebSockets, CONF-06 HTTP methods, INPV-03, INPV-15 request smuggling, INPV-16 incoming requests, INPV-19 SSRF | APIT-02 BOLA † (also V8) |
| V5 File Handling | BUSL-08 unexpected file types, BUSL-09 malicious files, ATHZ-01 directory traversal / file include, CONF-03 file-extension handling, CONF-04 backup/unreferenced files, CONF-09 file permission, CONF-11 cloud storage | ClamAV/MinIO specifics need bespoke tests |
| V6 Authentication | ATHN-01…10 (credentials over TLS, default creds, lockout, bypass, remember-me, browser cache, password policy, security questions, change/reset, alternative channel); IDNT-02 registration, IDNT-03 provisioning, IDNT-04 enumeration, IDNT-05 username policy | ATHN-11 MFA †; 6.6/6.7 (OOB, cryptographic) largely code review |
| V7 Session Management | SESS-01 schema, SESS-03 fixation, SESS-04 exposed variables, SESS-06 logout, SESS-07 timeout, SESS-08 puzzling, SESS-09 hijacking | SESS-11 concurrent sessions † |
| V8 Authorization | ATHZ-02 bypass, ATHZ-03 privilege escalation, ATHZ-04 IDOR, IDNT-01 role definitions | APIT-02 BOLA †; the manual authz / tenant-isolation campaign lives here |
| V9 Self-contained Tokens | — (SESS-01, ATHN-04 touch it indirectly) | SESS-10 JSON Web Tokens † is the only dedicated test |
| V10 OAuth and OIDC | — | ATHZ-05 OAuth Weaknesses † only; applicability is #784's call |
| V11 Cryptography | CRYP-02 padding oracle, CRYP-04 weak encryption | mostly configuration/code review + SCA |
| V12 Secure Communication | CRYP-01 weak TLS, CRYP-03 sensitive data over unencrypted channels, ATHN-01, CONF-01 network infrastructure, CONF-07 HSTS | 12.3 service-to-service = compose-stack review (Ring 2) |
| V13 Configuration | CONF-01, CONF-02 platform configuration, CONF-04, CONF-05 admin interfaces; INFO-02/03/05/08/09 fingerprinting & leakage; ERRH-01/02 | 13.3 Secret Management has no WSTG test → config review + secret scanning (#778) |
| V14 Data Protection | ATHN-06 browser cache, CLNT-12 browser storage, INFO-01/05 leakage, CRYP-03, SESS-04 | data-classification input from #780 |
| V15 Secure Coding and Architecture | INFO-07 execution paths, INFO-10 architecture; INPV-13 format string, INPV-14 incubated; BUSL-04 process timing (races) | 15.2 dependencies → SCA tooling (#778); 15.4 concurrency mostly code review |
| V16 Security Logging and Error Handling | ERRH-01 improper error handling, ERRH-02 stack traces | **no WSTG logging tests** → log-sample review against 16.2–16.4 |
| V17 WebRTC | — | **no WSTG coverage**; expected N/A for open-dpp (#786) |

Ring 2/3 reconnaissance of the live instances maps to WSTG-INFO-01…10 and CONF-01/02/05/10
irrespective of chapter.

### 6. OWASP Top 10 for LLM Applications — 2025 list and the 2026 edition

**2025 edition** (the one #772/#789 name). Official page [genai.owasp.org/llm-top-10/][llm-top10-page];
PDF on the [resource page][llm-2025-resource] ("Release Date: November 17, 2024"; the 2026 PDF's
revision history says "2024-11-18 Version 2025 Release"). Source text: [`2_0_vulns/LLM01_…LLM10_*.md`][llm-repo-2_0]
in `OWASP/www-project-top-10-for-large-language-model-applications` (CC BY-SA 4.0; has
`translations/de-DE/`). Definitions below are the opening sentence(s) of each entry's "Description":

| ID | Title | Definition (verbatim opening of the official entry) |
|---|---|---|
| LLM01:2025 | Prompt Injection | "A Prompt Injection Vulnerability occurs when user prompts alter the LLM's behavior or output in unintended ways." |
| LLM02:2025 | Sensitive Information Disclosure | "Sensitive information can affect both the LLM and its application context. This includes personal identifiable information (PII), financial details, health records, confidential business data, security credentials, and legal documents." |
| LLM03:2025 | Supply Chain | "LLM supply chains are susceptible to various vulnerabilities, which can affect the integrity of training data, models, and deployment platforms." |
| LLM04:2025 | Data and Model Poisoning | "Data poisoning occurs when pre-training, fine-tuning, or embedding data is manipulated to introduce vulnerabilities, backdoors, or biases." |
| LLM05:2025 | Improper Output Handling | "Improper Output Handling refers specifically to insufficient validation, sanitization, and handling of the outputs generated by large language models before they are passed downstream to other components and systems." |
| LLM06:2025 | Excessive Agency | "An LLM-based system is often granted a degree of agency by its developer - the ability to call functions or interface with other systems via extensions … to undertake actions in response to a prompt." |
| LLM07:2025 | System Prompt Leakage | "The system prompt leakage vulnerability in LLMs refers to the risk that the system prompts or instructions used to steer the behavior of the model can also contain sensitive information that was not intended to be discovered." |
| LLM08:2025 | Vector and Embedding Weaknesses | "Vectors and embeddings vulnerabilities present significant security risks in systems utilizing Retrieval Augmented Generation (RAG) with Large Language Models (LLMs)." |
| LLM09:2025 | Misinformation | "Misinformation occurs when LLMs produce false or misleading information that appears credible." |
| LLM10:2025 | Unbounded Consumption | "Unbounded Consumption refers to the process where a Large Language Model (LLM) generates outputs based on input queries or prompts" [without limits on resources and cost — the entry "expands on what was previously Denial of Service"]. |

**2026 edition — new since the map was charted.** [OWASP GenAI LLM Top 10 2026][llm-2026-resource]
("OWASP Top 10 for LLM Applications 2026", Version 2026, August 4th, 2026; PDF id 56857, 122 pages,
CC BY-SA 4.0). As of 2026-09-03 GitHub still holds only the 2025 text, so the 2026 wording exists
only in the PDF. Its list and the documented "Rank migration from the 2025 to the final 2026":

| 2026 | Title | Was in 2025 |
|---|---|---|
| LLM01:2026 | Prompt Injection | LLM01 (steady; now covers cross-modal attacks) |
| LLM02:2026 | Sensitive Information Disclosure | LLM02 (steady) |
| LLM03:2026 | Excessive Agency | LLM06 (↑ "the most consequential move") |
| LLM04:2026 | Supply Chain | LLM03 |
| LLM05:2026 | Data and Model Poisoning | LLM04 (absorbs fine-tuning subversion) |
| LLM06:2026 | Unbounded Consumption | LLM10 (↑ four places) |
| LLM07:2026 | Misinformation | LLM09 |
| LLM08:2026 | Hidden Context Exposure | LLM07 System Prompt Leakage (renamed/re-scoped) |
| LLM09:2026 | Vector and Embedding Weaknesses | LLM08 |
| LLM10:2026 | Improper Output Handling | LLM05 (↓ "fell the furthest") |

The 2026 preface draws a boundary relevant to the Mistral chat: "This list owns the risk when the
model is a component inside your application. The moment that model becomes an actor, with tools it
can call, memory it carries between sessions … the risk moves to the OWASP Agentic Top 10" (OWASP Top
10 for Agentic Applications, announced 2025-12-09). Appendix A of the 2026 PDF maps every entry to
MITRE ATLAS v2026.06, ATT&CK v19.1, CWE 4.20, NIST AI 600-1, NIST AI RMF, CSA AICM v1.1 and OWASP
GenAI Data Security 2026 — free regulatory cross-references for #790.

### 7. Licence analysis

**Facts.**

- ASVS: "Copyright © 2008-2025 The OWASP Foundation. This document is released under the Creative
  Commons Attribution-ShareAlike 4.0 International License. For any reuse or distribution, you must
  clearly communicate the license terms of this work to others." ([Frontispiece][frontispiece];
  repo [`LICENSE.md`][asvs-license] is the full CC BY-SA 4.0 legal code; [README][asvs-readme]:
  "The entire project content is under the Creative Commons Attribution-Share Alike v4.0 license").
- WSTG: repository licence `CC-BY-SA-4.0` ([repo metadata][wstg-repo]); owasp.org footer: "Unless
  otherwise specified, all content on the site is Creative Commons Attribution-ShareAlike v4.0".
- LLM Top 10 (2025 and 2026): CC BY-SA 4.0 ([repo LICENSE.md][llm-license]; 2026 PDF p. 2).
- open-dpp: `LICENSE` at the repo root is the **GNU AGPL v3** text (commit `b62a53da` "Add GNU AGPL v3
  license"); but the root `package.json` declares `"license": "LGPL-3.0-only"` and every
  `apps/*` / `packages/*` `package.json` declares `"license": "ISC"`. The repository's own licence
  declaration is inconsistent (see § Open questions).

**What CC BY-SA 4.0 requires** ([legal code][cc-legalcode]; the ASVS `LICENSE.md` is a verbatim copy):

- *Attribution, § 3(a)(1)* — when Sharing the Licensed Material "(including in modified form)" you
  must retain, if supplied: creator identification, copyright notice, a notice referring to the
  licence, a notice referring to the disclaimer of warranties, a URI to the material; **indicate if
  you modified** it; and indicate it is licensed under CC BY-SA 4.0 with the text or a link. § 3(a)(2):
  any "reasonable manner", e.g. "a URI or hyperlink to a resource that includes the required
  information". § 2(a)(6): no implied endorsement by OWASP.
- *ShareAlike, § 3(b)* — applies **only "if You Share Adapted Material You produce"**: the Adapter's
  Licence "must be a Creative Commons license with the same License Elements, this version or later,
  or a BY-SA Compatible License", and no additional restrictive terms.
- *Adapted Material, § 1(a)* — material "derived from or based upon the Licensed Material and in which
  the Licensed Material is translated, altered, arranged, transformed, or otherwise modified in a
  manner requiring permission under the Copyright and Similar Rights". § 2(a)(4): format/medium
  changes "never produce Adapted Material".
- *Compatible licences* ([creativecommons.org/compatiblelicenses][cc-compatible]): only **Free Art
  License 1.3** and **GPLv3**, and GPLv3 "is one-way only, which means you may license your
  contributions to adaptations of BY-SA 4.0 materials under GPLv3, but you may not license your
  contributions to adaptations of GPLv3 projects under BY-SA 4.0". **AGPL-3.0 is not listed.**
- *Collections* ([CC FAQ][cc-faq]): "All Creative Commons licenses (including the version 4.0
  licenses) allow licensed material to be included in collections … You may choose a license for the
  collection, however this does not change the license applicable to the original material. When you
  include CC-licensed content in a collection, you still must adhere to the license conditions
  governing your use of the material incorporated." And on adaptation: "a modification rises to the
  level of an adaptation under copyright law when the modified work is based on the prior work but
  manifests sufficient new creativity to be copyrightable, such as a translation".
- CC notes its licences are not recommended for *software* — irrelevant here, `security-review/` is
  documentation.

**Interaction with open-dpp's licence — honest reading.**

1. **Verbatim requirement text + our own columns (id · applicability · verified-by · evidence type)**
   is a *collection*: the ASVS text stays CC BY-SA 4.0 and must be attributed; our columns are our
   work and may carry any licence. This is the CC-sanctioned model and needs no relicensing of code.
2. **Selecting/omitting requirements** (the "tailored ASVS" fork OWASP encourages) is arrangement;
   whether it crosses into *Adapted Material* is a copyright-law question, not a licence-text one.
   The safe assumption: treat the register's ASVS-derived parts as BY-SA regardless.
3. **Rewording, translating (German summary!) or merging requirement text** *is* Adapted Material →
   must be published under CC BY-SA 4.0 (or later). It **cannot** be published under AGPL-3.0,
   because AGPL is not a BY-SA Compatible Licence, and it cannot be published under GPLv3 either
   unless the whole adapted document is — which does not fit a documentation folder.
4. Therefore the register folder needs an **explicit licence notice of its own**, e.g.
   `security-review/LICENSE` (or a "Licence" section in `security-review/README.md`) stating that
   `security-review/**` is CC BY-SA 4.0, that requirement texts are © OWASP Foundation, and that the
   rest of the repository is AGPL-3.0 — the project would then be a **directory-level dual-licence**
   repository. Whether the maintainers want that, or would rather keep only ids + our paraphrase
   (which is still Adapted Material), or link to the requirement text instead of embedding it (no CC
   obligations at all, but the register is no longer self-contained and cannot be diffed per run), is
   **a licensing decision for the maintainers, not settled here**.
5. Whatever is chosen, the AGPL/LGPL/ISC inconsistency in the repo's own metadata should be resolved
   first, because any CC notice will say "the rest of the repository is licensed under X".

## Implications for the Control Register

- **Seed from** `OWASP_Application_Security_Verification_Standard_5.0.0_en.flat.json` at the pinned
  tag URL (§ 3) — it has the same seven fields as the CSV but no CSV-quoting/CRLF issues and `L` as a
  string; keep the CSV sha256 in the seeding script as a tamper/drift check. Store the verified
  sha256 and the tag (`v5.0.0_release`) in the register header. Re-seed only on a tagged ASVS release.
- **Columns**: `id` = `v5.0.0-<c>.<s>.<r>` (ASVS's own recommended form; drop the `V` prefix of
  `req_id`) · `level` (1/2/3, keep all three so an L3 uplift per chapter — "Not yet specified" in
  #772 — is a filter, not a re-seed) · `requirement` (verbatim `req_description`) · `applicability`
  (applicable / not-applicable + one-line reason, per ASVS 0x04 "this must be noted in the report") ·
  `verified-by` (auto / manual / doc-review) · `verification` (WSTG-v42-… IDs from § 5, CI job name,
  or "code review: <path>") · `evidence type`. Status-free by decision; no per-run columns.
- **Filter for the L2 backbone**: `L ∈ {"1","2"}` → 253 requirements before applicability triage;
  L3 rows stay in the file, flagged `level: 3`, for the uplift decision. Register size to expect after
  triage: 253 minus V10 (29) and V17 (7) if both are ruled out, minus GraphQL 4.3 (2) → ≈ 215 upper
  bound before per-requirement triage.
- **Attribution boilerplate** (satisfies § 3(a) TASL; put once in `security-review/README.md` and as a
  one-line footer in every `controls/<chapter>.md`):

  > Requirement texts in this folder are reproduced from the *OWASP Application Security Verification
  > Standard 5.0.0* (<https://github.com/OWASP/ASVS/releases/tag/v5.0.0_release>), Copyright ©
  > 2008-2025 The OWASP Foundation, licensed under CC BY-SA 4.0
  > (<https://creativecommons.org/licenses/by-sa/4.0/>), provided without warranty. Requirement ids
  > use the form `v5.0.0-<chapter>.<section>.<requirement>`. Texts are unmodified unless marked
  > "(adapted)"; selection, applicability and verification columns are the work of the open-dpp
  > project. OWASP does not endorse this project or certify ASVS compliance.

  Mirror the sentence for WSTG v4.2 (verification column) and for the OWASP Top 10 for LLM
  Applications 2025/2026 in `controls/llm.md`.
- **Chapter grouping for the three triage tickets** (matches their titles; counts are L1+L2 rows):
  - **#784 identity** — V6 Authentication (35), V7 Session Management (18), V8 Authorization (7),
    V9 Self-contained Tokens (7), V10 OAuth and OIDC (29) → **96 rows**; first question in #784 is
    whether V10 applies at all (Better Auth: which flows are actually enabled) and whether V9
    applies (any JWT/self-contained token in use, e.g. service tokens).
  - **#785 input/output & API** — V1 Encoding and Sanitization (27), V2 Validation and Business Logic
    (11), V3 Web Frontend Security (19), V4 API and Web Service (10), V5 File Handling (9)
    → **76 rows**; V4.3 GraphQL (2 rows) is an easy N/A; V4.4 WebSocket applies (chat gateway).
  - **#786 platform** — V11 Cryptography (14), V12 Secure Communication (9), V13 Configuration (13),
    V14 Data Protection (9), V15 Secure Coding and Architecture (13), V16 Security Logging and Error
    Handling (16), V17 WebRTC (7) → **81 rows**; V17 expected wholesale N/A.
  - Total 253 = 96 + 76 + 81. The "Documentation" sections (x.1) are the natural home of Ring-4 /
    organisational evidence (#788) and of `threat-model.md` / `scope.md` cross-references (#782, #780).
- **LLM chapter (#789)**: seed from the 2025 GitHub Markdown (stable, citable, translated) but record
  the 2026 renumbering in a second id column so `controls/llm.md` survives the edition switch; the
  five risks the ticket already names map to LLM01/LLM02/LLM05/LLM06/LLM10 (2025) = LLM01/LLM02/
  LLM10/LLM03/LLM06 (2026). LLM03 Supply Chain (Mistral model/API as a third-party processor) and
  LLM07/08 context exposure (system prompt + passport context) should be triaged, not skipped.
- **Verification column defaults**: use § 5's editorial mapping; rows without a WSTG test (V9, V10,
  V16 logging, V13.3 secrets, V15.2 dependencies) get `verified-by: manual` or the CI gate from
  #778/#791. Never cite `WSTG-…` without the `v42` version element.
- **Machine-readable register** ("Not yet specified" in #772): the flat JSON is already the right
  shape — a YAML with the seven upstream fields plus our five columns, rendered to Markdown, keeps
  the per-run diff small. Nothing is lost by ignoring Excel; upstream has none.

## Open questions

1. **Licence decision (blocking for the first `controls/*.md` commit)**: adopt a directory-level
   CC BY-SA 4.0 notice for `security-review/**` and embed verbatim requirement text — or embed ids
   only and link to the upstream text? Owner: maintainers. Prerequisite: reconcile `LICENSE`
   (AGPL-3.0) vs root `package.json` (`LGPL-3.0-only`) vs workspace packages (`ISC`).
2. **Which LLM Top 10 edition does #789 pin** — 2025 (GitHub text, translations, referenced by the map)
   or 2026 (published 2026-08-04, re-ranked, PDF only, Agentic boundary defined)? Recommendation in
   § Implications: seed 2025 ids, carry 2026 ids alongside; revisit when the 2026 text lands on GitHub.
3. **Editorial WSTG mapping is not authoritative** — accept it as the project's own mapping (and say so
   in `security-review/README.md`), or wait for OWASP CRE (opencre.org) to publish an ASVS 5.0 ↔ WSTG
   link set? No timeline for that was found in the ASVS repo.
4. **ASVS 5.0.1 patch** is the announced next release (only removals/relaxations, "an application that
   complied with the previous release will comply with the patch release"). Should the register
   auto-track patch releases (re-seed + diff in the cadence workflow) or stay pinned to 5.0.0 until a
   Review Run explicitly upgrades? Feeds the run-procedure grilling (#781).
5. **German material**: neither ASVS 5.0.0 nor WSTG v4.2 has a German translation; the LLM Top 10 2025
   has `translations/de-DE/`. Any German summary for a TÜViT engagement would be our translation =
   Adapted Material under BY-SA (§ 7 point 3).
6. **WSTG `latest` tests** (OAuth ATHZ-05, JWT SESS-10, MFA ATHN-11, CSP CONF-12) fill the biggest V6/
   V9/V10/V3 gaps but are unreleased. Cite them as `WSTG-latest-…` with the commit hash, or hold to
   v4.2 only? Decide in #781 together with the evidence rules.

## Sources

[release-5.0.0]: https://github.com/OWASP/ASVS/releases/tag/v5.0.0_release
[en-folder]: https://github.com/OWASP/ASVS/tree/v5.0.0_release/5.0/en
[using-asvs]: https://github.com/OWASP/ASVS/blob/v5.0.0_release/5.0/en/0x03-What-is-the-ASVS.md
[assessment]: https://github.com/OWASP/ASVS/blob/v5.0.0_release/5.0/en/0x04-Assessment_and_Certification.md
[for-users-of-4]: https://github.com/OWASP/ASVS/blob/v5.0.0_release/5.0/en/0x05-For-Users-Of-4.0.md
[frontispiece]: https://github.com/OWASP/ASVS/blob/v5.0.0_release/5.0/en/0x01-Frontispiece.md
[asvs-license]: https://github.com/OWASP/ASVS/blob/v5.0.0_release/LICENSE.md
[asvs-readme]: https://github.com/OWASP/ASVS/blob/master/README.md
[mappings-readme]: https://github.com/OWASP/ASVS/blob/master/5.0/mappings/README.md
[mappings-folder]: https://github.com/OWASP/ASVS/tree/master/5.0/mappings
[tools]: https://github.com/OWASP/ASVS/tree/master/5.0/tools
[owasp-asvs]: https://owasp.org/www-project-application-security-verification-standard/
[wstg-release]: https://github.com/OWASP/wstg/releases/tag/v4.2
[wstg-readme]: https://github.com/OWASP/wstg/blob/master/README.md
[wstg-repo]: https://github.com/OWASP/wstg
[wstg-checklist-42]: https://github.com/OWASP/wstg/blob/v4.2/checklist/Testing_Checklist.md
[wstg-checklist-latest]: https://github.com/OWASP/wstg/blob/master/checklists/checklist.md
[llm-top10-page]: https://genai.owasp.org/llm-top-10/
[llm-2025-resource]: https://genai.owasp.org/resource/owasp-top-10-for-llm-applications-2025/
[llm-2026-resource]: https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/
[llm-repo-2_0]: https://github.com/OWASP/www-project-top-10-for-large-language-model-applications/tree/main/2_0_vulns
[llm-license]: https://github.com/OWASP/www-project-top-10-for-large-language-model-applications/blob/main/LICENSE.md
[cc-legalcode]: https://creativecommons.org/licenses/by-sa/4.0/legalcode.en
[cc-compatible]: https://creativecommons.org/share-your-work/licensing-considerations/compatible-licenses/
[cc-faq]: https://creativecommons.org/faq/

Also used: release assets `https://github.com/OWASP/ASVS/releases/download/v5.0.0_release/OWASP_Application_Security_Verification_Standard_5.0.0_en.{csv,json,flat.json,xml,cdx.json,legacy.csv,legacy.json,flat.legacy.json,legacy.xml,docx,pdf}`; branch copies `https://raw.githubusercontent.com/OWASP/ASVS/v5.0.0/5.0/docs_en/<same names>`; WSTG stable web `https://owasp.org/www-project-web-security-testing-guide/v42/` (alias `/stable/`); LLM PDFs `https://genai.owasp.org/download/43299/` (2025) and `https://genai.owasp.org/download/56857/` (2026).
