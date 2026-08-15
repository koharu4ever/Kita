FROM mcr.microsoft.com/devcontainers/javascript-node:1-22-bookworm

USER root

ARG CODEX_CLI_VERSION=0.147.0

RUN apt-get update \
  && apt-get install --yes --no-install-recommends bubblewrap \
  && rm -rf /var/lib/apt/lists/*

RUN npm install --global "@openai/codex@${CODEX_CLI_VERSION}" \
  && npm cache clean --force \
  && codex --version \
  && bwrap --version
