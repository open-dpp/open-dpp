# Local development

### 1) Install dependencies

```bash
pnpm install
```

### 2) Configure environment

Create your local environment file:

```bash
cp .env.dev.example .env.dev
```

Then update secrets and tokens in `.env.dev`.

### 3) Generate MongoDB key file

```bash
openssl rand -base64 756 > docker/mongo_keyfile
chmod 0400 docker/mongo_keyfile
```

### 4) Start local infrastructure

Use the project helper:

```bash
make dev
```

This starts required services from `docker-compose.dev.yml` (for example MongoDB, MinIO, Mailpit, and ClamAV).

### 5) Start the application

```bash
pnpm run dev
```

After startup:

- open-dpp: <http://localhost:3000>
- Mailpit: <http://localhost:8025>