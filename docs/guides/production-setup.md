# Production setup

This guide describes the infrastructure requirements and configuration steps for running open-dpp in a production environment.

> [!WARNING]
> The `docker-compose.yml` provided in the repository is intended for local evaluation only and must not be used as a basis for a production deployment. It does not include authentication hardening, TLS termination, persistent volume configuration, or any of the reliability measures required in a production context.

A production deployment of open-dpp requires the following external services:

- A **MongoDB** instance with a replica set enabled
- An **SMTP server** for outgoing email (optional; without one the mail links are written to the log, see [Mail (SMTP)](#mail-smtp))
- An **S3-compatible object storage** service

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

## Mail (SMTP)

open-dpp sends mail for signup verification, password resets, email changes and organization invitations. The example deployment ships without a mail server (the development stack can start Mailpit behind the `mail` compose profile); connect your SMTP relay through these variables:

| Variable                       | Description                                                                                    |
| ------------------------------ | ---------------------------------------------------------------------------------------------- |
| `OPEN_DPP_MAIL_HOST`           | SMTP server hostname. Unset (or empty) ⇒ mail is disabled, see [Disabled mode](#disabled-mode) |
| `OPEN_DPP_MAIL_PORT`           | SMTP server port (default `587`; `465` = implicit TLS)                                         |
| `OPEN_DPP_MAIL_USER`           | SMTP username; omit for an unauthenticated relay                                               |
| `OPEN_DPP_MAIL_PASSWORD`       | SMTP password                                                                                  |
| `OPEN_DPP_MAIL_SENDER_ADDRESS` | From address used in all outgoing emails, e.g. `open-dpp <noreply@example.com>`                |

- `OPEN_DPP_MAIL_SENDER_ADDRESS` is required as soon as `OPEN_DPP_MAIL_HOST` is set; startup fails otherwise.
- Port `587` (the default) connects in plain text and upgrades to TLS via STARTTLS when the server offers it. Port `465` uses implicit TLS from the first byte. Leave `OPEN_DPP_MAIL_USER` unset to send without an `AUTH` handshake.
- With credentials on port `587`, make sure the relay advertises STARTTLS: the upgrade is opportunistic, so against a relay without it the password is sent in plain text. Use `465` when in doubt.

### Disabled mode

When `OPEN_DPP_MAIL_HOST` is unset (or empty) the backend starts normally, logs a warning at startup and, instead of sending, writes one line per mail to its log with the mail type, recipient, subject and the contained links, for example:

```
WARN [EmailService] Mail not sent (mail disabled): type=VERIFY_EMAIL to=ada@example.com subject="Verify E-Mail address" links=https://dpp.example.com/api/v1/auth/verify-email?token=…
```

An operator can complete the flow by handing that link to the user. The same happens when an admin switches the **Sending mail enabled** toggle off on the admin Settings page while SMTP is configured.

> [!WARNING]
> In disabled mode the log contains live verification, password-reset, email-change-revoke and invitation links. Anyone who can read the log can act on them. Restrict log access accordingly, or configure SMTP.

### Admin toggle and env lock

`mailEnabled` is an instance setting (default on) shown as the third toggle on the admin Settings page. Precedence, highest first:

1. `OPEN_DPP_MAIL_HOST` unset ⇒ mail is off and the toggle is locked, whatever else is set.
2. `OPEN_DPP_INSTANCE_MAIL_ENABLED="true"` / `"false"` ⇒ that value, toggle locked.
3. Otherwise the value stored by the admin toggle.

Instance settings are cached in memory per replica for 60 seconds and refreshed immediately on update, so a toggle takes effect at once on the replica that handled it and within a minute on the others.

### What changes while mail is off

The backend keeps every route; only delivery changes. The frontend hides the self-service actions that can only complete by mail:

- sign-in: the "Forgot password?" link
- profile: the change-email button, the resend-verification button and the "not verified" badge

Admin actions — creating or inviting users, resending reset or verification mails — stay visible, since an admin can pick the link from the log. Signing in with an unverified address is allowed either way.

## S3-compatible object storage

open-dpp stores file uploads (passport attachments, profile pictures) in an S3-compatible object storage service. Both self-hosted solutions (such as MinIO) and managed services (AWS S3, Cloudflare R2, Hetzner Object Storage) are supported.

| Variable                     | Description                                                     |
| ---------------------------- | --------------------------------------------------------------- |
| `OPEN_DPP_S3_ENDPOINT`       | Hostname or IP address of the S3 endpoint                       |
| `OPEN_DPP_S3_PORT`           | Port of the S3 endpoint                                         |
| `OPEN_DPP_S3_SSL`            | Set to `"true"` to enable TLS; required for any public endpoint |
| `OPEN_DPP_S3_ACCESS_KEY`     | S3 access key                                                   |
| `OPEN_DPP_S3_SECRET_KEY`     | S3 secret key                                                   |
| `OPEN_DPP_S3_DEFAULT_BUCKET` | Bucket for passport files (default: `open-dpp`)                 |

The bucket must exist before starting the application.

Ensure that `OPEN_DPP_S3_SSL` is set to `"true"` whenever the storage endpoint is reachable over the public internet.
