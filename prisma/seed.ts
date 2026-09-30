// DATOS FICTICIOS de demostración. No corresponden a personas, gimnasios ni veladas reales.
import { PrismaClient, type Method, type Result } from "@prisma/client";
import { slugify } from "../src/lib/labels";

const db = new PrismaClient();
const day = 864e5;

async function main() {
  await db.bout.deleteMany();
  await db.event.deleteMany();
  await db.boxer.deleteMany();
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
  const names: [string, string, string | null, "PRO" | "AMATEUR", string, number][] = [
    ["Álvaro", "Demo Ruiz", "El Toro", "PRO", "Ligero", 0],
    ["Iker", "Demo Etxeberria", null, "PRO", "Ligero", 0],
    ["Sergio", "Demo Molina", "Puño de Hierro", "AMATEUR", "Wélter", 1],
    ["Hugo", "Demo Santos", null, "AMATEUR", "Wélter", 1],
    ["Marcos", "Demo Ortega", "Rayo", "AMATEUR", "Pluma", 2],
    ["Daniel", "Demo Vega", null, "PRO", "Pluma", 2],
  ];
  const boxers: Awaited<ReturnType<typeof db.boxer.create>>[] = [];
  for (const [firstName, lastName, alias, level, weightClass, g] of names) {
    boxers.push(await db.boxer.create({ data: {
      firstName, lastName, alias, level, weightClass, stance: "ORTODOXO",
      slug: slugify(`${firstName} ${lastName}`), city: gyms[g].city, province: gyms[g].province,
      gymId: gyms[g].id, trainerId: trainers[g].id, heightCm: 175, birthDate: new Date("2000-05-01"),
    } }));
  }

  const now = Date.now();
  const mkEvent = (name: string, offset: number, level: "PRO" | "AMATEUR", city: string, province: string, venue: string) =>
    db.event.create({ data: {
      name, slug: slugify(name), date: new Date(now + offset * day), level, city, province, venue,
      status: offset < 0 ? "COMPLETED" : "SCHEDULED",
    } });
  const [past1, past2, next1, next2] = await Promise.all([
    mkEvent("Velada Demo Profesional I", -60, "PRO", "Bilbao", "Bizkaia", "Pabellón Demo"),
    mkEvent("Velada Demo Amateur I", -30, "AMATEUR", "Madrid", "Madrid", "Polideportivo Demo"),
    mkEvent("Gran Velada Demo de Otoño", 21, "PRO", "Sevilla", "Sevilla", "Palacio Demo"),
    mkEvent("Copa Demo Amateur", 35, "AMATEUR", "Madrid", "Madrid", "Polideportivo Demo"),
  ]);
  const bout = (eventId: string, a: number, b: number, order: number, weightClass: string, result?: Result, method?: Method, endRound?: number) =>
    db.bout.create({ data: { eventId, boxerAId: boxers[a].id, boxerBId: boxers[b].id, order, weightClass, rounds: 6, result, method, endRound } });
  await bout(past1.id, 0, 1, 1, "Ligero", "A_WIN", "KO", 3);
  await bout(past2.id, 2, 3, 1, "Wélter", "B_WIN", "UD");
  await bout(next1.id, 0, 5, 1, "Ligero");
  await bout(next2.id, 2, 4, 1, "Wélter");
}

main().finally(() => db.$disconnect());
