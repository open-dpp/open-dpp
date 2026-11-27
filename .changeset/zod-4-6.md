---
"@open-dpp/client": patch
"@open-dpp/main": patch
"@open-dpp/dto": patch
"@open-dpp/env": patch
"@open-dpp/testing": patch
---

Update `zod` to 4.6.7, which is patched against the security advisory GHSA-mrhx-c7xc-m3w5: validating an oversized array, set or map could exhaust memory. What changes for API callers:

- **Date-times need seconds.** Request fields and query parameters that take an ISO 8601 date-time are rejected without seconds: send `2026-01-01T06:15:00Z`, not `2026-01-01T06:15Z`. This applies to `startDate` and `endDate` (listing passports and templates, the registry export, the activity history and its download, passport metrics) and to `createdAt` and `updatedAt` in an imported AAS export file. `xs:dateTime` property values are not affected: seconds stay optional there, so stored values keep loading.
- **Unknown keys get a new message.** An unknown key in the policy limits or in `defaultComponents` of a presentation configuration is still rejected, now with `Unrecognized key: "<key>"` instead of `Invalid key in record`. The error names the object, no longer the key, as its path. Policy limits that hold unknown keys only also report `At least one policy key must be provided`.
- GS1 data attributes keep their message, `"<key>" is not a known GS1 data-attribute AI`. Several unknown AIs now share one error on the map instead of one error each.
- Length limits on text count Unicode code points instead of UTF-16 code units, so an emoji counts once, not twice.

Update dependencies:

- @open-dpp/client: `zod` ^4.4.3 → ^4.6.6
- @open-dpp/main: `zod` ^4.4.3 → ^4.6.6
- @open-dpp/dto: `zod` ^4.4.3 → ^4.6.6
- @open-dpp/env: `zod` ^4.4.3 → ^4.6.6
- @open-dpp/testing: `zod` ^4.4.3 → ^4.6.6
