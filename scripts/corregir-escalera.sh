#!/usr/bin/env bash
# Corrige la prueba «Escalera» de un asistente con las pruebas ocultas de la rama claude/clave-escalera.
# Uso: bash scripts/corregir-escalera.sh <ASISTENTE>      (CODEX, ANTIGRAVITY, COPILOT, OPENCODE)
#      bash scripts/corregir-escalera.sh --referencia     (comprueba la clave contra la solución de referencia)
# Solo lo usa el líder técnico: los aspirantes NO deben ejecutarlo ni leer esa rama.
set -euo pipefail
A="${1:?uso: bash scripts/corregir-escalera.sh <ASISTENTE>|--referencia}"
RAMA="claude/clave-escalera"
cd "$(git rev-parse --show-toplevel)"
git fetch -q origin "$RAMA"
DEST="docs/ingreso/.clave-temporal"
rm -rf "$DEST"; mkdir -p "$DEST"
trap 'rm -rf "$DEST"' EXIT
git archive "origin/$RAMA" docs/ingreso/escalera-clave | tar -x -C "$DEST" --strip-components=3
if [ "$A" = "--referencia" ]; then RUTA="$PWD/$DEST/referencia"; else RUTA="$PWD/docs/ingreso/$A/escalera"; fi
[ -d "$RUTA" ] || { echo "No existe $RUTA: el asistente no ha entregado la prueba." >&2; exit 2; }
RUTA_ENTREGA="$RUTA" ESCALERA_INCLUDE="$DEST/*.test.ts" npx vitest run --config scripts/vitest.escalera.config.mts --reporter=verbose
