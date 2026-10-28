# Carrier Export: presets, printed text and caption

Research for [Research Carrier Export presets, printed text and caption rules](https://github.com/open-dpp/open-dpp/issues/1123), part of the map [As a REO user I want to download the QR codes of my passports](https://github.com/open-dpp/open-dpp/issues/843). Researched 2026-10-28/29. Throwaway branch `research/carrier-export-presets`, never merged.

It respects the map's decisions: SVG sized in mm and PNG at a DPI; the quiet zone is always four modules; presets are named by scanning environment, with an *Advanced* section for mm, DPI and error correction; printed text and caption are both optional.

EN 18220 is gated. Everything said about it here is our paraphrase; nothing is quoted. Regulation texts are quoted, because EU law is public.

## Answer in brief

### Proposed presets

Error correction is M in every preset. X is the module size (X-dimension). Sizes include the four-module quiet zone on every side. They are computed with `qrcode` 1.5.4 for the representative URLs in section 2 on host `cloud.open-dpp.de`. "Typical" covers short slug, UUID, and GS1 Digital Link from GTIN only up to GTIN + batch + serial + 2 data attributes. "Worst" is a 20-character batch, a 20-character serial and 2 data attributes.

| Preset (working name) | Scanning environment | X target (allowed window) | EC | Symbol size, typical (worst) | Min. PNG DPI |
|---|---|---|---|---|---|
| **Packaging** (default) | Consumer phone, in hand at 10 to 30 cm: packaging, product, label, or a printed manual, receipt or conformity document | 0.495 mm (0.396 to 0.990) [GS1-GS Table 5-46; EN18220 Table B.2] | M | 18.3 to 22.3 mm (24.3) | 203 (4 px = 0.500 mm); 300 gives 6 px = 0.508 mm |
| **Retail checkout** (GS1 Digital Link only) | Retail POS imager and consumer phones; printed in addition to the EAN/UPC barcode | 0.495 mm (0.396 to 0.990) [GS1-GS Table 5-46] | M | 20.3 to 22.3 mm (24.3) | 203 |
| **Small label** | Small item or label, phone close up | 0.396 mm (0.396 to 0.990) [GS1-GS Table 5-46, its minimum] | M | 14.7 to 17.8 mm (19.4) | 300 (5 px = 0.423 mm) |
| **Large product or carton** | Large product (appliance, furniture, machine), outer carton or shelf distance; also scanned in distribution | 0.990 mm (0.743 to 0.990) [GS1-GS Table 5-49; EN18220 Table B.18 and 5.3.1] | M | 36.6 to 44.6 mm (48.5) | 150 (5 px = 0.847 mm); 300 gives 11 px = 0.931 mm |
| **Screen or web page** | Shop page, digital receipt, e-mail, customer account [EN18220 5.4.5] | 1.058 mm = 4 CSS px at 96 px/in (ours, see section 1) | M | 148 to 180 px (196) at 96 DPI | 96 |

**Advanced bounds.** X from 0.254 mm to 3.50 mm. 0.254 mm is the smallest QR X-dimension in any GS1 symbol specification table (direct part marking, GSRN). 3.50 mm is the largest (durable labels for long-distance scanning) [GS1-GS Tables 5-53, 5-57, 5-59]. Show a warning when X leaves the preset's window. DPI from 96 to 1200. Error correction L, M, Q or H.

**PNG rule** (ours):
- Pixels per module = round(X × DPI / 25.4).
- If that lands outside the preset window, step one pixel back inside.
- Show the resulting effective X.
- The minimum DPI column is the lowest common DPI (96, 150, 203, 300, 600) that gives at least 4 whole pixels per module inside the window.

### Printed text (HRI), in short

- **GS1 Digital Link:**
  - Print the GS1 element string below the code, e.g. `(01) 09506000134352 (10) ABC123 (21) 12345XYZ`. That is what `formatGs1ElementString` already produces.
  - Rules: AIs in parentheses; order as encoded; never split an element string across lines [GS1-GS 4.14].
  - Data attributes stay off by default; HRI beyond the GTIN is not required [GS1-GS 4.14.2].
  - The URL may additionally appear as non-HRI text, at the brand owner's discretion [GS1-GS 4.14 rule 3.a].
  - When the QR Code is the only barcode carrying the GTIN, `(01)` plus the 14-digit GTIN SHALL be shown [GS1-GS 4.14.2]. So Retail checkout should default HRI to on.
- **Plain open-dpp permalink:** no GS1 rule applies. EN 18220 5.7.2 describes HRI as the encoded information shown near the carrier in a clearly legible font, so print the URL exactly as encoded.
- **Typeface:** OCR-B [EN18220 5.7.2; GS1-GS 4.14 rule 2.a], from a free digitisation: Matthew Skala's OCR-B, or CTAN `ocr-b-outline`. The Linotype desktop licence forbids server use. Use no bold, italic, light or narrow cuts [GS1-GS 4.14].
- **Height:** at least 2 mm [GS1-GS 4.14 rule 2.a.iii, a SHOULD].
- **Placement:** adjacent to the code, normally below it, outside the quiet zone [GS1-GS 4.14 rule 1.a; GS1-POS p. 98].

### Caption, in short

- Only the Detergents Regulation prescribes one: Art. 21(4)(e) of (EU) 2026/405, applicable from 23 September 2029.
  - EN: *"Please scan for more comprehensive information on the product"*
  - DE: *„Für umfassendere Informationen über das Produkt bitte scannen"*
  - Both language versions allow "or a similar statement".
- The Batteries Regulation, Toy Safety Regulation, ESPR and CPR prescribe no caption. GS1 leaves any call to action to the brand owner [GS1-POS 5.6.7].
- Default to the official wording in the label's language.
- No text size rule exists for it. As a benchmark, keep an x-height of at least 1.2 mm, or 0.9 mm on packaging whose largest surface is under 80 cm². That is the EU rule for toy warnings and food labels [TOYS Annex III point 1; FIC Art. 13(2) and (3)].
- Place the caption outside the quiet zone.

## Sources

| Key | Source | Version |
|---|---|---|
| GS1-GS | GS1 General Specifications Standard, https://ref.gs1.org/standards/genspecs/ | Release 26.0, ratified Jan 2026 |
| GS1-DL | GS1 Digital Link Standard: URI Syntax, https://ref.gs1.org/standards/digital-link/ | Release 1.7.0, ratified Aug 2026 |
| GS1-DL-L | GS1 Digital Link Standard (legacy combined edition), same page | Release 1.1.4, ratified Dec 2025 |
| GS1-POS | 2D Barcodes at Retail Point-of-Sale Implementation Guideline, https://ref.gs1.org/guidelines/2d-in-retail/ | Release 1.1, ratified Dec 2025 |
| GS1-BP | Best practices for creating your QR Code powered by GS1, https://ref.gs1.org/docs/2023/QR-Code_powered-by-GS1-best-practices | 2023 |
| GS1-DE-IL | GS1 Germany/Switzerland/Austria, Implementierungsleitfaden für 2D Codes am Point-of-Sale des Einzelhandels (German edition of GS1-POS), via https://www.gs1-germany.de/branchen-themen/zukunft-2d-code/ | Ausgabe 1.1, Nov 2025 |
| GS1-DE-CL | GS1 Germany, 5-Punkte-Checkliste für die Implementierung von 2D-Codes am POS, https://www.gs1-germany.de/fileadmin/gs1/fachpublikationen/2d-checkliste-update.pdf | Nov 2025 |
| GS1-DE-BQ | GS1 Germany, Barcodequalität brochure, https://www.gs1-germany.de/fileadmin/gs1/basis_informationen/260304_GS1_Barcodequalit%C3%A4t_Brosch%C3%BCre.pdf | 03/2026 |
| GS1-US-S27 | GS1 US, Sunrise 2027, https://www.gs1us.org/industries-and-insights/by-topic/sunrise-2027 | fetched 2026-10-28 |
| EN18220 | EN 18220:2026, DPP data carriers (gated; paraphrased) | edition 1, 2026 |
| DET | Regulation (EU) 2026/405 (detergents and surfactants), CELEX 32026R0405, http://data.europa.eu/eli/reg/2026/405/oj | OJ L, 2.3.2026 |
| BATT | Regulation (EU) 2023/1542 (batteries), CELEX 32023R1542 | OJ L 191, 28.7.2023; consolidated 2026-08-13 checked |
| TOYS | Regulation (EU) 2025/2509 (toy safety), CELEX 32025R2509, http://data.europa.eu/eli/reg/2025/2509/oj | OJ L, 12.12.2025 |
| ESPR | Regulation (EU) 2024/1781 (ecodesign), CELEX 32024R1781, http://data.europa.eu/eli/reg/2024/1781/oj | OJ L, 28.6.2024 |
| CPR | Regulation (EU) 2024/3110 (construction products), CELEX 32024R3110, http://data.europa.eu/eli/reg/2024/3110/oj | OJ L, 18.12.2024 |
| FIC | Regulation (EU) No 1169/2011 (food information to consumers), CELEX 32011R1169 | OJ L 304, 22.11.2011 |
| SVG11 | SVG 1.1 Second Edition, https://www.w3.org/TR/SVG11/coords.html | REC 16 Aug 2011 |
| SVG2 | SVG 2, https://www.w3.org/TR/SVG2/coords.html | CR Snapshot 06 Oct 2026 |
| CSS4 | CSS Values and Units Level 4, https://www.w3.org/TR/css-values-4/ | WD 12 Mar 2024 |
| PNG3 | PNG Specification (Third Edition), https://www.w3.org/TR/png-3/ | REC 24 Jun 2025 |
| SHARP | sharp output options, https://sharp.pixelplumbing.com/api-output, and source at v0.35.5 | 0.35.5 (the version in `apps/main`) |
| QRCODE | node-qrcode README and `lib/` at tag v1.5.4, https://github.com/soldair/node-qrcode/tree/v1.5.4 | 1.5.4 (the version in `apps/client`) |
| ECMA-11 | ECMA-11, Alphanumeric character set OCR-B for optical recognition, https://ecma-international.org/publications-and-standards/standards/ecma-11/ | 3rd ed., Mar 1976 (withdrawn, free) |
| OCRB-CTAN | CTAN `ocr-b` (Norbert Schwarz) README https://mirrors.ctan.org/fonts/ocr-b/README and `ocr-b-outline` (Zdeněk Wagner) README https://mirrors.ctan.org/fonts/ocr-b-outline/README | 2010-12-23 / 2011-01-06 |
| OCRB-SKALA | Matthew Skala, OCR-A and OCR-B fonts, https://tsukurimashou.org/ocr.php.en | 0.3.1, 2021-03-30 |
| OCRB-LINO | Linotype OCR B on MyFonts, https://www.myfonts.com/collections/ocr-b-2-font-linotype | fetched 2026-10-28 |
| OFL | OFL FAQ, https://openfontlicense.org/ofl-faq/ ; Inter licence https://github.com/google/fonts/blob/main/ofl/inter/OFL.txt | OFL 1.1 |

## 1. Module size (X-dimension) per scanning environment

### What the sources set

**GS1 General Specifications, Release 26.0, section 5.12.3 (symbol specification tables, "SST"):**

| Table (page) | Scanning environment | Symbol | X min / target / max (mm) | Quiet zone | Min. quality |
|---|---|---|---|---|---|
| 5-46, SST 1 addendum 2 (p. 412) | Retail consumer trade items scanned at POS, not in distribution | QR Code (GS1 Digital Link URI) | 0.396 / 0.495 / 0.990 | 4X all sides | 1.5/12/660 |
| 5-49, SST 3 addendum 1 (p. 417) | Retail POS **and** general distribution | QR Code (GS1 Digital Link URI) | 0.743 / 0.990 / 0.990 | 4X | 1.5/20/660 |
| 5-50, SST 4 (p. 418) | Items not scanned at POS, in distribution or in healthcare | GS1 QR Code | 0.375 / 0.495 / 0.990 | 4X | 1.5/08/660 |
| 5-53, SST 7 (p. 422) | Direct part marking | GS1 QR Code | 0.254 / 0.300 / 0.615 | 4X | 1.5/06/660 |
| 5-57, SST 11 (p. 429) | GSRN | GS1 QR Code | 0.254 / 0.380 / 0.495 | 4X | 1.5/08/660 |
| 5-59, SST 13 (p. 431) | Durable labels, long-distance scanning | GS1 QR Code | 0.495 / (none) / 3.50 | 4X | 1.5/(80 % of X)/660 |

Notes on those tables:
- Table 5-46 carries a note that its sizes and quality reflect the read range typical of **mobile device scanning of consumer trade item packaging** (p. 413). It is the GS1 table for the consumer-phone environment.
- There is no separate GS1 table for consumer or mobile scanning. Table 2-37 maps Digital Link "extended packaging" to SST 1 addendum 2 (p. 199). GS1-GS p. 405 says there is no functional band for mobile devices today.
- Tables 5-46 and 5-49 require the Digital Link in its **uncompressed** form (footnote `**`, p. 412 and p. 417). open-dpp's `buildGs1DigitalLink` emits the uncompressed form.
- At POS these 2D codes SHALL be printed **in addition to** the linear EAN/UPC barcode. Section 8 profiles cover a future without the mandatory 1D barcode (p. 411, p. 416).
- The 2D X-dimension is 1.5 times the equivalent linear X-dimension, because of optical effects in image capture (footnotes to Tables 5-45, 5-46, 5-49, 5-50).
- A minimum X of 0.375 mm is allowed for variable-measure fresh food only by mutual agreement (p. 413).
- GS1 QR Code (element-string syntax with FNC1) rows appear in SST 2, 5, 7, 9, 11, 12 and 13. Those tables are for logistics, healthcare and other GS1 key types; open-dpp encodes only URLs, so only the Digital Link rows and SST 4 apply here.

**EN 18220:2026** (paraphrase):
- **5.5.2:** the X-dimension must be chosen so that the scanning environments the carrier is meant for read it reliably; the clause names point of sale and consumer phones as examples. A smaller X gives a denser symbol that low-resolution scanners and printers handle worse. Industries may have their own X recommendations.
- **5.3.1:** hand-held scanning typically happens at 10 to 30 cm. Large products and cartons are read at up to about 30 cm. Overall the reading distance runs from about 2 to 30 cm.
- **Table 1 (6.2.4.1):** gives 10 to 30 cm as the typical QR reading range.
- **Annex B** (informative) gives QR size examples:
  - Structured-path and query-string IDs at point of sale (Tables B.2, B.6, B.12, B.16): X 0.396 / 0.495 / 0.99 mm. These are the GS1 Table 5-46 values.
  - IEC 61406 Identification Link with a frame (Tables B.8, B.10): X 0.250 / 0.350 / 0.99 mm.
  - DOI (Table B.18): X 0.743 / 0.99 / 0.99 mm.

**GS1 Germany:**
- QR Codes with a GS1 Digital Link scanned by smart devices can be printed with an X between 0.396 and 0.990 mm. Their example is a 57-character lower-case URL at X 0.495 mm, which comes out 20.295 mm wide including the quiet zones [GS1-DE-BQ p. 10].
- The checklist repeats 0.396 / 0.495 / 0.990 mm. Its example is an upper-case URL of 57 characters, 18.315 mm wide including the quiet zone [GS1-DE-CL p. 6].
- Our library reproduces both examples at error correction M: 41 and 37 modules, × 0.495 mm.

### Per environment

| Environment | Min / target / max X (mm) | Source | Remark |
|---|---|---|---|
| Consumer phone on packaging | 0.396 / 0.495 / 0.990 | GS1-GS Table 5-46 with its mobile note; GS1-DE-BQ; EN18220 Table B.2 | The default |
| Small product label | 0.396 / 0.396 / 0.990 | GS1-GS Table 5-46 minimum | GS1 sets no smaller X for phone scanning of consumer goods. Smaller X appear only for direct marking and GSRN (0.254, SST 7 and 11), for items never scanned at POS (0.375, SST 4) and in EN 18220's framed-IL example (0.250). Offer these only in Advanced, with a warning. |
| Document or web page, printed | as consumer phone | EN18220 5.4.5 (the carrier goes into the document when the document is the only place of the identifier); GS1-GS Table 5-46 | Manuals, receipts and conformity documents are read by phones like packaging. On a 203 dpi thermal receipt printer, 0.500 mm is exactly 4 dots. |
| Document or web page, on screen | none in any source | (ours) | GS1 tables cover print only. We propose 4 CSS px per module: 1.058 mm at the CSS reference of 96 px per inch [CSS4 6.2]. A typical code is then 148 to 180 px. **Unverified:** no primary source sets a screen module size. |
| Retail point of sale | 0.396 / 0.495 / 0.990 (POS only); 0.743 / 0.990 / 0.990 (POS and distribution) | GS1-GS Tables 5-46 and 5-49 | GS1 Digital Link only; in addition to EAN/UPC |
| Large product, carton, shelf distance | 0.743 / 0.990 / 0.990 | GS1-GS Table 5-49; EN18220 Table B.18 and 5.3.1 | |

## 2. Error correction and resulting symbol size

### What the sources say

- QR Code has four levels, recovering about 7 % (L), 15 % (M), 25 % (Q) and 30 % (H) [GS1-GS 5.7.2, p. 384; QRCODE README].
- EN 18220 5.5.1 (paraphrase): a higher level makes a symbol more robust in theory but also larger, and it does not rescue a poorly printed symbol. EN 18220 sets no level.
- **No GS1 document recommends a level for QR Codes carrying a Digital Link.** GS1-POS 4.6.3 says to choose the level the use case needs (p. 39). Its only example caption uses M (Figure 4-14, p. 37). The only mandated level in GS1-GS is H, for tobacco unit packs (Table 5-58 footnote, p. 430).
- `qrcode` 1.5.4 defaults to M [QRCODE README].
- Smaller symbols:
  - GS1 recommends short domain names [GS1-POS p. 114; GS1-DE-IL p. 118].
  - GS1 recommends upper-case characters where possible, since QR alphanumeric mode is upper case only [GS1-POS 4.6.1, 8.3.2; GS1-DL-L 2.2; GS1-BP BP4; GS1-DE-CL p. 5].
  - After the domain name the Digital Link URI is case sensitive [GS1-DL p. 18].

### Computed sizes

**Method:**
- `QRCode.create(url, { errorCorrectionLevel })` from `qrcode` 1.5.4, as the backend will call it.
- Modules including quiet zone = `modules.size + 8`.
- The library splits the input into optimal numeric, alphanumeric and byte segments by itself.
- **Cross-check:** for the encoded examples of EN 18220 Tables B.1, B.5 and B.17, the library gives exactly the module counts of Tables B.2, B.6 and B.18 at all four levels.
- **Forcing pure byte mode costs one version** for every GS1 Digital Link at M, Q and H. The backend should pass the URL string, not a byte segment.

**Representative URLs:**
- `https://cloud.open-dpp.de/p/bike-42` (short slug)
- `…/p/acme-city-e-bike-2026-xl` (24-character slug)
- `…/p/3f2b8c1e-7a4d-4e9b-9c2a-5d1e6f7a8b90` (UUID)
- `…/gs1/v1/01/09506000134352` (GTIN only)
- `…/10/ABC123/21/12345XYZ` (batch + serial)
- `…?11=251121&17=271231` (2 data attributes)
- `…/10/ABCDEFGHIJ0123456789/21/ABCDEFGHIJ0123456789?11=251121&17=271231` (worst case: the 20-character limit of `GS1_CSET82_MAX_LENGTH`)

| URL | Chars | EC | Version | Modules incl. QZ | X 0.396 | X 0.495 | X 0.990 |
|---|---|---|---|---|---|---|---|
| open-dpp, short slug | 35 | L / M | 3 / 3 | 37 / 37 | 14.7 / 14.7 | 18.3 / 18.3 | 36.6 / 36.6 |
| | | Q / H | 4 / 5 | 41 / 45 | 16.2 / 17.8 | 20.3 / 22.3 | 40.6 / 44.6 |
| open-dpp, 24-char slug | 52 | L / M | 3 / 4 | 37 / 41 | 14.7 / 16.2 | 18.3 / 20.3 | 36.6 / 40.6 |
| | | Q / H | 5 / 6 | 45 / 49 | 17.8 / 19.4 | 22.3 / 24.3 | 44.6 / 48.5 |
| open-dpp, UUID | 64 | L / M | 4 / 5 | 41 / 45 | 16.2 / 17.8 | 20.3 / 22.3 | 40.6 / 44.6 |
| | | Q / H | 6 / 7 | 49 / 53 | 19.4 / 21.0 | 24.3 / 26.2 | 48.5 / 52.5 |
| GS1 DL, GTIN only | 50 | L / M | 3 / 4 | 37 / 41 | 14.7 / 16.2 | 18.3 / 20.3 | 36.6 / 40.6 |
| | | Q / H | 4 / 5 | 41 / 45 | 16.2 / 17.8 | 20.3 / 22.3 | 40.6 / 44.6 |
| GS1 DL, + batch + serial | 72 | L / M | 4 / 4 | 41 / 41 | 16.2 / 16.2 | 20.3 / 20.3 | 40.6 / 40.6 |
| | | Q / H | 5 / 7 | 45 / 53 | 17.8 / 21.0 | 22.3 / 26.2 | 44.6 / 52.5 |
| GS1 DL, + batch + serial + 2 attributes | 92 | L / M | 5 / 5 | 45 / 45 | 17.8 / 17.8 | 22.3 / 22.3 | 44.6 / 44.6 |
| | | Q / H | 7 / 8 | 53 / 57 | 21.0 / 22.6 | 26.2 / 28.2 | 52.5 / 56.4 |
| GS1 DL, worst case | 118 | L / M | 5 / 6 | 45 / 49 | 17.8 / 19.4 | 22.3 / 24.3 | 44.6 / 48.5 |
| | | Q / H | 8 / 9 | 57 / 61 | 22.6 / 24.2 | 28.2 / 30.2 | 56.4 / 60.4 |

Sizes are in mm and include the quiet zone. Each version step adds 4 modules, which is 2 mm at X 0.495 mm.

### Recommendation

- **M everywhere by default.**
  - It is the library default and the level of GS1's example.
  - Against L it costs nothing for serialised GS1 Digital Links and for short slugs. For UUID permalinks, long slugs and GTIN-only links it costs one version (+2 mm at the default X).
  - It doubles L's damage tolerance.
- **Q** fits durable, scuffed or curved surfaces. It is typically one version above M.
- **H** only where a sector rule requires it (as GS1 does for tobacco). It adds two to three versions.
- **L** belongs only in Advanced, for screens or extreme space limits.
- These choices are ours: no primary source recommends a level for these environments.

### Found on the way

Upper-casing only the scheme and host (`HTTPS://CLOUD.OPEN-DPP.DE/…`, as GS1-BP BP4 suggests) saves one version for the UUID permalink at M (45 → 41 modules), for the GTIN-only link at M (41 → 37) and for the GTIN + batch + serial + 2 attributes link at Q (53 → 49).

It would change the decoded string, though, and the build ticket requires the decoded content to equal `publicUrl`. It is out of scope; we note it for later.

## 3. Quiet zone, resolution, and physical size in files

### Quiet zone

- QR Code needs four modules of quiet zone on all sides. EN 18220 restates this from ISO/IEC 18004:2024 under every QR example in Annexes B and C, and every GS1 table above lists "4X on all four sides".
- GS1-POS gives the worked example: at X 0.495 mm the QR quiet zone is 1.980 mm (p. 41; same in GS1-DE-IL p. 40).
- HRI and caption must stay outside it [GS1-POS p. 98].
- `qrcode` defaults `margin` to 4. The current client passes `margin: 1`, which is why the Check `carriers.qr-quiet-zone-four-modules` fails.

### PNG: mm plus DPI to whole-pixel modules

- **Pixel size:**
  - Use `scale` (integer pixels per module) with `margin: 4`, never `width`.
  - `width` gives a fractional scale, and `Math.floor` in `qrToImageData` then makes modules one pixel uneven [QRCODE `lib/renderer/utils.js`]. The back office shows this today.
- **Rounding:** our rule. Ceiling can overshoot and nearest can undershoot a minimum, so the rule needs both steps.
  1. px = round(X × DPI / 25.4).
  2. If px × 25.4 / DPI falls below the window's minimum, use ceil.
  3. If it falls above the window's maximum, use floor.
  4. Report the effective X.
- **Resolution metadata:**
  - PNG records physical resolution only in the `pHYs` chunk, in pixels per metre (unit specifier 1). Without it, the physical size is unspecified [PNG3 11.3.4.3].
  - DPI maps to pixels per metre as DPI / 0.0254, so 300 DPI = 11811 px/m.
  - `qrcode`'s own PNG (via pngjs) writes no `pHYs`.
  - sharp 0.35.5 writes it: `withDensity(dpi)` (new in 0.35.0) and `withMetadata({ density })` set the resolution, and libvips' libpng saver writes `pHYs` from it unconditionally. The docs say only "in EXIF metadata"; the agent confirmed `pHYs` in the source (`src/pipeline.cc`, `src/common.cc`, libvips `vipspng.c`) [SHARP].

Whole-pixel mapping per preset (target X; effective X after the rule):

| Preset (X target, window) | 96 dpi | 150 dpi | 203 dpi | 300 dpi | 600 dpi |
|---|---|---|---|---|---|
| Packaging / Retail checkout (0.495; 0.396 to 0.990) | 2 px = 0.529 | 3 px = 0.508 | 4 px = 0.500 | 6 px = 0.508 | 12 px = 0.508 |
| Small label (0.396; 0.396 to 0.990) | 2 px = 0.529 | 3 px = 0.508 | 4 px = 0.500 | 5 px = 0.423 | 10 px = 0.423 |
| Large product or carton (0.990; 0.743 to 0.990) | 3 px = 0.794 | 5 px = 0.847 | 7 px = 0.876 | 11 px = 0.931 | 23 px = 0.974 |
| Screen or web page (1.058) | 4 px = 1.058 | 6 px = 1.016 | 8 px = 1.001 | 12 px = 1.016 | 25 px = 1.058 |

Reading the table:
- Below 300 dpi the Small label preset can no longer stay small.
- The minimum DPI column of the preset table follows from the at-least-4-pixels rule (ours, unsourced). It keeps the rounding error within ±12.5 % and avoids one- or two-pixel modules.
- A PNG prints true only at 100 % on a printer whose native resolution matches the chosen DPI. That is why DPI is a choice, with common printer resolutions as options. 203 dpi is 8 dots/mm, typical of thermal label printers; that typicality is **unverified**.

### SVG: physical size in mm

- **Sizing:**
  - An outermost `<svg>` with `width`/`height` in absolute units sets the viewport. `viewBox` maps user space onto it [SVG11 7.2, 7.7; SVG2 8.2, 8.3].
  - Absolute units follow CSS: 1 in = 2.54 cm = 25.4 mm = 96 px [CSS4 6.2; SVG2 8.9]. For print the anchor unit should be physical [CSS4 6.2].
  - So `<svg width="20.295mm" height="20.295mm" viewBox="0 0 41 41">` makes one user unit one module of 0.495 mm.
  - With printed text and caption it is simpler to use `viewBox` in mm (1 user unit = 1 mm) and draw modules at X mm each.
- **Edges:** `shape-rendering="crispEdges"` asks renderers to align edges and drop anti-aliasing. It is a hint, not a guarantee [SVG11 11.7.3; SVG2 13.10.1].
- **What `qrcode` emits:**
  - `toString(url, { type: 'svg' })` outputs only a `viewBox` in module units, with `shape-rendering="crispEdges"` and dark modules as one stroked path.
  - It writes `width`/`height` only when `opts.width` is set, as a bare number (px). A value such as `"40mm"` is silently dropped (`width >= 21` check).
  - So the backend must write the mm size itself. Building the SVG from `QRCode.create().modules` is the clean way, and it also leaves room for the text elements.
- **Operator docs:** print at 100 % ("actual size"), not "fit to page".

## 4. Established presets worth adopting

| Source | What it offers | Adopt? |
|---|---|---|
| GS1-GS Table 5-46 (Release 26.0) | 0.396 / 0.495 / 0.990 mm, 4X, 1.5/12/660, for mobile scanning of consumer packaging and POS | Yes: Packaging, Retail checkout, Small label |
| GS1-GS Table 5-49 | 0.743 / 0.990 / 0.990 mm for POS and distribution | Yes: Large product or carton |
| GS1-GS Tables 5-53, 5-57, 5-59 | 0.254 mm minimum (direct marking, GSRN), 3.50 mm maximum (long distance) | As Advanced bounds only |
| EN 18220 Annex B (informative) | The same 0.396 / 0.495 / 0.99 mm for POS; 0.743 / 0.99 for DOI; 0.250 / 0.350 for framed IEC 61406 links | Confirms the GS1 values; no new preset |
| GS1 Germany (GS1-DE-BQ, GS1-DE-CL, GS1-DE-IL) | 0.396 to 0.990 mm for smart devices; the GS1-POS rules in German | Confirms; German terms: X-Modulbreite, Hellzone/Ruhezone, Klarschriftzeile, Fehlerkorrekturstufe |
| GS1 Sunrise 2027 (GS1-US-S27; GS1-POS 1.2; GS1-GS p. 24) | The ambition that POS can read 2D barcodes by the end of 2027; no numbers of its own | Nothing to adopt beyond GS1-GS |
| Batteries Regulation Annex VI Part C | Qualitative only: high contrast, a size easily readable by common phone QR readers | Met by the Packaging preset (our reading); no numbers to adopt |
| GS1 Retail 2D barcode size estimator, https://ref.gs1.org/tools/module-count [GS1-DL-L] | Interactive tool | Not read; our computation covers it |

## 5. Printed text (HRI)

### EN 18220 5.7.2 (paraphrase)

- HRI is the encoded information, shown close to the carrier in a clearly legible font; OCR-B per ISO 1073-2 is the example.
- Industries and product legislation may add rules.
- The clause has no modal verb, so the matrix grades it as enablement. The ESPR Art. 10(1)(b) mapping in Annex ZA cites it.

### GS1 Digital Link (GS1-GS 4.14, Release 26.0, pp. 304-310)

GS1-POS 1.1 and GS1 Germany still cite the section as "4.15"; in Release 26.0 it is 4.14.

- **Placement:**
  - HRI SHOULD be present and adjacent to the barcode, below it or, for lack of space, above or beside it (rules 1.a, 1.b).
  - It SHALL follow the encoded sequence (1.c).
  - An element string SHALL NOT be split over lines (1.e).
  - HRI SHALL appear except under extreme space constraints (1.g).
- **Content:**
  - HRI is limited to element strings (2.b).
  - Parentheses SHALL surround AIs (2.c).
  - Spaces may be added for readability (2.a.v).
  - For a Digital Link in "extended packaging", printing the URI as non-HRI text is the brand owner's choice: GTIN only, or the URL (3.a).
- **Retail (4.14.2):**
  - HRI for an additional consumer-engagement barcode is left to the brand owner.
  - QR Code (GS1 Digital Link URI) SHALL display `(01)` plus the 14-digit GTIN. That HRI is not required when the code sits next to a linear barcode with HRI, or when it is for consumer engagement only. It is required when the 2D code is the only barcode for the GTIN (p. 308-309).
  - HRI beyond the GTIN is not required (p. 310).
  - Figure 4-13 shows only `(01)09524810000339` under the QR Code, no URL.
- **Font:**
  - A clearly legible font SHALL be used, for example OCR-B. GS1 cites ISO/IEC 30116 here, EN 18220 cites ISO 1073-2.
  - Monospaced OCR-B or a sans serif such as Arial is preferred.
  - No bold, italic, light or narrow cuts.
  - Size SHOULD be at least 2 mm (0.08 in) in height (2.a).
  - GS1 logistics labels need 3 mm (5.c).
  - No rule ties text height to the X-dimension.
- GS1 Germany restates that the GTIN in HRI for DataMatrix and QR Code is shown as `(01)` plus 14 digits [GS1-DE-BQ p. 11]. If an EAN is present, the 2D code needs none [GS1-DE-CL p. 6].
- The GS1 2D Barcode Implementation Journey (v3.0, Sep 2025) says the GTIN must always be shown as HRI. That is stricter than GS1-GS; we follow GS1-GS.

**Proposal for a GS1 Digital Link Carrier Export:**
- The HRI line is the element string of the key and its qualifiers, `(01) … (10) … (21) …`, in encoded order, one element string never split.
- Data attributes (`?11=…&17=…`) are left out by default.
- The URL is an optional second line of non-HRI text.
- Retail checkout turns HRI on by default.

### Plain open-dpp permalink

- No GS1 rule applies, because there is no GS1 key.
- Following EN 18220 5.7.2, the HRI is the URL exactly as encoded, e.g. `https://cloud.open-dpp.de/p/bike-42`.
- A UUID permalink is 64 characters. At 2 mm OCR-B that is about 3 lines under a 22 mm code (our estimate, about 1.7 mm advance per character). Break lines only after `/` or `-`; this is ours, since no source covers wrapping a URL.

### Typeface and licensing

- **OCR-B** is the typeface both sources name.
- **ECMA-11** (3rd edition 1976, the basis of ISO 1073) is a free download but withdrawn [ECMA-11].
- **Linotype's OCR B** desktop licence forbids server installation, embedding in applications and online hosting [OCRB-LINO]. It does not fit server-side generation.
- **Free digitisations:**
  - Norbert Schwarz's METAFONT `ocr-b` lifted its non-commercial restriction and may be used, modified and distributed without limitation.
  - Zdeněk Wagner's Type 1/OpenType `ocr-b-outline` carries the same terms [OCRB-CTAN].
  - Matthew Skala's OCR-B: his contributions are public domain, and the others' claims are licensed for unrestricted use [OCRB-SKALA].
  - Both digitisers say they cannot speak for rights in Frutiger's original letterforms. Our reading of their licence statements: shipping one of these in an AGPL server is fine. That is a reading, not legal advice.
  - No OCR-B is in Google Fonts.
- **Fallback for HRI and font for the caption:** an OFL 1.1 sans with Latin, Greek and Cyrillic coverage, so all 24 EU languages work, e.g. Inter. Embedding OFL fonts is allowed, and artwork made with them is not under the OFL [OFL FAQ 1.12, 1.13].

### Minimum text height

- HRI: at least 2 mm character height [GS1-GS 4.14 2.a.iii]. We read this as the height of digits and capitals; GS1 does not define it further (**unverified** interpretation).
- At 203 dpi, 2 mm is 16 pixels, which is legible. At 96 dpi it is 7.6 pixels, which is another reason for the print presets' minimum DPI.

## 6. Caption

### Detergents Regulation (EU) 2026/405, Art. 21(4)(e)

Applies from 23 September 2029 (Art. 37). Quoted from the Cellar texts.

EN, Art. 21(4): "The data carrier referred to in paragraph 2, point (h), shall be: … (e) accompanied by the statement 'Please scan for more comprehensive information on the product' or by a similar statement; and …"

DE, Art. 21(4): "Der Datenträger gemäß Absatz 2 Buchstabe h muss … e) mit dem Hinweis „Für umfassendere Informationen über das Produkt bitte scannen" oder einem ähnlichen Hinweis versehen sein und …"

The other points of Art. 21(4):
- (a) printed or physically present on the label, packaging or bulk documents;
- (c) positioned so devices process it automatically;
- (f) visible before purchase, including in distance sales.

The layout and position of the carrier are left to a future implementing act (Art. 21(10)(b)). The regulation sets no font size; label information must be legible and in the languages the Member State determines (Art. 17(5)).

### Other regulations

| Act | Data carrier rule | Caption? | Size rule? |
|---|---|---|---|
| Batteries (EU) 2023/1542 | Art. 13(6): QR code from 18 February 2027, per Annex VI Part C. Art. 13(7): printed or engraved visibly, legibly and indelibly, else on packaging and documents. Art. 77(3): the passport is reached through it. | None | Annex VI Part C, qualitative only: "in high contrast to the background colour and of a size that is easily readable by a commonly available QR reader, such as those integrated in hand-held communication devices." |
| Toy Safety (EU) 2025/2509 | Art. 19(7): on the toy or an affixed label, else packaging or documents; clearly visible before purchase, including distance sales. Layout is left to the delegated act of Art. 49(1). | None | None for the carrier. Annex III point 1 sets an x-height of at least 1.2 mm (0.9 mm when the largest surface is under 80 cm²) for **warnings**. |
| ESPR (EU) 2024/1781 | Art. 10(1)(b): on the product, packaging or accompanying documents, as the delegated act specifies. Art. 9(2)(c): the delegated act sets layout and positioning. | None | None |
| CPR (EU) 2024/3110 | Art. 77(1)(b) with Art. 18(2)(g): the carrier follows the CE marking, which is affixed visibly, legibly and indelibly (Art. 18(1)). | None | None |

GS1 has no standard that requires or recommends a call to action; it is left to the brand owner [GS1-POS 5.6.7; German: GS1-DE-IL 5.6.7]. No GS1 Germany document offers a German call-to-action phrase.

### Proposed caption rules

1. **Wording:**
   - Default to the official DET wording in the label's language: EN "Please scan for more comprehensive information on the product", DE "Für umfassendere Informationen über das Produkt bitte scannen".
   - It satisfies DET literally and suits every other product group, none of which prescribes wording.
   - The other 22 official wordings can be read from the language versions of CELEX 32026R0405 through Cellar (`Accept-Language: <iso639-2>`).
2. **Size:**
   - x-height at least 1.2 mm, or 0.9 mm when the target surface is under 80 cm² (benchmark from TOYS Annex III point 1 and FIC Art. 13(2) and (3); ours for this use).
   - With a typical sans x-height of about half the font size, that is a font size of about 2.4 mm (about 7 pt).
3. **Placement:**
   - Above or below the code, outside the 4-module quiet zone.
   - Not between the code and its HRI, which must stay adjacent (ours).
4. **Optional:** the caption is never part of the symbol. DET is the only product group where leaving it off is non-conformant, and only once DET applies.

## Open points for the prototype

These are for [Prototype the Carrier Export dialog](https://github.com/open-dpp/open-dpp/issues/1125):

1. **Retail checkout:** show it as its own preset, or fold it into Packaging? The numbers are identical. It differs only in being offered for GS1 Digital Links alone, defaulting HRI to on, and the note that it goes beside the EAN/UPC.
2. **HRI for long URLs:** wrap at `/` and `-` under the code, or let the text block grow wider than the symbol? A UUID permalink needs about 3 lines at 2 mm.
3. **Caption language:**
   - Which official translations ship.
   - Whether the user can edit the text ("or a similar statement").
   - Whether small labels get a shorter variant.
4. **Advanced below 0.396 mm:** allow it down to 0.254 mm with a warning, or block it?
5. **Preview:** show the code at physical size, and with PNG the effective X after whole-pixel rounding plus the final mm size.
6. **Screen or web page:** offer a 2× pixel density for high-DPI screens (8 px per module), or leave that to SVG?

Notes for the build tickets:
- Generate from `QRCode.create(url)` with the URL as a string, not a forced byte segment.
- Write the SVG with mm `width`/`height` yourself.
- Rasterise PNG at integer pixels per module and set `pHYs` with sharp `withDensity`.
- Render text as outlines, or embed the font, so the server's installed fonts do not change the output.
- Check that the chosen OCR-B digitisation has glyphs for every URL character (`%`, `&`, `=`, `?`, `~`).

## Unverified or not found

- No primary source gives an on-screen module size; the Screen preset value (4 CSS px per module) is ours.
- No primary source recommends an error-correction level for these environments; M as the default is ours.
- The at-least-4-pixels-per-module rule and the rounding rule are ours. ISO/IEC 18004:2024 (gated, not bought) was not read for any raster tolerance.
- No GS1 document gives an absolute minimum QR size for phones (such as "2 cm"). The closest is the Table 5-46 note.
- GS1's "2 mm in height" for HRI is read as character height of digits and capitals.
- Whether POS scanners accept a Digital Link with a custom path such as `/gs1/v1/`:
  - GS1-DL 1.7.0 lists `https://brand.example.com/some-extra/pathinfo/01/…` as a valid non-canonical URI (p. 39).
  - It also notes that URIs with a custom path fail ABNF-based validation (p. 20).
  - Real scanner behaviour is untested.
- Glyph coverage of the free OCR-B fonts for URL characters, and rights in the original OCR-B letterforms, beyond the digitisers' own licence statements.
- ISO 19809 (accessible packaging, paywalled) and ISO 1073-2 were not read for text sizes.
- "Typical" thermal printer resolutions (203, 300, 600 dpi) are not sourced. 203 dpi = 8 dots/mm is arithmetic.
- The GS1 size estimator tool was not used.

## Reproducing the computations

Install `qrcode@1.5.4` outside the repo and run:

```js
const QRCode = require("qrcode");
for (const level of ["L", "M", "Q", "H"]) {
  const qr = QRCode.create(url, { errorCorrectionLevel: level });
  // modules incl. quiet zone: qr.modules.size + 8; physical size: (qr.modules.size + 8) * X
  console.log(level, qr.version, qr.modules.size + 8);
}
```

Pixels per module: `Math.round((X * dpi) / 25.4)`, then clamped into the preset window as in section 3.
