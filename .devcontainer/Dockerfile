FROM mcr.microsoft.com/devcontainers/javascript-node:1-22-bookworm

USER root

ARG CODEX_CLI_VERSION=0.147.0

RUN npm install --global "@openai/codex@${CODEX_CLI_VERSION}" \
  && npm cache clean --force \
  && codex --version
