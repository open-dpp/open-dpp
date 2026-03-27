---
outline: deep
---

# Getting started

This guide describes a basic self-hosted setup of open-dpp.

## Prerequisites

- Docker + Docker Compose
- `openssl` (for generating the MongoDB key file)

## Prepare files

For deployment, you need `docker-compose.yml` and a `.env` file. You can download both files manually from the [repository](https://github.com/open-dpp/open-dpp) or fetch them with `curl`:

```bash
curl -fsSL -o docker-compose.yml https://raw.githubusercontent.com/open-dpp/open-dpp/main/docker-compose.yml
curl -fsSL -o .env https://raw.githubusercontent.com/open-dpp/open-dpp/main/.env.example
```

Before starting the services, update `.env` with values that match your environment. For a complete list of settings, see [configuration options](/reference/configuration).

Then create the MongoDB key file:

```bash
mkdir -p docker
openssl rand -base64 756 > docker/mongo_keyfile
chmod 0400 docker/mongo_keyfile
```

## Start services

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

After startup, open `OPEN_DPP_URL` in your browser and explore the platform. If your setup uses a custom port, include it in the URL.

For more details, see [configuration options](/reference/configuration) and the [guides](/guides/branding).
