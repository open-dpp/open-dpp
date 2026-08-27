---
outline: deep
---

# Getting started

This guide describes a basic self-hosted setup of open-dpp.

## Prerequisites

- Docker + Docker Compose
- `openssl` (for generating secrets and the MongoDB key file)

## Quick setup

The setup script downloads the deployment files, generates local secrets and the MongoDB key file, and starts the stack:

```bash
curl -fsSL https://raw.githubusercontent.com/open-dpp/open-dpp/main/scripts/setup.sh | bash
```

In a cloned repository, run `./scripts/setup.sh` instead.

If you prefer to prepare everything yourself, follow the manual setup below instead.

## Manual setup

For deployment, you need `docker-compose.yml`, a `Caddyfile`, and a `.env` file. You can download the files manually from the [repository](https://github.com/open-dpp/open-dpp) or fetch them with `curl`:

```bash
curl -fsSL -o docker-compose.yml https://raw.githubusercontent.com/open-dpp/open-dpp/main/docker-compose.yml
curl -fsSL -o Caddyfile https://raw.githubusercontent.com/open-dpp/open-dpp/main/Caddyfile
curl -fsSL -o .env https://raw.githubusercontent.com/open-dpp/open-dpp/main/.env.example
```

Before starting the services, update `.env` with values that match your environment — at minimum, set `OPEN_DPP_MONGODB_PASSWORD` and `OPEN_DPP_AUTH_SECRET` to secure values. For a complete list of settings, see [configuration options](/reference/configuration).

Then create the MongoDB key file (MongoDB runs as a single-node replica set, which requires one):

```bash
mkdir -p docker
openssl rand -base64 756 > docker/mongo_keyfile
chmod 0400 docker/mongo_keyfile
```

Once everything is configured, start the services:

```bash
docker compose up -d
```

To verify startup, check the container status and logs:

```bash
docker compose ps
docker compose logs -f
```

## Explore the features

After startup, open `OPEN_DPP_URL` in your browser and explore the platform — <http://app.open-dpp.localhost:20080> for the default local setup. If your setup uses a custom domain or port, adjust the URL.

For more details, see [configuration options](/reference/configuration) and the [guides](/guides/branding).
