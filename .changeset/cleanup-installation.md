---
"@open-dpp/env": major
"@open-dpp/main": major
"@open-dpp/api-client": major
"@open-dpp/docs": patch
---

Simplified installation with breaking configuration changes.

The Ollama AI provider was removed; Mistral (`codestral-latest`) is now the only supported provider. `OPEN_DPP_OLLAMA_URL` was dropped from the env schema and the `ollama` value was removed from the `AiProvider` enum in the API client. Existing AI configurations using Ollama must be migrated to Mistral (set `OPEN_DPP_MISTRAL_API_KEY`).

MongoDB configuration now accepts either a connection URI or individual connection settings: provide `OPEN_DPP_MONGODB_URI`, or all of `OPEN_DPP_MONGODB_HOST`, `OPEN_DPP_MONGODB_PORT`, `OPEN_DPP_MONGODB_USER` and `OPEN_DPP_MONGODB_PASSWORD`. Host/port setups without credentials no longer pass validation. `OPEN_DPP_MONGODB_USER`, `OPEN_DPP_MONGODB_PASSWORD` and `OPEN_DPP_MONGODB_DATABASE` are optional when using a URI; `OPEN_DPP_MONGODB_DATABASE` defaults to `management`.

The example deployment was simplified (MongoDB single-node replica set with Mailpit for local development) and a new production setup guide covers MongoDB, SMTP and S3-compatible storage.
