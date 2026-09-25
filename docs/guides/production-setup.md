# Production setup

This guide describes the infrastructure requirements and configuration steps for running open-dpp in a production environment.

> [!WARNING]
> The `docker-compose.yml` provided in the repository is intended for local evaluation only and must not be used as a basis for a production deployment. It does not include authentication hardening, TLS termination, persistent volume configuration, or any of the reliability measures required in a production context.

A production deployment of open-dpp requires the following external services:

- A **MongoDB** instance with a replica set enabled
- An **SMTP server** for outgoing email
- An **S3-compatible object storage** service
- Optionally, a **ClamAV** scanner for virus-scanning uploads

Each service is configured through environment variables. For a complete reference, see [Configuration](/reference/configuration).

## MongoDB

open-dpp relies on multi-document transactions, which require MongoDB to be running as a replica set. A standalone MongoDB instance is not supported.

Use `OPEN_DPP_MONGODB_URI` to supply a full connection URI. This is the recommended approach when connecting to a replica set, as the URI can encode the replica set name and all member hosts directly:

```dotenv
OPEN_DPP_MONGODB_URI=mongodb://user:password@host1:27017,host2:27017,host3:27017/open-dpp?replicaSet=rs0&authSource=admin
```

Alternatively, if you are connecting to a single-host replica set, you may use the individual host variables instead:

| Variable                    | Description      |
| --------------------------- | ---------------- |
| `OPEN_DPP_MONGODB_HOST`     | MongoDB host     |
| `OPEN_DPP_MONGODB_PORT`     | MongoDB port     |
| `OPEN_DPP_MONGODB_USER`     | MongoDB username |
| `OPEN_DPP_MONGODB_PASSWORD` | MongoDB password |
| `OPEN_DPP_MONGODB_DATABASE` | Database name    |

Either `OPEN_DPP_MONGODB_URI` or the combination of `OPEN_DPP_MONGODB_HOST`, `OPEN_DPP_MONGODB_PORT`, `OPEN_DPP_MONGODB_USER` and `OPEN_DPP_MONGODB_PASSWORD` are always required.

### MongoDB single-host replica set

When running MongoDB as a containerized single-host replica set with authentication enabled, MongoDB requires an internal authentication key file (`mongo_keyfile`). This file is used by the replica set members to authenticate with each other and must be present before the `mongod` process starts.

**Generate the key file:**

```bash
openssl rand -base64 756 > mongo_keyfile
chmod 0400 mongo_keyfile
```

The file permissions must be `0400` (readable only by the owner). MongoDB will refuse to start if the key file has broader permissions.

**Mount the key file into the container:**

Pass the key file path to `mongod` via `--keyFile` and mount it as a read-only volume. A minimal Docker Compose service definition looks as follows:

```yaml
services:
  mongodb:
    image: mongo:7
    command:
      - "--replSet"
      - "rs0"
      - "--bind_ip_all"
      - "--keyFile"
      - "/etc/mongo/mongo_keyfile"
    volumes:
      - ./mongo_keyfile:/etc/mongo/mongo_keyfile:ro
      - mongo_data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: <username>
      MONGO_INITDB_ROOT_PASSWORD: <password>
      MONGO_INITDB_DATABASE: <database>
```

After first startup, the replica set must be initiated once via `mongosh`:

```js
rs.initiate({ _id: "rs0", members: [{ _id: 0, host: "mongodb:27017" }] });
```

This step is required only once. On subsequent restarts the replica set configuration is persisted in the data volume.

## SMTP

open-dpp sends transactional email for account management and notifications. Configure your SMTP server using the following variables:

| Variable                       | Description                              |
| ------------------------------ | ---------------------------------------- |
| `OPEN_DPP_MAIL_HOST`           | SMTP server hostname                     |
| `OPEN_DPP_MAIL_PORT`           | SMTP server port (typically `587`)       |
| `OPEN_DPP_MAIL_USER`           | SMTP username                            |
| `OPEN_DPP_MAIL_PASSWORD`       | SMTP password                            |
| `OPEN_DPP_MAIL_SENDER_ADDRESS` | From address used in all outgoing emails |

## S3-compatible object storage

