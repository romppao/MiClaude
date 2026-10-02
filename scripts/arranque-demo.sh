#!/usr/bin/env bash
# Arranque de la copia de demostración alojada (Render): aplica las migraciones, carga los datos ficticios la primera vez y arranca el servidor.
# No se usa en una instalación real.
set -euo pipefail
cd "$(dirname "$0")/.."

export APP_URL="${APP_URL:-${RENDER_EXTERNAL_URL:-}}"
npx prisma migrate deploy

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
