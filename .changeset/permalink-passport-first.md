---
"@open-dpp/dto": major
"@open-dpp/api-client": major
"@open-dpp/testing": minor
"@open-dpp/client": minor
"@open-dpp/main": minor
---

Passport-first permalinks: the "Create GS1 link" flow becomes "Create Permalink" and open-dpp unique product identifiers can now carry permalinks.

- The `presentation` permalink kind is renamed to `open-dpp` (wire-level; legacy documents are migrated on read).
- Every permalink now carries a required `passportId`; `presentationConfigurationId` and `uniqueProductIdentifierId` are both optional on the open-dpp kind — a bare passport-bound permalink is valid.
- Strict kind matching: `gs1-link` permalinks require a GS1 identifier, `open-dpp` permalinks may bind an OPEN_DPP_UUID identifier; an open-dpp identifier may carry any number of permalinks (gs1-links stay one-per-identifier).
- `/p/{slug ?? id}` renders the permalink's own bound presentation configuration; a null binding renders the built-in standard view (`presentationConfiguration` in the bundle is now nullable, no config is auto-consulted or seeded on the render path).
- The GS1 resolver redirects a scanned Digital Link to the gs1-link permalink's own viewer URL — the primary-permalink concept (including `POST /permalinks/:id/primary`) is removed; the passport editor QR shows the latest-created permalink.
- Presentation configurations are shareable across permalinks (config-unique index dropped) and re-bindable pre-freeze via `PATCH /permalinks/:id`; the last-permalink delete guard is gone (the freeze rule remains the only guard).
