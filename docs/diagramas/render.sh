#!/usr/bin/env bash
# Renderiza los diagramas Mermaid de docs/diagramas a SVG y PNG.
# Un diagrama que no compile aborta el script con codigo distinto de cero.
set -euo pipefail

cd "$(dirname "$0")"
mkdir -p out

for src in *.mmd; do
  name="${src%.mmd}"
  mmdc -i "$src" -o "out/${name}.svg" -b transparent -q
  mmdc -i "$src" -o "out/${name}.png" -b white -s 2 -q
  echo "ok  ${name}"
done
