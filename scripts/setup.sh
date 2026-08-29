#!/usr/bin/env bash
# One-command local setup of the example deployment stack (docker-compose.yml):
# caddy + open-dpp + MongoDB + MinIO + Mailpit (no virus scanning, see
# https://docs.open-dpp.de/guides/production to add ClamAV).
#
# Works from a repo checkout (./scripts/setup.sh) or standalone in an empty
# directory (missing files are downloaded from the main branch):
#   curl -fsSL https://raw.githubusercontent.com/open-dpp/open-dpp/main/scripts/setup.sh | bash
#
# Idempotent: re-running never overwrites existing files, it just restarts
# the stack.
set -euo pipefail

RAW_BASE="https://raw.githubusercontent.com/open-dpp/open-dpp/main"

die() {
  echo "error: $*" >&2
  exit 1
}

main() {

# run from the repo root when invoked from a checkout ($0 is "bash" when the
# script is piped in, so only trust it when it points into a scripts/ dir)
script_dir="$(cd "$(dirname "$0")" 2>/dev/null && pwd)"
if [[ "${script_dir}" == */scripts && -f "${script_dir}/../docker-compose.yml" ]]; then
  cd "${script_dir}/.."
fi

command -v docker >/dev/null 2>&1 || die "docker not found — install Docker Desktop or Docker Engine"
command -v openssl >/dev/null 2>&1 || die "openssl not found"
docker info >/dev/null 2>&1 || die "docker daemon not reachable — is Docker running?"
docker compose version >/dev/null 2>&1 || die "docker compose plugin not found"

for f in docker-compose.yml Caddyfile .env.example; do
  if [ ! -f "$f" ]; then
    command -v curl >/dev/null 2>&1 || die "curl not found (needed to download $f)"
    echo "Downloading $f"
    curl -fsSL -o "$f" "${RAW_BASE}/${f}"
  fi
done

if [ -f .env ]; then
  echo ".env already exists — leaving it untouched"
else
  echo "Creating .env from .env.example"
  # hex output keeps the generated secrets free of sed/env metacharacters
  mongo_password="$(openssl rand -hex 24)"
  auth_secret="$(openssl rand -hex 32)"
  sed \
    -e "s|change-to-secure-mongo-password|${mongo_password}|" \
    -e "s|change-this-to-a-good-secret|${auth_secret}|" \
    -e 's|^# OPEN_DPP_INSTANCE_SIGNUP_ENABLED=|OPEN_DPP_INSTANCE_SIGNUP_ENABLED=|' \
    -e 's|^# OPEN_DPP_INSTANCE_ORGANIZATION_CREATION_ENABLED=|OPEN_DPP_INSTANCE_ORGANIZATION_CREATION_ENABLED=|' \
    .env.example > .env
  echo "  generated MongoDB password and auth secret; enabled signup and organization creation"
  echo "  note: AI features additionally need real values for OPEN_DPP_MISTRAL_API_KEY / OPEN_DPP_OLLAMA_URL"
  echo "  note: uploads are not virus-scanned; set OPEN_DPP_CLAMAV_URL to enable (https://docs.open-dpp.de/guides/production)"
fi

if [ -f docker/mongo_keyfile ]; then
  echo "docker/mongo_keyfile already exists — leaving it untouched"
else
  echo "Generating docker/mongo_keyfile"
  mkdir -p docker
  openssl rand -base64 756 > docker/mongo_keyfile
  chmod 0400 docker/mongo_keyfile
fi

echo "Starting the stack from docker-compose.yml"
docker compose up -d

echo "Waiting for MongoDB replica set and MinIO buckets to initialize"
docker compose wait mongo-init minio-init

cat <<'EOF'

open-dpp is up. Open:

  app:     http://app.open-dpp.localhost:20080
  Mailpit: http://localhost:8025

(If you changed SERVICE_* hosts or ports in .env, adjust the URLs accordingly.)

Restart the stack later with `docker compose up -d` (or re-run this script).
EOF

}

# the main() wrapper ensures nothing executes from a partially downloaded
# script when piped through bash
main "$@"