open-dpp stores file uploads (passport attachments, profile pictures) in an S3-compatible object storage service. Both self-hosted solutions (such as [RustFS](https://rustfs.com), which the example compose stack uses) and managed services (AWS S3, Cloudflare R2, Hetzner Object Storage) are supported.

| Variable                             | Description                                                                     |
| ------------------------------------ | ------------------------------------------------------------------------------- |
| `OPEN_DPP_S3_ENDPOINT`               | Hostname or IP address of the S3 endpoint                                       |
| `OPEN_DPP_S3_PORT`                   | Port of the S3 endpoint                                                         |
| `OPEN_DPP_S3_SSL`                    | Set to `"true"` to enable TLS; required for any public endpoint                 |
| `OPEN_DPP_S3_ACCESS_KEY`             | S3 access key                                                                   |
| `OPEN_DPP_S3_SECRET_KEY`             | S3 secret key                                                                   |
| `OPEN_DPP_S3_DEFAULT_BUCKET`         | Bucket for passport files (default: `open-dpp`)                                 |
| `OPEN_DPP_S3_PROFILE_PICTURE_BUCKET` | Bucket for organization profile pictures (default: `open-dpp-profile-pictures`) |

Both buckets (`OPEN_DPP_S3_DEFAULT_BUCKET` and `OPEN_DPP_S3_PROFILE_PICTURE_BUCKET`) must exist before starting the application; the application never creates them and only needs object read, write and delete permissions on them. Object versioning is optional: when the bucket has it enabled, the version id of each upload is stored with the media record; downloads always fetch the current object. The buckets do not need any public-read policy, because the backend proxies every download.

Ensure that `OPEN_DPP_S3_SSL` is set to `"true"` whenever the storage endpoint is reachable over the public internet.

## Virus scanning (ClamAV)

Uploaded files (passport media, organization logos) are scanned when `OPEN_DPP_CLAMAV_URL` points to a [clamav-rest](https://hub.docker.com/r/ajilaag/clamav-rest) endpoint. When the variable is unset, uploads are accepted **unscanned** and the backend logs a warning at startup. The example and development compose files do not include ClamAV.

| Variable              | Description                                                                |
| --------------------- | -------------------------------------------------------------------------- |
| `OPEN_DPP_CLAMAV_URL` | clamav-rest endpoint including the port. Unset or empty disables scanning. |

Add the service to your stack:

```yaml
services:
  clamav-rest:
    image: ajilaag/clamav-rest
    restart: unless-stopped
```

and point open-dpp at it:

```dotenv
OPEN_DPP_CLAMAV_URL=http://clamav-rest:9000
```

ClamAV loads its signature database on start; plan for roughly 1–2 GB of RAM and a short delay before the first scan succeeds. While the scanner is unreachable, uploads are rejected with `The file was denied by our virus scanning system.`

## OAuth Provider

open-dpp can act as an OpenID Connect provider and OAuth 2.1 authorization server for **exactly one** operator-configured application, the **Trusted Client**: for example a landing page or billing portal that lets Users sign in with their open-dpp account. A User signs in once with open-dpp; the Trusted Client receives an id token and userinfo and may call the open-dpp API on the User's behalf with a short-lived access token. Because the operator chose the client, Users are never asked to consent to it.

The feature is **off by default**. While `OPEN_DPP_OAUTH_PROVIDER_ENABLED` is unset or `"false"`, open-dpp is nobody's identity provider: the OAuth endpoints do not exist (`404`), no OAuth collections are created, and rows left over from an earlier enabled phase are ignored. Two related changes apply whatever the flag says: a User created without a usable display name gets one (their first and last name, or `User` when both are blank), and `GET /api/v2/organizations/member` reads a User's Organizations from the database, so API keys can call it as well.

| Variable                                | Description                                                                                                                                                                                                           |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPEN_DPP_OAUTH_PROVIDER_ENABLED`       | `"true"` or `"false"` (default `"false"`). While `"true"`, the three client variables below are required.                                                                                                             |
| `OPEN_DPP_OAUTH_PROVIDER_CLIENT_ID`     | The Trusted Client's `client_id`, chosen by you.                                                                                                                                                                      |
| `OPEN_DPP_OAUTH_PROVIDER_CLIENT_SECRET` | The Trusted Client's `client_secret`, chosen by you. Hand it to the Trusted Client's server only; open-dpp stores only a salted hash.                                                                                 |
| `OPEN_DPP_OAUTH_PROVIDER_REDIRECT_URIS` | Comma-separated list of the Trusted Client's callback URLs. Each entry is an absolute `https` URL without a fragment; `http` is accepted only on loopback hosts (`localhost`, `*.localhost`, `127.0.0.0/8`, `[::1]`). |
| `OPEN_DPP_OAUTH_PROVIDER_CLIENT_NAME`   | Optional display name of the Trusted Client. Defaults to the client id.                                                                                                                                               |

An empty value (`KEY=""`) counts as unset. Enabling the provider without one of the required variables stops the startup with `OPEN_DPP_OAUTH_PROVIDER_ENABLED is set to true but <KEY> is not set.`; an invalid redirect URI stops it too, so a typo never surfaces later as an `invalid_redirect` error. While enabled, `OPEN_DPP_URL` must be an `https` origin as well (`http` only on loopback hosts): the issuer and every OAuth endpoint derive from it, and client credentials, authorization codes and tokens must never travel in cleartext. Generate the client secret rather than choosing it, for example with `openssl rand -base64 32`; open-dpp enforces no minimum length.

```dotenv
OPEN_DPP_OAUTH_PROVIDER_ENABLED=true
OPEN_DPP_OAUTH_PROVIDER_CLIENT_ID=landing-page
OPEN_DPP_OAUTH_PROVIDER_CLIENT_SECRET=<long random secret>
OPEN_DPP_OAUTH_PROVIDER_REDIRECT_URIS=https://landing.example.com/auth/callback
OPEN_DPP_OAUTH_PROVIDER_CLIENT_NAME=Landing page
```

### How the Trusted Client is stored

- On every startup with the provider enabled, open-dpp writes the Trusted Client from these variables into the `oauthClient` collection (created on the first boot, updated afterwards). A changed secret, redirect list or name takes effect **after a restart**; the row's identity and creation date are preserved. A row flipped to `disabled` in the database is re-enabled on the next boot.
- open-dpp creates a unique index on `oauthClient.clientId`, so several replicas booting at once converge on one row.
- A failed write is logged at error level and stops the startup, so the OAuth Provider never serves a stale secret or redirect list; fix the database problem and restart.
- Disabling the provider deletes nothing; the row stays inert until the provider is enabled again.
- The client secret is stored as a salted scrypt hash, with the same key derivation open-dpp applies to User passwords, and is re-hashed with a fresh salt on every startup. Rotating it invalidates nothing already issued (outstanding access, id and refresh tokens stay valid); it only changes which secret the Trusted Client must present from then on to exchange codes, refresh, revoke or introspect.

### Endpoints and lockdown

Everything lives under the **issuer** `https://<your host>/api/v2/auth` (the `OPEN_DPP_URL` origin plus the authentication mount). Reachable while enabled:

| Endpoint                                              | Purpose                                                                                                                             |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `GET {issuer}/.well-known/openid-configuration`       | OpenID Connect discovery                                                                                                            |
| `GET {issuer}/.well-known/oauth-authorization-server` | OAuth 2.0 authorization-server metadata (RFC 8414)                                                                                  |
| `GET {issuer}/jwks`                                   | Signing keys (JWKS)                                                                                                                 |
| `GET {issuer}/oauth2/authorize`                       | Authorization endpoint                                                                                                              |
| `POST {issuer}/oauth2/token`                          | Token endpoint                                                                                                                      |
| `GET {issuer}/oauth2/userinfo`                        | UserInfo endpoint                                                                                                                   |
| `POST {issuer}/oauth2/revoke`                         | Token revocation (RFC 7009)                                                                                                         |
| `POST {issuer}/oauth2/introspect`                     | Token introspection (RFC 7662)                                                                                                      |
| `POST {issuer}/oauth2/continue`                       | Resumes a pending authorization after a sign-up (open-dpp's sign-up page reaches it through `POST /api/v2/oauth-provider/continue`) |

Everything else the underlying library offers is switched off and answers `404 Not Found` for every HTTP method: dynamic client registration and client management (`/oauth2/register`, `/oauth2/create-client`, `/oauth2/update-client`, `/oauth2/delete-client`, `/oauth2/get-client`, `/oauth2/get-clients`, `/oauth2/public-client`, `/oauth2/public-client-prelogin`, `/oauth2/client/rotate-secret`), consent management (`/oauth2/consent`, `/oauth2/get-consent`, `/oauth2/get-consents`, `/oauth2/update-consent`, `/oauth2/delete-consent`), RP-initiated logout (`/oauth2/end-session`; the discovery document still advertises an `end_session_endpoint`, a known cosmetic quirk) and the session-to-JWT endpoint `/token`. The provider exists only on the latest API version: `/api/v1/auth/oauth2/...` is `404`.

Rate limits are the library's defaults, enforced in production mode only and per process: token 20 requests per minute, authorize 30, revoke 30, userinfo 60, introspect 100.

### Storage, keys and secrets

- The provider uses five MongoDB collections: `oauthClient`, `oauthAccessToken` (opaque access tokens only; JWTs are not stored), `oauthRefreshToken`, `oauthConsent` (unused, consent is skipped) and `jwks`. The only index open-dpp creates is the unique one on `oauthClient.clientId`; the library never deletes expired token rows.
- Tokens are signed with one Ed25519 key, generated on first use and stored in `jwks` with its private half encrypted with `OPEN_DPP_AUTH_SECRET`. **Changing `OPEN_DPP_AUTH_SECRET` breaks token signing** until the documents in `jwks` are deleted; open-dpp then generates a new key, and every access token signed with the old one becomes invalid. Plan the change as a forced re-login of the Trusted Client's users.
- Access tokens are verified in process against the keys in `jwks`, cached for five minutes and refetched on an unknown key id, so a key rotation needs no restart. If the key set cannot be read, API calls carrying an access token fail with `500` rather than `401`, so an outage is never mistaken for a bad token.

### Token lifetimes

All lifetimes are fixed; none is configurable.

| Token              | Lifetime            | Notes                                                                    |
| ------------------ | ------------------- | ------------------------------------------------------------------------ |
| Authorization code | 10 minutes          | single use; also the lifetime of a pending sign-in                       |
| Access token       | **15 minutes**      | a signed JWT that **no revocation can recall**, hence the short lifetime |
| Id token           | 10 hours            |                                                                          |
| Refresh token      | **7 days, sliding** | rotated on every use; every rotation restarts the 7-day window           |

Worth knowing as an operator: after a User signs out of open-dpp (or their session is revoked), the Trusted Client can still act for them for at most the remaining lifetime of an access token (15 minutes), and, if the User never logs out of the Trusted Client, keep refreshing for up to seven idle days. Both are accepted for a first-party client.

### Login pages

The provider reuses open-dpp's own `/signin` and `/signup` pages; there is no separate login or consent UI. Whether new Users can sign up during a flow follows the instance's signup setting exactly as elsewhere.

### Integrating a Trusted Client

This is the contract the Trusted Client's developers implement. `{issuer}` stands for `https://<your host>/api/v2/auth`.

**Client.** A confidential web client authenticating with `client_secret_basic` (HTTP Basic `client_id:client_secret`, used in the examples below) or `client_secret_post` (`client_id` and `client_secret` in the form body) on the token, revoke and introspect endpoints, so every one of those calls happens **server side**. PKCE with `S256` is mandatory (`plain` is refused). Consent is skipped, so no consent page ever appears.

**Discovery.** `GET {issuer}/.well-known/openid-configuration`. The `issuer` in that document is `{issuer}`: it is the `iss` of every token and the `resource` value below. The JWKS at `{issuer}/jwks` holds EdDSA (Ed25519) keys, so the Trusted Client's JOSE library must support EdDSA to validate id tokens.

**Scopes.** `openid profile email offline_access open-dpp:api`. Request all of them (an unknown scope is refused with `invalid_scope`). `offline_access` yields a refresh token. **`open-dpp:api`** is the one scope that grants API access: the Trusted Client may act as the signed-in User with exactly the User's own authority, nothing more. There are no fine-grained scopes.

#### 1. Authorization request

```http
GET {issuer}/oauth2/authorize
  ?response_type=code
  &client_id=<client id>
  &redirect_uri=<one of the registered URIs, verbatim>
  &scope=openid%20profile%20email%20offline_access%20open-dpp%3Aapi
  &state=<random>
  &nonce=<random>
  &code_challenge=<S256 challenge>
  &code_challenge_method=S256
```

Optional `prompt`: `login` forces re-authentication, `create` sends the User to the sign-up page, `none` fails with `login_required` when no session exists. **Never send `prompt=select_account`**; open-dpp has no account chooser. `resource` is not an authorize parameter (see the token endpoint).

- A User with an open-dpp session in the browser is redirected straight to `<redirect_uri>?code=…&state=…&iss={issuer}`.
- Otherwise the provider redirects to open-dpp's sign-in page on the same host (`/signin?…`, or `/signup?…` for `prompt=create`), carrying the complete pending request as a signed query (`…&exp=<unix seconds>&ba_iat=<ms>&sig=<HMAC>`; `sig` is the last parameter, standard base64, percent-encoded). The pending request expires after 10 minutes. No cookie is set; the signed URL _is_ the pending request.
- After the User signs in or signs up, open-dpp redirects the browser to `<redirect_uri>?code=…&state=…&iss={issuer}`. The Trusted Client never handles the sign-in pages; it only receives the callback.
- Tokens issued right after a sign-up carry `email_verified: false`; e-mail verification never resumes a flow.

Errors that need no User come back on the redirect URI (`error`, `error_description`, `state`): `invalid_scope` for an unknown scope, `invalid_request` for a missing `code_challenge`, `login_required` for `prompt=none` without a session. An unregistered `redirect_uri` is never redirected to; the browser lands on the provider's error page `{issuer}/error?error=invalid_redirect` instead.

#### 2. Code exchange

```http
POST {issuer}/oauth2/token
Authorization: Basic base64(<client id>:<client secret>)
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=<code>
&redirect_uri=<the same redirect_uri>
&code_verifier=<PKCE verifier>
&resource={issuer}
```

**Always send `resource={issuer}`** on the exchange _and on every refresh_. With it, the access token is a signed JWT that the open-dpp API accepts. Without it, the provider issues an opaque token that only `{issuer}/oauth2/userinfo` and `{issuer}/oauth2/introspect` understand and that the API refuses with `401`.

The response (`Cache-Control: no-store`, `Pragma: no-cache`):

```json
{
  "access_token": "<JWT>",
  "token_type": "Bearer",
  "expires_in": 900,
  "expires_at": 1758480000,
  "scope": "openid profile email offline_access open-dpp:api",
  "id_token": "<JWT>",
  "refresh_token": "<opaque>"
}
```

The authorization code is single use: a second exchange fails with `401 invalid_grant`. Other refusals: a wrong `code_verifier` → `401 invalid_request` (`code verification failed`); a wrong client secret → `401 invalid_client`; a `resource` other than `{issuer}` → `400 invalid_request` (`requested resource invalid`).

#### 3. Tokens and claims

The **access token** is a JWT with header `{ "alg": "EdDSA", "kid": "…" }` (no `typ`) and this payload:

| Claim        | Value                                                                   |
| ------------ | ----------------------------------------------------------------------- |
| `iss`        | `{issuer}`                                                              |
| `sub`        | the User's id (stable, public)                                          |
| `aud`        | `["{issuer}", "{issuer}/oauth2/userinfo"]`                              |
| `azp`        | the client id                                                           |
| `scope`      | the granted scopes, space separated                                     |
| `iat`, `exp` | issued at and expiry, `exp − iat` = 900 s                               |
| `sid`        | _may_ be present (an open-dpp session id); do not rely on it either way |

There is no `jti`: two tokens minted in the same second for the same User can be byte-identical, so never use token equality as a "refresh happened" signal. The API validates the access token itself; the Trusted Client only stores it and sends it along.

The **id token** (`aud` = client id) carries `iss`, `sub`, `nonce`, `iat`, `exp`, `auth_time` and `acr`; with the `profile` scope also `name`, `given_name` (first name), `family_name` (last name) and `locale` (the User's preferred language, `en` or `de`), plus `picture` only when the User has an image; with the `email` scope also `email` and `email_verified`. There are **no organization or role claims**; the Trusted Client learns a User's Organizations and roles through the API (step 5).

`GET {issuer}/oauth2/userinfo` with `Authorization: Bearer <access token>` returns `sub` and the same scope-gated claims: with `profile` `name`, `given_name`, `family_name` and `locale` (and `picture` when set), with `email` `email` and `email_verified`.

#### 4. Refresh, revoke, logout

```http
POST {issuer}/oauth2/token
Authorization: Basic base64(<client id>:<client secret>)
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token&refresh_token=<refresh token>&resource={issuer}
```

- Every refresh returns a **new** refresh token and invalidates the one just used; store the new one immediately. Presenting a used refresh token again is answered with `400 invalid_grant` and **tears down the whole token family**: the current refresh token stops working too, and the User has to sign in again. Access tokens already issued keep working until they expire.
- A refresh token expires 7 days after it was issued; since every rotation issues a new one, the window slides with use.
- **On the Trusted Client's own logout, revoke the refresh token** (server side):

  ```http
  POST {issuer}/oauth2/revoke
  Authorization: Basic base64(<client id>:<client secret>)
  Content-Type: application/x-www-form-urlencoded

  token=<refresh token>&token_type_hint=refresh_token
  ```

  then drop the access, id and refresh tokens from the Trusted Client's session. Revoking a refresh token stops all further refreshing; revoking an access token is accepted (`200`) but changes nothing, because a JWT lives until its `exp` (at most 15 minutes). open-dpp's own sign-out never touches the Trusted Client's tokens, and there is no single logout in either direction.

- `POST {issuer}/oauth2/introspect` (`token=…`, optional `token_type_hint`, client credentials) is available for opaque and refresh tokens; JWT access tokens need no introspection.

#### 5. Calling the open-dpp API as the User

Send the JWT access token as a bearer token to the regular API (`https://<your host>/api/v2/…`):

```http
GET /api/v2/organizations/member
Authorization: Bearer <access token>
```

The request runs **as the User**, with the User's own memberships and roles; nothing is granted that the User could not do in the browser.

- A missing, expired, opaque or otherwise invalid bearer token is refused with `401 { "code": "UNAUTHORIZED", "message": "Invalid or expired access token" }` on every endpoint that requires a signed-in User. Refresh (step 4) and retry.
- Endpoints that require a browser session, today the User's own API-key management under `/api/v2/users/me/api-keys`, refuse the token with `403 This endpoint requires a browser session`.
- Organization-scoped endpoints take the organization in the `x-open-dpp-organization-id` header; the User must be a Member of it (`403` otherwise).

The endpoints a Trusted Client typically needs:

| Request                                                                                              | Answer                                                                                                                                                                                                                                                                                                                             |
| ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/v2/organizations/member`                                                                   | The Organizations the User is a Member of: `[{ "id", "name", "metadata", "createdAt" }]`.                                                                                                                                                                                                                                          |
| `GET /api/v2/organizations/:id/members`                                                              | The Members of one Organization, including the User's own entry: `[{ "id", "organizationId", "userId", "role", "createdAt", "user": { "id", "email", "name", "image" } }]`. Look up the User's role per Organization here; `role` is `"owner"` or `"member"`, and **`owner`** is the privileged role (billing, member management). |
| `GET /api/v2/policies/organizations/:id` with the header `x-open-dpp-organization-id: <the same id>` | Quota utilization of the Organization: `{ "AI_TOKEN_QUOTA": { "limit", "used", "reset" }, "MEDIA_STORAGE_LIMIT": { "limit", "used" }, "PASSPORT_CREATE_LIMIT": { "limit", "used" }, "ORGANIZATION_MEMBER_LIMIT": { "limit", "used" } }`; a `limit` of `0` means unlimited.                                                         |

Provisioning, quota changes and every other administrative write stay on an instance-admin API key (`x-api-key`); the Trusted Client's access token adds no write endpoints of its own.
