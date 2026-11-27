---
"@open-dpp/main": patch
---

The bulk import reads every cell of a CSV file, column names included, as the text written in the file. A cell is only unquoted and trimmed. Before, cells were interpreted and rewritten:

- Numbers lost their form: `007` became `7`, the GTIN `04012345678901` lost its leading zero, `123456789012345678` became `123456789012345680`, `1e5` became `100000`, `50%` became `0.5` and a quoted `"1,5"` became `15`.
- Dates became serial numbers that depended on the server's time zone: `2024-01-31` became `45322` or `45322.041666666664`.
- `TRUE` became `true`, and a formula such as `=1+1` became an empty cell.

One notation to check in existing files: a cell written as `="007"` arrived as `007` and now arrives as written. Write `007` instead.

`.xlsx` files are read as before, with one exception: a date cell that the file stores as ISO text without a time zone offset (for example `2024-07-15T12:00:00`) was shifted by the server's UTC offset and now gives the same serial number on every server. A server that runs in UTC sees no difference.

The library that reads these files changes from `xlsx` 0.18.5, the last version published under that name on npm, to `@e965/xlsx` 0.20.3, which republishes the vendor's current release. It contains the fixes for two advisories rated high that affect 0.18.5: GHSA-4r6h-8v6p-xvw6 (prototype pollution) and GHSA-5pgg-2g8v-p4x9 (regular expression denial of service).
