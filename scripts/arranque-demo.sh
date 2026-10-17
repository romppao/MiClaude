#!/usr/bin/env bash
# Arranque de la copia de demostración alojada (Render): aplica las migraciones, carga los datos ficticios la primera vez y arranca el servidor.
# No se usa en una instalación real.
set -euo pipefail
cd "$(dirname "$0")/.."

export APP_URL="${APP_URL:-${RENDER_EXTERNAL_URL:-}}"
# Las migraciones van por la conexión directa de Neon (sin «-pooler») y sin el bloqueo de sesión de Prisma. El «pooler» (PgBouncer) deja colgado
# ese bloqueo y el arranque fallaba con P1002 «Timed out trying to acquire a postgres advisory lock» (Render, 17-10-2026: fallaron los despliegues
# de la 0.21.0, 0.22.0, 0.22.1, 0.22.2 y 0.23.1). En la demo solo arranca una instancia, así que no hay migraciones concurrentes que el bloqueo evite.
# La aplicación sigue usando DATABASE_URL tal cual (con «pooler»).
DATABASE_URL="${DATABASE_URL/-pooler./.}" PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK=1 npx prisma migrate deploy

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
