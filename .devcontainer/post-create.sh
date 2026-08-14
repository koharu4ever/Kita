#!/usr/bin/env bash

set -euo pipefail

: "${CODEX_HOME:=/home/node/.codex}"

sudo corepack enable
sudo chown node:node node_modules .next
sudo chown -R node:node "$CODEX_HOME"
chmod 0700 "$CODEX_HOME"

if [[ ! -f "$CODEX_HOME/config.toml" ]]; then
  umask 077
  install -m 0600 .devcontainer/codex-config.toml "$CODEX_HOME/config.toml"
fi

pnpm install --frozen-lockfile
