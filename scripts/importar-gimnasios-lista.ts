// Carga en la DEMO la lista de clubes de deportes de contacto investigada a mano (docs/datos/gimnasios-investigados.json).
// Petición del fundador (15-10-2026): «los gimnasios de la vida real… todos los perfiles de clubes de boxeo, de jiu-jitsu, de muay thai…
// solo gimnasios de deportes de contacto». Complementa al importador de OpenStreetMap (importar-gimnasios-osm.mjs).
//
//   npx tsx scripts/importar-gimnasios-lista.ts              → recuento: qué se crearía, qué ya existe y qué se descarta. No escribe nada.
//   npx tsx scripts/importar-gimnasios-lista.ts --aplicar    → lo carga. Solo con DEMO_MODE=si (nunca en la versión real sin el fundador).
//
// Reglas: nunca toca un gimnasio que ya exista con el mismo nombre en la misma provincia (ni reclamados ni corregidos); descarta Cataluña;
// confianza «alta» se publica y «media» queda «por revisar» en moderación. Cada ficha guarda en reviewNote la fuente que la confirma.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient, type Discipline } from "@prisma/client";
import { gymNameKey } from "../src/lib/common/gym-osm";
import { excludedGymProvince } from "../src/lib/common/gym-policy";
import { PROVINCES, slugName } from "../src/lib/common/labels";

type Fila = { name: string; city: string; province: string; address?: string | null; disciplines: string[]; website?: string | null; instagram?: string | null; source: string; confidence?: string };

const DISCIPLINAS: Discipline[] = ["BOXEO", "MMA", "MUAYTHAI", "KICKBOXING", "K1", "JIUJITSU"];
const web = (raw: string | null | undefined, instagram = false) => {
  try {
    const u = new URL(raw ?? "");
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    if (instagram && !["instagram.com", "www.instagram.com"].includes(u.hostname)) return null;
    return u.href;
  } catch { return null; }
};

/** Comprueba y normaliza una fila. Devuelve el motivo si se descarta. */
export function prepararFila(f: Fila): { ok: true; datos: { name: string; city: string; province: string; address: string | null; disciplines: Discipline[]; website: string | null; instagram: string | null; fuente: string; publicar: boolean } } | { ok: false; motivo: string } {
  const name = (f.name ?? "").replace(/\s+/g, " ").trim().slice(0, 150);
  const city = (f.city ?? "").replace(/\s+/g, " ").trim().slice(0, 100);
  if (!name || !city) return { ok: false, motivo: "sin nombre o ciudad" };
  if (!(PROVINCES as readonly string[]).includes(f.province)) return { ok: false, motivo: `provincia desconocida: ${f.province}` };
  if (excludedGymProvince(f.province)) return { ok: false, motivo: "provincia excluida (Cataluña)" };
  const disciplines = DISCIPLINAS.filter((d) => f.disciplines?.includes(d));
  if (!disciplines.length) return { ok: false, motivo: "sin disciplinas de contacto" };
  const fuente = web(f.source);
  if (!fuente) return { ok: false, motivo: "sin fuente que lo confirme" };
  return { ok: true, datos: { name, city, province: f.province, address: f.address?.trim().slice(0, 200) || null, disciplines, website: web(f.website), instagram: web(f.instagram, true), fuente, publicar: f.confidence === "alta" } };
}

async function main() {
  const aplicar = process.argv.includes("--aplicar");
  if (aplicar && process.env.DEMO_MODE !== "si") throw new Error("La carga solo se hace en la demo (DEMO_MODE=si). En la versión real, primero el fundador.");
  const filas: Fila[] = JSON.parse(readFileSync(resolve(process.cwd(), "docs/datos/gimnasios-investigados.json"), "utf8"));
  const db = new PrismaClient();
  const existentes = await db.gym.findMany({ select: { name: true, province: true } });
  const yaEstan = new Set(existentes.map((g) => `${gymNameKey(g.name)}|${g.province}`));
  const recuento = { crear: 0, publicados: 0, porRevisar: 0, yaExisten: 0, descartados: 0, provincias: {} as Record<string, number>, motivos: {} as Record<string, number> };
  for (const fila of filas) {
    const p = prepararFila(fila);
    if (!p.ok) { recuento.descartados++; recuento.motivos[p.motivo] = (recuento.motivos[p.motivo] ?? 0) + 1; continue; }
    const clave = `${gymNameKey(p.datos.name)}|${p.datos.province}`;
    if (yaEstan.has(clave)) { recuento.yaExisten++; continue; }
    yaEstan.add(clave);
    recuento.crear++; recuento[p.datos.publicar ? "publicados" : "porRevisar"]++;
    recuento.provincias[p.datos.province] = (recuento.provincias[p.datos.province] ?? 0) + 1;
    if (!aplicar) continue;
    let slug = slugName(p.datos.name, p.datos.city);
    for (let n = 2; await db.gym.findUnique({ where: { slug }, select: { id: true } }); n++) slug = `${slugName(p.datos.name, p.datos.city)}-${n}`;
    const g = await db.gym.create({ data: { slug, name: p.datos.name, city: p.datos.city, province: p.datos.province, address: p.datos.address, disciplines: p.datos.disciplines, website: p.datos.website, instagram: p.datos.instagram, source: "MANUAL", status: p.datos.publicar ? "PUBLISHED" : "PENDING", reviewNote: `Investigado por Claude el 15-10-2026. Fuente: ${p.datos.fuente}`, importedAt: new Date() } });
    await db.auditLog.create({ data: { entity: "GYM", entityId: g.id, action: "GYM_IMPORTED_LIST", after: { fuente: p.datos.fuente, estado: g.status } } });
  }
  await db.$disconnect();
  console.log(JSON.stringify(recuento, null, 2));
  console.log(aplicar ? "Carga hecha en la demo." : "Solo recuento: no se ha escrito nada.");
}

if (process.argv[1]?.endsWith("importar-gimnasios-lista.ts")) void main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
