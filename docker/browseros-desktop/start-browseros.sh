#!/bin/bash
set -e

if pgrep -f "[c]hromium" >/dev/null 2>&1; then
  exit 0
fi

export DISPLAY="${DISPLAY:-:2}"

browser_cmd="$(command -v chromium || command -v chromium-browser || true)"
if [ -z "${browser_cmd}" ]; then
  echo "Chromium is not installed." >&2
  exit 1
fi

"${browser_cmd}" \
  --no-sandbox \
  --disable-dev-shm-usage \
  --disable-gpu \
  --no-first-run \
  --start-fullscreen \
  --user-data-dir=/root/.config/chromium \
  "https://browseros.com"
