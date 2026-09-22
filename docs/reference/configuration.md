---
outline: deep
---

# Configuration

open-dpp is configured through environment variables. Some settings can also be changed in the admin UI, but environment variables always take precedence.

## Common

| Variable                     | Type              | Required | Default | Description                                                    |
| ---------------------------- | ----------------- | -------- | ------- | -------------------------------------------------------------- |
| `OPEN_DPP_PORT`              | number            | No       | `3000`  | HTTP port for the main service.                                |
| `OPEN_DPP_URL`               | URL               | Yes      | –       | Public base URL of open-dpp (`https://your-open-dpp.example`). |
| `OPEN_DPP_LOG_FORMAT`        | `json` \| `plain` | No       | `plain` | Log output format.                                             |
| `OPEN_DPP_INSTANCE_BRANDING` | string            | No       | –       | Optional instance branding image location.                     |

## Database

| Variable                    | Type   | Required    | Default      | Description                        |
| --------------------------- | ------ | ----------- | ------------ | ---------------------------------- |
| `OPEN_DPP_MONGODB_URI`      | string | Conditional | –            | Full MongoDB connection URI.       |
| `OPEN_DPP_MONGODB_HOST`     | string | Conditional | –            | MongoDB host (when not using URI). |
| `OPEN_DPP_MONGODB_PORT`     | number | Conditional | –            | MongoDB port (when not using URI). |
| `OPEN_DPP_MONGODB_USER`     | string | Conditional | –            | MongoDB username.                  |
| `OPEN_DPP_MONGODB_PASSWORD` | string | Conditional | –            | MongoDB password.                  |
| `OPEN_DPP_MONGODB_DATABASE` | string | Conditional | `management` | MongoDB database name.             |

> `OPEN_DPP_MONGODB_URI` **or** `OPEN_DPP_MONGODB_HOST`, `OPEN_DPP_MONGODB_PORT`, `OPEN_DPP_MONGODB_PASSWORD` and `OPEN_DPP_MONGODB_USER` must be provided.

## AI Integration

| Variable                   | Type   | Required | Default | Description                      |
| -------------------------- | ------ | -------- | ------- | -------------------------------- |
| `OPEN_DPP_MISTRAL_API_KEY` | string | Yes      | –       | API key for Mistral integration. |

## S3 storage

| Variable                             | Type                    | Required | Default                     | Description                                      |
| ------------------------------------ | ----------------------- | -------- | --------------------------- | ------------------------------------------------ |
| `OPEN_DPP_S3_ENDPOINT`               | string                  | Yes      | –                           | S3 endpoint hostname/address.                    |
| `OPEN_DPP_S3_PORT`                   | number                  | Yes      | –                           | S3 endpoint port.                                |
| `OPEN_DPP_S3_SSL`                    | boolean (string-parsed) | Yes      | –                           | Enable SSL for S3 connection (`"true"` => true). |
| `OPEN_DPP_S3_ACCESS_KEY`             | string                  | Yes      | –                           | S3 access key.                                   |
| `OPEN_DPP_S3_SECRET_KEY`             | string                  | Yes      | –                           | S3 secret key.                                   |
| `OPEN_DPP_S3_DEFAULT_BUCKET`         | string                  | No       | `open-dpp`                  | Default bucket name.                             |
| `OPEN_DPP_S3_PROFILE_PICTURE_BUCKET` | string                  | No       | `open-dpp-profile-pictures` | Profile picture bucket name.                     |

## ClamAV

| Variable              | Type       | Required | Default | Description                                                                                                                                                                                                                                                       |
| --------------------- | ---------- | -------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPEN_DPP_CLAMAV_URL` | URL (http) | No       | –       | clamav-rest endpoint incl. port, e.g. `http://clamav-rest:9000`. Unset or empty disables virus scanning: uploads are accepted **unscanned** and a warning is logged at startup. See the [Production setup](/guides/production-setup#virus-scanning-clamav) guide. |

## Mail

| Variable                       | Type   | Required | Default | Description                             |
| ------------------------------ | ------ | -------- | ------- | --------------------------------------- |
| `OPEN_DPP_MAIL_HOST`           | string | Yes      | –       | SMTP host.                              |
| `OPEN_DPP_MAIL_PORT`           | number | Yes      | –       | SMTP port.                              |
| `OPEN_DPP_MAIL_USER`           | string | Yes      | –       | SMTP username.                          |
| `OPEN_DPP_MAIL_PASSWORD`       | string | Yes      | –       | SMTP password.                          |
| `OPEN_DPP_MAIL_SENDER_ADDRESS` | string | Yes      | –       | Sender address used in outgoing emails. |

