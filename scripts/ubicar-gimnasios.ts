// Ubica en el mapa, de una vez, los gimnasios publicados que aún no tienen coordenadas (lib/common/geo.ts). En la app se hace poco a
// poco (5 por visita a /gimnasios); tras una carga grande, el fundador vio el mapa sin calles (15-10-2026). Una consulta por segundo a
// Nominatim, como piden sus normas: unos 2 minutos por cada 100 gimnasios.
//
//   npx tsx scripts/ubicar-gimnasios.ts    → ubica los pendientes y dice cuántos quedaron por dirección, por ciudad o sin encontrar.
import { db } from "../src/lib/common/db";
import { ubicarPendientes } from "../src/lib/common/geo";

async function main() {
  try {
    for (let vuelta = 0; vuelta < 100; vuelta++) {
      const antes = await db.gym.count({ where: { status: "PUBLISHED", geocodedAt: null } });
      if (!antes) break;
      await ubicarPendientes(20);
      if ((await db.gym.count({ where: { status: "PUBLISHED", geocodedAt: null } })) === antes) break;
    }
    const porOrigen = await db.gym.groupBy({ by: ["geoSource"], where: { status: "PUBLISHED" }, _count: true });
    console.log(JSON.stringify(Object.fromEntries(porOrigen.map((g) => [g.geoSource ?? "sin ubicar", g._count])), null, 2));
  } finally {
    await db.$disconnect();
  }
}

void main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
