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

| Variable                    | Type   | Required    | Default | Description                        |
| --------------------------- | ------ | ----------- | ------- | ---------------------------------- |
| `OPEN_DPP_MONGODB_URI`      | string | Conditional | –       | Full MongoDB connection URI.       |
| `OPEN_DPP_MONGODB_HOST`     | string | Conditional | –       | MongoDB host (when not using URI). |
| `OPEN_DPP_MONGODB_PORT`     | number | Conditional | –       | MongoDB port (when not using URI). |
| `OPEN_DPP_MONGODB_USER`     | string | Yes         | –       | MongoDB username.                  |
| `OPEN_DPP_MONGODB_PASSWORD` | string | Yes         | –       | MongoDB password.                  |
| `OPEN_DPP_MONGODB_DATABASE` | string | Yes         | –       | MongoDB database name.             |

> `OPEN_DPP_MONGODB_URI` **or** both `OPEN_DPP_MONGODB_HOST` and `OPEN_DPP_MONGODB_PORT` must be provided.

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

| Variable               | Type   | Required | Default | Description                  |
| ---------------------- | ------ | -------- | ------- | ---------------------------- |
| `OPEN_DPP_CLAMAV_URL`  | string | Yes      | –       | ClamAV service host/address. |
| `OPEN_DPP_CLAMAV_PORT` | number | Yes      | –       | ClamAV service port.         |

## Mail

| Variable                       | Type   | Required | Default | Description                             |
| ------------------------------ | ------ | -------- | ------- | --------------------------------------- |
| `OPEN_DPP_MAIL_HOST`           | string | Yes      | –       | SMTP host.                              |
| `OPEN_DPP_MAIL_PORT`           | number | Yes      | –       | SMTP port.                              |
| `OPEN_DPP_MAIL_USER`           | string | Yes      | –       | SMTP username.                          |
| `OPEN_DPP_MAIL_PASSWORD`       | string | Yes      | –       | SMTP password.                          |
| `OPEN_DPP_MAIL_SENDER_ADDRESS` | string | Yes      | –       | Sender address used in outgoing emails. |

## Authentication

| Variable                            | Type                    | Required    | Default | Description                              |
| ----------------------------------- | ----------------------- | ----------- | ------- | ---------------------------------------- |
| `OPEN_DPP_AUTH_SECRET`              | string                  | Yes         | –       | Authentication secret.                   |
| `OPEN_DPP_AUTH_CLOUD_ENABLED`       | boolean (string-parsed) | No          | –       | Enables cloud auth provider integration. |
| `OPEN_DPP_AUTH_CLOUD_PROVIDER`      | string                  | Conditional | –       | Cloud auth provider identifier.          |
| `OPEN_DPP_AUTH_CLOUD_CLIENT_ID`     | string                  | Conditional | –       | OAuth/OIDC client ID.                    |
| `OPEN_DPP_AUTH_CLOUD_CLIENT_SECRET` | string                  | Conditional | –       | OAuth/OIDC client secret.                |
| `OPEN_DPP_AUTH_CLOUD_DISCOVERY_URL` | string                  | Conditional | –       | Provider discovery URL.                  |
| `OPEN_DPP_AUTH_ADMIN_USERNAME`      | string                  | Conditional | –       | Optional admin bootstrap username.       |
| `OPEN_DPP_AUTH_ADMIN_PASSWORD`      | string                  | Conditional | –       | Optional admin bootstrap password.       |

> If `OPEN_DPP_AUTH_CLOUD_ENABLED` is `true`, all of the following must be set: `OPEN_DPP_AUTH_CLOUD_PROVIDER`, `OPEN_DPP_AUTH_CLOUD_CLIENT_ID`, `OPEN_DPP_AUTH_CLOUD_CLIENT_SECRET`, `OPEN_DPP_AUTH_CLOUD_DISCOVERY_URL`

> `OPEN_DPP_AUTH_ADMIN_USERNAME` and `OPEN_DPP_AUTH_ADMIN_PASSWORD` must be provided together (both set or both omitted).

## Instance settings

| Variable                                          | Type                    | Required | Default | Description                                                                                                    |
| ------------------------------------------------- | ----------------------- | -------- | ------- | -------------------------------------------------------------------------------------------------------------- |
| `OPEN_DPP_INSTANCE_SIGNUP_ENABLED`                | strict boolean (string) | No       | true    | Allows/disables signup; value must be `"true"` or `"false"`.                                                   |
| `OPEN_DPP_INSTANCE_ORGANIZATION_CREATION_ENABLED` | strict boolean (string) | No       | true    | Allows/disables creation of organizations for users which are not admins; value must be `"true"` or `"false"`. |

## Default caps

| Variable                             | Type          | Required | Default | Description                                  |
| ------------------------------------ | ------------- | -------- | ------- | -------------------------------------------- |
| `OPEN_DPP_DEFAULT_MODEL_CREATE_CAP`  | number (>= 0) | No       | `0`     | Default model creation cap per organization. |
| `OPEN_DPP_DEFAULT_AI_TOKEN_QUOTA`    | number (>= 0) | No       | `0`     | Default AI token quota per organization.     |
| `OPEN_DPP_DEFAULT_MEDIA_STORAGE_CAP` | number (>= 0) | No       | `0`     | Default media storage cap per organization.  |
