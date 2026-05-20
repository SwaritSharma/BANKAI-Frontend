#!/bin/sh
set -e

# ── Generate runtime env-config.js with hardcoded backend URL ──

cat <<EOF > /usr/share/nginx/html/env-config.js
window.__env__ = {
  REACT_APP_BACKEND_URL: "http://65.2.183.244:8081",
};
EOF

echo "✓ env-config.js generated with REACT_APP_BACKEND_URL=http://65.2.183.244:8081"

# Hand off to nginx (or whatever CMD was passed)
exec "$@"
