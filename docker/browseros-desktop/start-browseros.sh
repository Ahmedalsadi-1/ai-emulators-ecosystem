#!/bin/bash
set -e

if ps aux | grep -q '[B]rowserOS.AppImage'; then
  exit 0
fi

export DISPLAY="${DISPLAY:-:2}"
export APPIMAGE_EXTRACT_AND_RUN=1

/opt/browseros/BrowserOS.AppImage --no-sandbox --start-fullscreen
