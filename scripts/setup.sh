#!/usr/bin/env bash
# One-command local setup of the example deployment stack (docker-compose.yml):
# open-dpp + MongoDB + RustFS. Mail is off (links are logged) and uploads are
# not virus-scanned; see https://docs.open-dpp.de/guides/production-setup to
# configure SMTP or add ClamAV.
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

# The SMTP host the open-dpp container gets, empty when it has none. Asks compose
# instead of parsing .env, so quotes, comments and duplicates resolve as they do
# in the container.
configured_mail_host() {
  docker compose config open-dpp 2>/dev/null \
    | sed -n 's/^[[:space:]]*OPEN_DPP_MAIL_HOST:[[:space:]]*//p' \
    | tr -d "\"'"
}

# An existing .env is kept, so the mail setup can differ from .env.example here.
print_mail_status() {
  local mail_host
  # the stack is already up: an unknown mail setup is no reason to fail, and
  # nothing below may be claimed without knowing it
  mail_host="$(configured_mail_host)" || return 0

  case "${mail_host}" in
    "")
      cat <<'EOF'
No SMTP server is configured, so verification and password-reset links are
written to the app log instead of being mailed: `docker compose logs -f open-dpp`

EOF
      ;;
    mailpit)
      cat <<'EOF'
warning: OPEN_DPP_MAIL_HOST in .env still points at mailpit, which this stack no
longer runs. Mail fails to send and its links are not logged. Comment out the
OPEN_DPP_MAIL_* block in .env to log links instead, or point it at your SMTP
server, then run `docker compose up -d`.

EOF
      ;;
    *)
      echo "Mail is sent through ${mail_host}. Links only reach the app log while"
      echo "sending is switched off in the admin settings."
      echo
      ;;
  esac
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
  # hex output keeps the generated secrets free of sed metacharacters
  auth_secret="$(openssl rand -hex 32)"
  s3_secret="$(openssl rand -hex 32)"
  sed \
    -e "s|change-this-to-a-good-secret|${auth_secret}|" \
    -e "s|change-this-to-a-good-s3-secret|${s3_secret}|" \
    .env.example > .env
  echo "  generated auth secret and S3 secret key"
  echo "  note: AI features additionally need a real value for OPEN_DPP_MISTRAL_API_KEY"
  echo "  note: uploads are not virus-scanned; set OPEN_DPP_CLAMAV_URL to enable (https://docs.open-dpp.de/guides/production-setup)"
fi

echo "Starting the stack from docker-compose.yml"
# a stale local :latest image fails env validation against the current .env.example
docker compose pull || echo "warning: pull failed — starting with local images"
# open-dpp depends on rustfs-init (creates the buckets), so this blocks until
# the object storage is ready.
docker compose up -d

cat <<'EOF'

open-dpp is up. Open:

  app:     http://localhost:3000
  RustFS:  http://localhost:9001 (object storage console; log in with the S3 keys from .env)

EOF

print_mail_status

cat <<'EOF'
Restart the stack later with `docker compose up -d` (or re-run this script).
EOF

}

# the main() wrapper ensures nothing executes from a partially downloaded
# script when piped through bash
main "$@"
