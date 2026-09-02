#!/usr/bin/env bash
# One-command local setup of the example deployment stack (docker-compose.yml):
# open-dpp + MongoDB + MinIO + Mailpit + ClamAV.
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

for f in docker-compose.yml .env.example; do
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
  # hex output keeps the generated secret free of sed metacharacters
  auth_secret="$(openssl rand -hex 32)"
  sed \
    -e "s|change-this-to-a-good-secret|${auth_secret}|" \
    .env.example > .env
  echo "  generated auth secret"
  echo "  note: AI features additionally need a real value for OPEN_DPP_MISTRAL_API_KEY"
fi

echo "Starting the stack from docker-compose.yml"
# a stale local :latest image fails env validation against the current .env.example
docker compose pull || echo "warning: pull failed — starting with local images"
docker compose up -d

echo "Waiting for MinIO buckets to initialize"
docker compose wait minio-init

cat <<'EOF'

open-dpp is up. Open:

  app:     http://localhost:3000
  Mailpit: http://localhost:8025

Restart the stack later with `docker compose up -d` (or re-run this script).
EOF

}

# the main() wrapper ensures nothing executes from a partially downloaded
# script when piped through bash
main "$@"
