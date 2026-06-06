#!/bin/zsh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${1:-8000}"
HOST="localhost"
URL="http://${HOST}:${PORT}/index.html"

cd "$ROOT_DIR"

if command -v python3 >/dev/null 2>&1; then
  exec python3 "$ROOT_DIR/tools/serve_site.py" --host "$HOST" --port "$PORT" --directory "$ROOT_DIR"
elif command -v php >/dev/null 2>&1; then
  echo "Serving $ROOT_DIR"
  echo "Open: $URL"
  echo "Press Ctrl+C to stop."
  php -S "${HOST}:${PORT}"
else
  echo "Neither python3 nor php is available on this Mac." >&2
  exit 1
fi
