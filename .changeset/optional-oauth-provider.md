---
"@open-dpp/main": minor
"@open-dpp/client": minor
"@open-dpp/dto": minor
"@open-dpp/api-client": minor
"@open-dpp/env": minor
---

Optional OAuth Provider: open-dpp can act as an OpenID Connect provider for one operator-configured Trusted Client (for example a landing page), off by default.

- `OPEN_DPP_OAUTH_PROVIDER_ENABLED` plus `OPEN_DPP_OAUTH_PROVIDER_CLIENT_ID`, `_CLIENT_SECRET`, `_REDIRECT_URIS` and optional `_CLIENT_NAME` configure it; the client variables are validated only while the provider is enabled. The Trusted Client is written on every startup; a failed write stops the startup.
- The Trusted Client signs Users in through `{origin}/api/v2/auth` and calls the API on their behalf with a 15-minute JWT access token carrying `open-dpp:api`; refresh tokens last 7 days, sliding.
- The sign-in and sign-up pages continue a pending authorization; the sign-up page does so through the new `POST /api/v2/oauth-provider/continue` (`apiClient.dpp.oauthProvider.continueAuthorization`).
- Users created without a display name get one (first and last name, or `User`), and `GET /organizations/member` reads memberships from the database.

See `docs/guides/production-setup.md#oauth-provider`.
