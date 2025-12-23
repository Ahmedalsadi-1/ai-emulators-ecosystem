#!/bin/bash

# Script to connect gbox container to Genymotion emulator on host

# Default Genymotion ADB port is usually 5555 for the first device
PORT=${1:-5555}
HOST="host.docker.internal"

echo "Connecting Gbox to Genymotion at $HOST:$PORT..."

docker exec future-app-gbox-1 adb connect $HOST:$PORT

echo "Current ADB devices in Gbox:"
docker exec future-app-gbox-1 adb devices
