---
"@open-dpp/env": minor
"@open-dpp/dto": minor
"@open-dpp/main": minor
"@open-dpp/client": minor
---

Operators can link their privacy policy, terms of service and imprint through `OPEN_DPP_LEGAL_PRIVACY_POLICY_URL`, `OPEN_DPP_LEGAL_TERMS_OF_SERVICE_URL` and `OPEN_DPP_LEGAL_IMPRINT_URL`. The links show in a footer in the app sidebar, on the presentation view and on every sign-in and sign-up page, and `GET /instance-settings/public` returns them as `legalLinks` to everyone. While terms or a privacy policy are linked, sign-up requires a consent checkbox; the server rejects a sign-up without `termsAccepted: true` and records `termsAcceptedAt` on the user. Users created by an admin are not asked.
