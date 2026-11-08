#!/usr/bin/env bash
# Descarga el arte generado y lo convierte a JPG ligero. Uso: bash game/assets/fetch-art.sh
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p portraits scenes
grep -v '^#' art-urls.txt | while read -r dest url; do
  [ -z "$dest" ] && continue
  curl -sSf -o "$dest" "$url" && echo "ok $dest"
done
