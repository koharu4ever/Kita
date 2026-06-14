#!/bin/sh
set -eu

echo "Running Payload migrations..."
./node_modules/.bin/payload migrate --use-swc

echo "Starting Next.js..."
exec node server.js
