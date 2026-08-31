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

After startup, open `OPEN_DPP_URL` in your browser and explore the platform ([http://localhost:3000](http://localhost:3000) by default). If your setup uses a custom port, include it in the URL. The docker compose project also includes a mailpit instance on [http://localhost:8025](http://localhost:8025) which allows you to receive emails from you open-dpp instance.

For more details, see [configuration options](/reference/configuration) and the [guides](/guides/branding).

> [!WARNING]
> The Docker Compose configuration used in this guide is intended for local evaluation only and is not suitable for production use. For guidance on setting up a production environment, see the [Production setup](/guides/production-setup) guide.
