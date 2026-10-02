#!/usr/bin/env bash
# Demo local de Ring España con datos ficticios, lista para probar en el navegador.
#
#   scripts/demo.sh iniciar                 prepara todo (instala, compila, crea la base con datos de ejemplo) y arranca en http://localhost:3000
#   scripts/demo.sh correos                 enseña los correos que «envía» la aplicación (en la demo no sale ninguno de verdad): ahí están los enlaces para confirmar el correo
#   scripts/demo.sh moderador <correo>      da el papel de moderador a una cuenta ya registrada (para probar la moderación y aprobar organizadores)
#   scripts/demo.sh parar                   detiene la demo y borra su base de datos
#
# Necesita Node 22 y un PostgreSQL 16. Si no tienes PostgreSQL pero sí Docker, el script lo arranca solo.
# Variables opcionales: PUERTO (3000), ADMIN_DATABASE_URL (conexión con permiso para crear bases).
set -euo pipefail
cd "$(dirname "$0")/.."

PUERTO="${PUERTO:-3000}"
NOMBRE="demo"
LOG="/tmp/ring-${NOMBRE}.log"
ADMIN="${ADMIN_DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/postgres}"
export ADMIN_DATABASE_URL="$ADMIN"
URL_BD="${ADMIN%/*}/ring_${NOMBRE}"

preparar_postgres() {
  command -v psql >/dev/null || { echo "Falta «psql» (cliente de PostgreSQL). Instálalo y vuelve a ejecutar." >&2; exit 1; }
  if ! psql "$ADMIN" -qc "select 1" >/dev/null 2>&1; then
    command -v docker >/dev/null || { echo "No hay un PostgreSQL accesible en $ADMIN y Docker no está instalado. Arranca un PostgreSQL 16 o define ADMIN_DATABASE_URL." >&2; exit 1; }
    echo "Arrancando un PostgreSQL con Docker (contenedor «ring-demo-pg»)…"
    docker start ring-demo-pg >/dev/null 2>&1 || docker run --name ring-demo-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16 >/dev/null
    for _ in $(seq 1 30); do psql "$ADMIN" -qc "select 1" >/dev/null 2>&1 && break; sleep 1; done
    psql "$ADMIN" -qc "select 1" >/dev/null 2>&1 || { echo "PostgreSQL no responde." >&2; exit 1; }
  fi
}

case "${1:-}" in
  iniciar)
    preparar_postgres
    [[ -d node_modules ]] || npm ci
    # Se recompila siempre: así la demo refleja el código actual.
    npm run build
    bash scripts/entorno-aislado.sh iniciar "$NOMBRE" "$PUERTO" --semilla >/dev/null
    cat <<TXT

  ✓ La demo está en marcha:  http://localhost:${PUERTO}

  Qué hay:  8 peleadores ficticios, 3 gimnasios, veladas y combates de ejemplo (todo inventado, nada es real).
  Para probar con tu propia cuenta:
    1. Regístrate en http://localhost:${PUERTO}/registro (elige «peleador» si quieres crear tu ficha).
    2. Confirma el correo: la demo no envía correos de verdad. Ejecuta  scripts/demo.sh correos  y abre el enlace «/verificar?token=…».
    3. Para probar la moderación: regístrate con otra cuenta y ejecuta  scripts/demo.sh moderador tu@correo.es
  Para terminar:  scripts/demo.sh parar
TXT
    ;;
  correos)
    [[ -f "$LOG" ]] || { echo "La demo no está en marcha (no hay $LOG)." >&2; exit 1; }
    grep -E "to=|https?://[^ ]+" "$LOG" | tail -40
    ;;
  moderador)
    correo="${2:-}"; [[ "$correo" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+$ ]] || { echo "Uso: scripts/demo.sh moderador <correo de una cuenta ya registrada>" >&2; exit 1; }
    n=$(psql "$URL_BD" -tAc "update \"User\" set role='ADMIN' where email='${correo}' returning 1" | wc -l)
    [[ "$n" -ge 1 ]] && echo "✓ ${correo} ahora es moderador. Cierra sesión y vuelve a entrar; verás «Moderación» en el menú." || echo "No hay ninguna cuenta con el correo ${correo}. Regístrala primero." >&2
    ;;
  parar)
    bash scripts/entorno-aislado.sh parar "$NOMBRE"
    echo "Demo detenida y base de datos borrada."
    ;;
  *) sed -n '2,10p' "$0"; exit 1 ;;
esac