## Authentication

| Variable                       | Type   | Required    | Default | Description                        |
| ------------------------------ | ------ | ----------- | ------- | ---------------------------------- |
| `OPEN_DPP_AUTH_SECRET`         | string | Yes         | –       | Authentication secret.             |
| `OPEN_DPP_AUTH_ADMIN_USERNAME` | string | Conditional | –       | Optional admin bootstrap username. |
| `OPEN_DPP_AUTH_ADMIN_PASSWORD` | string | Conditional | –       | Optional admin bootstrap password. |

> `OPEN_DPP_AUTH_ADMIN_USERNAME` and `OPEN_DPP_AUTH_ADMIN_PASSWORD` must be provided together (both set or both omitted).

## OAuth Provider

| Variable                                | Type                     | Required    | Default | Description                                                                                                                                                                                                                                                           |
| --------------------------------------- | ------------------------ | ----------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPEN_DPP_OAUTH_PROVIDER_ENABLED`       | strict boolean (string)  | No          | `false` | Lets open-dpp act as OpenID Connect provider for one operator-configured Trusted Client; value must be `"true"` or `"false"`. Unset or `"false"` = open-dpp is nobody's identity provider. See the [Production setup](/guides/production-setup#oauth-provider) guide. |
| `OPEN_DPP_OAUTH_PROVIDER_CLIENT_ID`     | string                   | Conditional | –       | The Trusted Client's `client_id`.                                                                                                                                                                                                                                     |
| `OPEN_DPP_OAUTH_PROVIDER_CLIENT_SECRET` | string                   | Conditional | –       | The Trusted Client's `client_secret`; stored as a salted scrypt hash (as User passwords are), re-applied on every startup.                                                                                                                                            |
| `OPEN_DPP_OAUTH_PROVIDER_REDIRECT_URIS` | string (comma-separated) | Conditional | –       | The Trusted Client's callback URLs: absolute `https` URLs without a fragment (`http` only on loopback hosts).                                                                                                                                                         |
| `OPEN_DPP_OAUTH_PROVIDER_CLIENT_NAME`   | string                   | No          | –       | Display name of the Trusted Client; defaults to the client id.                                                                                                                                                                                                        |

> `OPEN_DPP_OAUTH_PROVIDER_CLIENT_ID`, `OPEN_DPP_OAUTH_PROVIDER_CLIENT_SECRET` and `OPEN_DPP_OAUTH_PROVIDER_REDIRECT_URIS` are required while `OPEN_DPP_OAUTH_PROVIDER_ENABLED` is `"true"` and ignored otherwise, and `OPEN_DPP_URL` must then be an `https` origin (`http` only on loopback hosts) because the issuer derives from it. An empty value counts as unset. The Trusted Client is written from these variables on every startup, so changes need a restart; token lifetimes are fixed (access token 15 minutes, refresh token 7 days sliding). The contract the Trusted Client follows is in [Integrating a Trusted Client](/guides/production-setup#integrating-a-trusted-client).

## Instance settings

| Variable                                          | Type                    | Required | Default | Description                                                                                                    |
| ------------------------------------------------- | ----------------------- | -------- | ------- | -------------------------------------------------------------------------------------------------------------- |
| `OPEN_DPP_INSTANCE_SIGNUP_ENABLED`                | strict boolean (string) | No       | true    | Allows/disables signup; value must be `"true"` or `"false"`.                                                   |
| `OPEN_DPP_INSTANCE_ORGANIZATION_CREATION_ENABLED` | strict boolean (string) | No       | true    | Allows/disables creation of organizations for users which are not admins; value must be `"true"` or `"false"`. |

## Default caps

| Variable                                   | Type          | Required | Default | Description                                  |
| ------------------------------------------ | ------------- | -------- | ------- | -------------------------------------------- |
| `OPEN_DPP_DEFAULT_MODEL_CREATE_CAP`        | number (>= 0) | No       | `0`     | Default model creation cap per organization. |
| `OPEN_DPP_DEFAULT_AI_TOKEN_QUOTA`          | number (>= 0) | No       | `0`     | Default AI token quota per organization.     |
| `OPEN_DPP_DEFAULT_MEDIA_STORAGE_CAP`       | number (>= 0) | No       | `0`     | Default media storage cap per organization.  |
| `OPEN_DPP_DEFAULT_ORGANIZATION_MEMBER_CAP` | number (>= 0) | No       | `0`     | Default member cap per organization.         |

> A value of `0` means unlimited.
