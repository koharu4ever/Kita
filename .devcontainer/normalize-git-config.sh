#!/usr/bin/env bash

set -euo pipefail

if ! command -v git >/dev/null 2>&1; then
  exit 0
fi

while IFS= read -r safe_directory; do
  case "$safe_directory" in
    [A-Za-z]:/* | [A-Za-z]:\\*)
      git config --global --fixed-value --unset-all safe.directory "$safe_directory" || true
      ;;
  esac
done < <(git config --global --get-all safe.directory 2>/dev/null || true)
