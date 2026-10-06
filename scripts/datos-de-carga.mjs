// DATOS FICTICIOS DE CARGA (T-006). Para medir el rendimiento de listados, búsqueda y ránking con volumen.
// Uso:  DATABASE_URL=postgresql://…@localhost:…/base_de_pruebas node scripts/datos-de-carga.mjs [--limpiar] [--pequeno]
//   (sin opciones)  genera 100 000 fichas, 5 000 veladas, 300 000 combates y 1 000 000 de auras, todo con el prefijo «carga-»
//   --pequeno       genera una décima parte (para probar el script)
//   --limpiar       borra únicamente lo que lleva el prefijo «carga-» (y no genera nada)
// Solo funciona en una base de datos local. Es determinista: la misma ejecución produce siempre los mismos datos.
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const url = process.env.DATABASE_URL ?? "";
if (process.env.NODE_ENV === "production" || !/@(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/.test(url)) {
  console.error("Este script solo se ejecuta contra una base de datos local (nunca en producción ni en Render).");
  process.exit(1);
}

const pequeno = process.argv.includes("--pequeno");
const f = pequeno ? 10 : 1;
const N = { peleadores: 100_000 / f, veladas: 5_000 / f, combates: 300_000 / f, usuarios: 20_000 / f, auras: 1_000_000 / f };
const BLOQUE = 5_000;
const DIA = 864e5;

const NOMBRES = ["Adrián", "Alba", "Álvaro", "Carmen", "Daniel", "Elena", "Hugo", "Irene", "Javier", "Lucía", "Marcos", "Nuria", "Pablo", "Sara", "Tomás", "Vera"];
const APELLIDOS = ["Abad", "Bravo", "Cano", "Díaz", "Esteban", "Ferrer", "Gil", "Herrero", "Ibáñez", "Jurado", "Lara", "Molina", "Núñez", "Ortega", "Prieto", "Rubio", "Soler", "Vidal"];
const PROVINCIAS = ["Madrid", "Barcelona", "Valencia", "Sevilla", "Zaragoza", "Málaga", "Murcia", "Vizcaya", "Alicante", "Cádiz", "Coruña (A)", "Asturias", "Las Palmas", "Granada", "Pontevedra"];
const DISCIPLINAS = ["BOXEO", "MMA", "MUAYTHAI", "KICKBOXING", "K1", "JIUJITSU"];
const NIVELES = ["AMATEUR", "PRO"];
const PESOS = ["M57", "M63", "M70", "M75", "M81", "M91"];
const RESULTADOS = ["A_WIN", "B_WIN", "DRAW", "A_WIN", "B_WIN"];
const METODOS = ["KO", "TKO", "UD", "SD", "POINTS"];
const VERIFICACIONES = ["SELF_REPORTED", "CONFIRMED", "VERIFIED"];

// Generador pseudoaleatorio con semilla fija (mulberry32).
let semilla = 20261006;
const azar = () => { semilla |= 0; semilla = (semilla + 0x6d2b79f5) | 0; let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const elige = (lista) => lista[Math.floor(azar() * lista.length)];

// Pareja del combate i. Si i supera el número de peleadores, el rival se desplaza para no repetir el mismo enfrentamiento.
const pareja = (i) => { const k = Math.floor(i / N.peleadores); const a = (i * 7) % N.peleadores; let b = (i * 13 + 1 + k * 17) % N.peleadores; if (b === a) b = (b + 1) % N.peleadores; return [a, b]; };

async function enBloques(total, crear, insertar, etiqueta) {
  const t0 = Date.now();
  for (let desde = 0; desde < total; desde += BLOQUE) {
    const filas = [];
    for (let i = desde; i < Math.min(total, desde + BLOQUE); i++) filas.push(crear(i));
    await insertar(filas);
  }
  console.log(`${etiqueta}: ${total.toLocaleString("es-ES")} en ${((Date.now() - t0) / 1000).toFixed(1)} s`);
}

async function limpiar() {
  // El orden respeta las claves ajenas; todo lo generado lleva el prefijo «carga-» en su identificador.
  const antes = Date.now();
  await db.$executeRaw`DELETE FROM "Aura" WHERE id LIKE 'carga-%'`;
  await db.$executeRaw`DELETE FROM "Bout" WHERE id LIKE 'carga-%'`;
  await db.$executeRaw`DELETE FROM "Event" WHERE id LIKE 'carga-%'`;
  await db.$executeRaw`DELETE FROM "FighterDiscipline" WHERE "fighterId" LIKE 'carga-%'`;
  await db.$executeRaw`DELETE FROM "Fighter" WHERE id LIKE 'carga-%'`;
  await db.$executeRaw`DELETE FROM "User" WHERE id LIKE 'carga-%'`;
  console.log(`Datos de carga borrados en ${((Date.now() - antes) / 1000).toFixed(1)} s`);
}

async function generar() {
  if (await db.fighter.count({ where: { id: { startsWith: "carga-" } } })) throw new Error("Ya hay datos de carga: ejecuta antes con --limpiar.");
  const base = Date.now();

  await enBloques(N.usuarios, (i) => ({ id: `carga-u-${i}`, email: `carga-${i}@ejemplo.invalid`, name: `Usuario carga ${i}`, passwordHash: "carga-no-valido", role: "FAN", emailVerifiedAt: new Date(base) }), (data) => db.user.createMany({ data }), "Usuarios");

  await enBloques(N.peleadores, (i) => ({
    id: `carga-f-${i}`, slug: `carga-peleador-${i}`, firstName: elige(NOMBRES), lastName: `${elige(APELLIDOS)} ${elige(APELLIDOS)}`,
    province: elige(PROVINCIAS), city: elige(PROVINCIAS), level: elige(NIVELES), listed: azar() > 0.02, createdAt: new Date(base - Math.floor(azar() * 900) * DIA),
  }), (data) => db.fighter.createMany({ data }), "Peleadores");

  const disciplinaDe = (i) => DISCIPLINAS[i % DISCIPLINAS.length];
  await enBloques(N.peleadores, (i) => ({ fighterId: `carga-f-${i}`, discipline: disciplinaDe(i), level: elige(NIVELES), weightClass: elige(PESOS), priorTotal: Math.floor(azar() * 20), priorWins: Math.floor(azar() * 10), priorLosses: Math.floor(azar() * 5), priorDraws: 0 }), (data) => db.fighterDiscipline.createMany({ data }), "Disciplinas");

  await enBloques(N.veladas, (i) => ({
    id: `carga-e-${i}`, slug: `carga-velada-${i}`, name: `Velada de carga ${i}`, date: new Date(base + (Math.floor(azar() * 1200) - 900) * DIA),
    discipline: DISCIPLINAS[i % DISCIPLINAS.length], level: elige(NIVELES), venue: "Recinto de carga", city: elige(PROVINCIAS), province: elige(PROVINCIAS), status: "COMPLETED",
  }), (data) => db.event.createMany({ data }), "Veladas");

  const porVelada = N.combates / N.veladas; // combates consecutivos llenan una velada: así no se repite una pareja dentro de ella
  // Cada combate enfrenta a dos peleadores distintos; la pareja canónica (ids ordenados) es única por velada.
  await enBloques(N.combates, (i) => {
    const [a, b] = pareja(i);
    const [x, y] = [`carga-f-${a}`, `carga-f-${b}`].sort();
    return { id: `carga-b-${i}`, eventId: `carga-e-${Math.floor(i / porVelada)}`, order: i % porVelada, fighterAId: `carga-f-${a}`, fighterBId: `carga-f-${b}`, pairKey: `${x}|${y}`, weightClass: elige(PESOS), result: elige(RESULTADOS), method: elige(METODOS), verification: elige(VERIFICACIONES) };
  }, (data) => db.bout.createMany({ data }), "Combates");

  // Aura: (usuario, combate, peleador) es único. Para cada combate, k = 0.. da usuarios distintos.
  await enBloques(N.auras, (i) => {
    const b = i % N.combates, k = Math.floor(i / N.combates);
    const [a, c] = pareja(b);
    return { id: `carga-a-${i}`, userId: `carga-u-${(b * 13 + k * 101) % N.usuarios}`, boutId: `carga-b-${b}`, fighterId: `carga-f-${k % 2 === 0 ? a : c}`, attended: azar() > 0.7, createdAt: new Date(base - Math.floor(azar() * 120) * DIA) };
  }, (data) => db.aura.createMany({ data, skipDuplicates: true }), "Auras");
}

try {
  if (process.argv.includes("--limpiar")) await limpiar(); else await generar();
} finally {
  await db.$disconnect();
}
