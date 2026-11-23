---
"@open-dpp/env": minor
"@open-dpp/main": minor
"@open-dpp/client": minor
---

Update the better-auth packages to 1.7.27, which closes their open security advisories. What changes for an instance:

- **OAuth Provider, action needed for some Trusted Clients:** the provider now accepts the Trusted Client's secret in one position only. The new optional `OPEN_DPP_OAUTH_PROVIDER_CLIENT_AUTH_METHOD` names it: `client_secret_basic` (HTTP Basic header, the default) or `client_secret_post` (form body). Set it to `client_secret_post` if the Trusted Client sends its secret in the form body, otherwise its token requests fail with `invalid_client`. Discovery advertises the registered method only.
- OAuth Provider, token endpoint: a replayed authorization code is answered with `400 invalid_grant` (was `401 invalid_grant`) and also revokes the refresh token it yielded. A wrong `code_verifier` is answered with `400 invalid_grant` (was `401 invalid_request`). A `resource` other than the issuer is `400 invalid_target`. Revoking a JWT access token is refused with `400 unsupported_token_type` (was accepted without effect). A `code_challenge_method` other than `S256` comes back on the redirect URI as `invalid_request`.
- OAuth Provider, tokens: access tokens carry the header `typ: at+jwt` and the claims `client_id` and `jti`, id tokens carry `at_hash`. A refresh keeps the `resource` of the code exchange. `userinfo` and introspection stop answering for an access token once the session it was issued in has ended; API access with it still lasts until it expires.
- OAuth Provider, redirect URIs: a registered redirect URI matches exactly, the port of a loopback address included.
- Organizations: Members whose role may not invite no longer see the pending invitations of their Organization.
- Email change: a verification link sent before the update no longer completes the change; it has to be requested again. Opening a verification link no longer signs the User in.
- MongoDB: better-auth creates the indexes its collections need at startup, in the background. A database user without the `createIndex` privilege gets an error in the log, not a failed start.
- Rate limiting: better-auth tells clients apart by `X-Forwarded-For` only while the header holds a single address. Behind more than one proxy hop, its limits on sign-in, sign-up and password reset count all requests together; `OPEN_DPP_TRUST_PROXY` does not change that. See the note on `OPEN_DPP_TRUST_PROXY` in the configuration reference.

Update dependencies:

- @open-dpp/client: `@better-auth/api-key` ^1.6.17 → ^1.7.27
- @open-dpp/client: `better-auth` ^1.6.17 → ^1.7.27
- @open-dpp/main: `@better-auth/api-key` ^1.6.17 → ^1.7.27
- @open-dpp/main: `@better-auth/core` ^1.6.17 → ^1.7.27
- @open-dpp/main: `@better-auth/oauth-provider` ^1.6.17 → ^1.7.27
- @open-dpp/main: `better-auth` ^1.6.17 → ^1.7.27
