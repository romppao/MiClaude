#!/usr/bin/env bash
# Arranque de la copia de demostración alojada (Render): aplica las migraciones, carga los datos ficticios la primera vez y arranca el servidor.
# No se usa en una instalación real.
set -euo pipefail
cd "$(dirname "$0")/.."

export APP_URL="${APP_URL:-${RENDER_EXTERNAL_URL:-}}"
# Migraciones por la conexión directa de Neon (el mismo servidor sin «-pooler»). El «pooler» (PgBouncer) deja colgado el bloqueo de sesión que Prisma
# usa para migrar y el arranque fallaba con P1002 «Timed out trying to acquire a postgres advisory lock» (Render, 17-10-2026: fallaron los despliegues
# de la 0.21.0, 0.22.0, 0.22.1, 0.22.2 y 0.23.1). Solo se cambia el nombre del servidor (lo que va tras la «@»), nunca la contraseña; la aplicación
# sigue usando DATABASE_URL tal cual.
URL_DIRECTA=$(printf '%s' "$DATABASE_URL" | sed -E 's#(@[^/?@]*)-pooler\.#\1.#')
if ! DATABASE_URL="$URL_DIRECTA" npx prisma migrate deploy; then
  # Si aun así hay un bloqueo colgado en el servidor (no se libera hasta que cierre la sesión que lo tiene), se reintenta una vez sin el bloqueo
  # de Prisma. Es seguro mientras no arranquen dos instancias a la vez, que en esta demo no ocurre; el reintento deja constancia en el registro.
  echo "migrate deploy falló con bloqueo: reintento una vez sin el bloqueo de sesión de Prisma…"
  DATABASE_URL="$URL_DIRECTA" PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK=1 npx prisma migrate deploy
fi

# Datos de ejemplo solo si la base está vacía (así un reinicio no borra lo que se haya probado).
vacia=$(node -e '
  const { PrismaClient } = require("@prisma/client");
  const db = new PrismaClient();
  Promise.all([db.user.count(), db.fighter.count()]).then(([u, f]) => { console.log(u === 0 && f === 0 ? "si" : "no"); return db.$disconnect(); });
')
if [[ "$vacia" == "si" ]]; then
  echo "Base vacía: cargando datos ficticios de demostración…"
  SEED_CONFIRMAR=si npx tsx prisma/seed.ts
fi

exec npm start
