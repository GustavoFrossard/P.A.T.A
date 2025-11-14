#!/bin/sh
set -e

echo "[entrypoint] checking node_modules and vite..."
echo "[entrypoint] installing dependencies (npm ci) to ensure vite is available..."
# Always run npm ci at container start for dev (keeps container robust when bind-mounts hide image node_modules)
if [ -f package-lock.json ]; then
  npm ci --no-audit --prefer-offline || npm install --no-audit --prefer-offline
else
  npm install --no-audit --prefer-offline
fi

echo "[entrypoint] dependencies installed"

echo "[entrypoint] starting dev server"
exec npm run dev -- --host
