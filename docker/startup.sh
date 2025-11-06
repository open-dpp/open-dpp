#!/bin/sh

set -e

# Check if required environment variables are set
if [ -z "$OPEN_DPP_URL" ]; then
    echo "ERROR: OPEN_DPP_URL environment variable is not set"
    exit 1
fi

if [ -z "$OPEN_DPP_FRONTEND_ROOT" ]; then
    echo "ERROR: OPEN_DPP_FRONTEND_ROOT environment variable is not set"
    exit 1
fi

if [ -z "$OPEN_DPP_BACKEND_MAIN" ]; then
    echo "ERROR: OPEN_DPP_BACKEND_MAIN environment variable is not set"
    exit 1
fi


# Default values if environment variables are not set
API_URL="${OPEN_DPP_URL}/api"
FILE_LOCATION="${OPEN_DPP_FRONTEND_ROOT}/config.json"

# Generate the runtime configuration file
cat > "${FILE_LOCATION}" <<EOF
{
  "API_URL": "${API_URL}"
}
EOF

echo "Runtime configuration generated:"
echo "API_URL: ${API_URL}"
echo "Config file written to: ${FILE_LOCATION}"

node "${OPEN_DPP_BACKEND_MAIN}"
