// DATOS FICTICIOS de demostración. No corresponden a personas, gimnasios ni veladas reales.
import { PrismaClient, type Discipline, type Method, type Result } from "@prisma/client";
import { slugify } from "../src/lib/common/labels";

const db = new PrismaClient();
const day = 864e5;

/**
 * El seed BORRA fichas, combates, veladas, gimnasios y auras para cargar datos de demostración.
 * Por eso no se ejecuta contra una base de datos real por accidente (por ejemplo con `prisma migrate reset`):
 * solo corre si la base es local y está vacía de personas usuarias, o si se confirma expresamente con SEED_CONFIRMAR=si.
 */
async function comprobarQueEsSeguro() {
  if (process.env.SEED_CONFIRMAR === "si") return;
  const url = process.env.DATABASE_URL ?? "";
  const local = /@(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/.test(url);
  if (process.env.NODE_ENV === "production" || !local) {
    throw new Error("El seed borra datos y esta base de datos no parece local (o es producción). Si de verdad quieres cargarlo aquí, ejecuta con SEED_CONFIRMAR=si.");
  }
  const usuarios = await db.user.count();
  if (usuarios > 0) {
    throw new Error(`La base de datos tiene ${usuarios} cuentas: el seed borraría sus fichas y combates. Si es una base de pruebas y quieres seguir, ejecuta con SEED_CONFIRMAR=si.`);
  }
}

async function main() {
  await comprobarQueEsSeguro();
  await db.aura.deleteMany();
  await db.bout.deleteMany();
  await db.event.deleteMany();
  await db.fighter.deleteMany();
  await db.trainer.deleteMany();
  await db.gym.deleteMany();

  const gyms = await Promise.all(
    [
      ["Gimnasio Demo Norte", "Bilbao", "Bizkaia"],
      ["Club Demo Vallecas", "Madrid", "Madrid"],
      ["Boxing Demo Sevilla", "Sevilla", "Sevilla"],
    ].map(([name, city, province]) => db.gym.create({ data: { name, city, province, slug: slugify(name) } })),
  );
  const trainers = await Promise.all(
    ["Entrenador Demo Uno", "Entrenador Demo Dos", "Entrenador Demo Tres"].map((name, i) =>
      db.trainer.create({ data: { name, slug: slugify(name), gymId: gyms[i].id } }),
    ),
  );
  const names: [string, string, string | null, "PRO" | "AMATEUR", string, number, Discipline][] = [
    ["Álvaro", "Demo Ruiz", "El Toro", "PRO", "Ligero", 0, "BOXEO"],
    ["Iker", "Demo Etxeberria", null, "PRO", "Ligero", 0, "BOXEO"],
    ["Sergio", "Demo Molina", "Puño de Hierro", "AMATEUR", "M65", 1, "BOXEO"],
    ["Hugo", "Demo Santos", null, "AMATEUR", "M65", 1, "BOXEO"],
    ["Marcos", "Demo Ortega", "Rayo", "AMATEUR", "M60", 2, "BOXEO"],
    ["Daniel", "Demo Vega", null, "PRO", "Pluma", 2, "BOXEO"],
    ["Nico", "Demo Bravo", null, "AMATEUR", "Ligero", 1, "MMA"],
    ["Ismael", "Demo Cano", "El Cerrojo", "AMATEUR", "Ligero", 1, "MMA"],
  ];
  const fighters: Awaited<ReturnType<typeof db.fighter.create>>[] = [];
  for (const [firstName, lastName, alias, level, weightClass, g, discipline] of names) {
    fighters.push(await db.fighter.create({ data: {
      firstName, lastName, alias, level, stance: discipline === "BOXEO" ? "ORTODOXO" : undefined,
      disciplines: { create: { discipline, level, weightClass } },
      slug: slugify(`${firstName} ${lastName}`), city: gyms[g].city, province: gyms[g].province,
      gymId: gyms[g].id, trainerId: trainers[g].id, heightCm: 175, birthDate: new Date("2000-05-01"),
    } }));
  }

  const now = Date.now();
  const mkEvent = (name: string, offset: number, level: "PRO" | "AMATEUR", city: string, province: string, venue: string, discipline: Discipline = "BOXEO") =>
    db.event.create({ data: {
      name, slug: slugify(name), date: new Date(now + offset * day), discipline, level, city, province, venue,
      status: offset < 0 ? "COMPLETED" : "SCHEDULED",
    } });
  const [past1, past2, next1, next2, mma1] = await Promise.all([
    mkEvent("Velada Demo Profesional I", -60, "PRO", "Bilbao", "Bizkaia", "Pabellón Demo"),
    mkEvent("Velada Demo Amateur I", -30, "AMATEUR", "Madrid", "Madrid", "Polideportivo Demo"),
    mkEvent("Gran Velada Demo de Otoño", 21, "PRO", "Sevilla", "Sevilla", "Palacio Demo"),
    mkEvent("Copa Demo Amateur", 35, "AMATEUR", "Madrid", "Madrid", "Polideportivo Demo"),
    mkEvent("Velada MMA Demo Madrid", -15, "AMATEUR", "Madrid", "Madrid", "Pabellón Demo Sur", "MMA"),
  ]);
  const bout = (eventId: string, a: number, b: number, order: number, weightClass: string, result?: Result, method?: Method, endRound?: number) =>
    db.bout.create({ data: { eventId, fighterAId: fighters[a].id, fighterBId: fighters[b].id, order, weightClass, rounds: 6, result, method, endRound, verification: "VERIFIED" } });
  await bout(past1.id, 0, 1, 1, "Ligero", "A_WIN", "KO", 3);
  await bout(past2.id, 2, 3, 1, "M65", "B_WIN", "UD");
  await bout(next1.id, 0, 5, 1, "Ligero");
  await bout(next2.id, 2, 4, 1, "M65");
  await bout(mma1.id, 6, 7, 1, "Ligero", "A_WIN", "SUBMISSION", 2);
}

main().finally(() => db.$disconnect());
