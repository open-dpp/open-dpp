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

## Virus scanning (ClamAV)

Uploaded files (passport media, organization logos) are scanned when `OPEN_DPP_CLAMAV_URL` points to a [clamav-rest](https://hub.docker.com/r/ajilaag/clamav-rest) endpoint. When the variable is unset, uploads are accepted **unscanned** and the backend logs a warning at startup. The example and development compose files do not include ClamAV.

| Variable              | Description                                                                 |
| --------------------- | --------------------------------------------------------------------------- |
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
