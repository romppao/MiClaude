#!/usr/bin/env bash
# Entorno aislado: una base de datos propia + un servidor propio, para probar sin pisar a nadie
# (varias personas o varios agentes pueden trabajar a la vez, cada uno en el suyo).
#
#   scripts/entorno-aislado.sh iniciar <nombre> <puerto> [--semilla]   crea la base «ring_<nombre>», aplica las migraciones,
#                                                                      (opcional) carga los datos ficticios y arranca el servidor
#   scripts/entorno-aislado.sh parar   <nombre>                        detiene el servidor y borra la base «ring_<nombre>»
#
# Variables (todas opcionales):
#   ADMIN_DATABASE_URL  conexión con permiso para crear bases (por defecto postgresql://pgtest@localhost:5432/postgres)
#   RAIZ_APP            carpeta de la aplicación YA COMPILADA (npm run build); por defecto, este repositorio
# Al iniciar, imprime las variables que necesitan las pruebas de navegador (BASE_URL, DATABASE_URL, MAIL_LOG).
set -euo pipefail

accion="${1:-}"; nombre="${2:-}"; puerto="${3:-}"
[[ -n "$accion" && -n "$nombre" ]] || { sed -n '2,12p' "$0"; exit 1; }
[[ "$nombre" =~ ^[a-z0-9_]+$ ]] || { echo "El nombre solo puede llevar letras minúsculas, números y guion bajo." >&2; exit 1; }

ADMIN="${ADMIN_DATABASE_URL:-postgresql://pgtest@localhost:5432/postgres}"
RAIZ="${RAIZ_APP:-$(cd "$(dirname "$0")/.." && pwd)}"
BASE="ring_${nombre}"
URL_BD="${ADMIN%/*}/${BASE}"
PID="/tmp/ring-${nombre}.pid"
LOG="/tmp/ring-${nombre}.log"

case "$accion" in
  iniciar)
    [[ -n "$puerto" ]] || { echo "Falta el puerto." >&2; exit 1; }
    [[ -d "$RAIZ/.next" ]] || { echo "No hay compilación en $RAIZ/.next: ejecuta antes «npm run build»." >&2; exit 1; }
    "$0" parar "$nombre" >/dev/null 2>&1 || true
    psql "$ADMIN" -qc "CREATE DATABASE \"$BASE\"" >/dev/null
    (cd "$RAIZ" && DATABASE_URL="$URL_BD" npx prisma migrate deploy >/dev/null 2>&1)
    if [[ "${4:-}" == "--semilla" ]]; then (cd "$RAIZ" && DATABASE_URL="$URL_BD" npm run db:seed >/dev/null 2>&1); fi
    cd "$RAIZ"
    # El servidor se lanza con sus salidas redirigidas y sin entrada, para que no retenga la terminal ni el «$( … )» de quien nos llama.
    DATABASE_URL="$URL_BD" APP_URL="http://localhost:${puerto}" MAIL_TRANSPORT=log \
      setsid nohup node node_modules/next/dist/bin/next start -p "$puerto" >"$LOG" 2>&1 </dev/null &
    echo $! >"$PID"
    for _ in $(seq 1 40); do
      curl -fs "http://localhost:${puerto}/salud" >/dev/null 2>&1 && break
      sleep 0.5
    done
    curl -fs "http://localhost:${puerto}/salud" >/dev/null || { echo "El servidor no ha arrancado; mira $LOG" >&2; exit 1; }
    echo "export BASE_URL=http://localhost:${puerto} DATABASE_URL=${URL_BD} MAIL_LOG=${LOG}"
    ;;
  parar)
    if [[ -f "$PID" ]]; then kill "$(cat "$PID")" 2>/dev/null || true; rm -f "$PID"; fi
    psql "$ADMIN" -qc "DROP DATABASE IF EXISTS \"$BASE\" WITH (FORCE)" >/dev/null 2>&1 || true
    ;;
  *) sed -n '2,12p' "$0"; exit 1 ;;
esac
