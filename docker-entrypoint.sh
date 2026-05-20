#!/bin/sh
set -e

# ── Generate runtime env-config.js from environment variables ──
# This replaces the placeholder env-config.js baked into the build,
# allowing the backend URL to be configured at container startup.

cat <<EOF > /usr/share/nginx/html/env-config.js
window.__env__ = {
  REACT_APP_BACKEND_URL: "${REACT_APP_BACKEND_URL:-}",
};
EOF

echo "✓ env-config.js generated with REACT_APP_BACKEND_URL=${REACT_APP_BACKEND_URL:-<not set>}"

# Hand off to nginx (or whatever CMD was passed)
exec "$@"
