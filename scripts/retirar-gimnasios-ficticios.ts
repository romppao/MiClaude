// Retira de la DEMO los gimnasios ficticios (isFictional) ahora que hay gimnasios reales. Petición del fundador (15-10-2026): «borra todos
// los demás gimnasios demo que había».
//
//   npx tsx scripts/retirar-gimnasios-ficticios.ts              → recuento: cuántos hay y cuántos peleadores y entrenadores los usan.
//   npx tsx scripts/retirar-gimnasios-ficticios.ts --aplicar    → los pasa a REMOVED. Solo con DEMO_MODE=si.
//
// No se borran: REMOVED los oculta en toda la app (gymIsPublic) sin romper los peleadores y entrenadores de prueba enlazados, y se
// deshace volviendo a poner status PUBLISHED. Los gimnasios reales (isFictional false) no se tocan.
import { PrismaClient } from "@prisma/client";

async function main() {
  const db = new PrismaClient();
  const aplicar = process.argv.includes("--aplicar");
  if (aplicar && process.env.DEMO_MODE !== "si") throw new Error("Solo en la demo (DEMO_MODE=si).");
  try {
    const where = { isFictional: true, status: { not: "REMOVED" as const } };
    const gyms = await db.gym.findMany({ where, select: { id: true, name: true, province: true, _count: { select: { fighters: true, trainers: true } } }, orderBy: { name: "asc" } });
    console.log(JSON.stringify({
      ficticios: gyms.length,
      peleadores: gyms.reduce((n, g) => n + g._count.fighters, 0),
      entrenadores: gyms.reduce((n, g) => n + g._count.trainers, 0),
      reales: await db.gym.count({ where: { isFictional: false, status: "PUBLISHED" } }),
      nombres: gyms.map((g) => `${g.name} (${g.province})`),
    }, null, 2));
    if (!aplicar) { console.log("Solo recuento: no se ha escrito nada."); return; }
    for (const g of gyms) {
      await db.gym.update({ where: { id: g.id }, data: { status: "REMOVED", reviewNote: "Gimnasio ficticio de la demo retirado al cargar los gimnasios reales (15-10-2026)." } });
      await db.auditLog.create({ data: { entity: "GYM", entityId: g.id, action: "GYM_FICTIONAL_REMOVED", after: { estado: "REMOVED" } } });
    }
    console.log(`Retirados: ${gyms.length}.`);
  } finally {
    await db.$disconnect();
  }
}

void main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
