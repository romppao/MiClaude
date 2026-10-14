// Importación manual y reproducible de gimnasios. Por defecto solo descarga y prepara un recuento; nunca carga el seed.
// Node 22 con --experimental-strip-types. Fuentes y operación: docs/GIMNASIOS-REALES.md.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { osmGymCandidate, osmProvince, osmAreaProvince, gymNameKey } from "../src/lib/common/gym-osm.ts";
import { excludedGymProvince, gymDistanceMetres, osmMayUpdate } from "../src/lib/common/gym-policy.ts";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const args = process.argv.slice(2);
const value = (key, fallback) => { const i = args.indexOf(key); return i < 0 ? fallback : args[i + 1]; };
const directory = resolve(root, value("--salida", "docs/logs/gimnasios-osm"));
const sha = (data) => createHash("sha256").update(JSON.stringify(data)).digest("hex");
const planHash = (p) => sha({ candidates: p.candidates, counts: p.counts, rawHash: p.rawHash, compared: p.compared, target: p.target ?? null });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const provinces = [...readFileSync(join(root, "src/lib/common/labels.ts"), "utf8").match(/export const PROVINCES = \[([\s\S]*?)\]/)[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
const permitted = new Set(["--salida", "--entrada", "--plan", "--aplicar", "--demo", "--real", "--comparar-base"]);
for (let i = 0; i < args.length; i++) {
  if (!permitted.has(args[i])) throw new Error(`Opción no admitida: ${args[i]}`);
  if (["--salida", "--entrada", "--plan"].includes(args[i])) { if (!args[++i] || args[i].startsWith("--")) throw new Error("Falta la ruta de un argumento"); }
}
if (existsSync(join(root, ".env"))) process.loadEnvFile(join(root, ".env"));
const targetFingerprint = () => {
  const url = new URL(process.env.DATABASE_URL ?? "");
  return sha({ host: url.host, database: url.pathname }); // sin nombre de usuario, contraseña ni URL en el recuento
};
const apply = args.includes("--aplicar"), compare = args.includes("--comparar-base") || apply;
const real = args.includes("--real"), demo = args.includes("--demo");
if (compare && real === demo) throw new Error("Indica un único destino --demo o --real antes de consultar una base");
if (apply && !args.includes("--plan")) throw new Error("Primero prepara y revisa un plan; --aplicar requiere --plan");
if (apply && real && process.env.IMPORTAR_EN_REAL !== "si") throw new Error("Carga real bloqueada: requiere IMPORTAR_EN_REAL=si después de mostrar el recuento al fundador");
if (compare && demo && process.env.DEMO_MODE !== "si") throw new Error("El destino demo exige DEMO_MODE=si; no se escribe en una base real por defecto");
mkdirSync(directory, { recursive: true });

const endpoint = process.env.OSM_OVERPASS_URL ?? "https://overpass-api.de/api/interpreter";
if (!endpoint.startsWith("https://")) throw new Error("El endpoint OSM debe usar HTTPS");
const agent = "Lona-directorio/1.0 (https://lonaclub.es; importación manual ODbL)";
async function overpass(query) {
  const res = await fetch(endpoint, { method: "POST", headers: { "User-Agent": agent, "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ data: query }), signal: AbortSignal.timeout(100000) });
  if (!res.ok) throw new Error(`Overpass respondió ${res.status}; no se ha cargado ningún gimnasio`);
  const data = await res.json();
  if (!Array.isArray(data.elements) || data.remark) throw new Error("Respuesta OSM incompleta; conservar el plan anterior y repetir más tarde");
  return data;
}
const query = `[out:json][timeout:90];area["ISO3166-1"="ES"]["admin_level"="2"]->.spain;
(nwr(area.spain)["sport"~"boxing|kickboxing|muay|mixed_martial|brazilian_jiu|jiu.jitsu|grappling|martial_arts",i];
nwr(area.spain)["martial_art"];nwr(area.spain)["martial_arts"];
nwr(area.spain)["leisure"~"^(fitness_centre|sports_centre|dojo)$"]["name"~"boxeo|boxing|MMA|jiu|BJJ|K.?1|kick|muay|marcial|dojo",i];);out center tags;`;
let cache = {};
const cachePath = join(directory, "provincias-coordenadas.json");
if (existsSync(cachePath)) cache = JSON.parse(readFileSync(cachePath, "utf8"));
/** Áreas administrativas OSM que contienen el punto: evita geocodificación masiva con Nominatim. Consulta solo puntos del listado y conserva caché. */
async function byCoordinates(el) {
  const lat = el.lat ?? el.center?.lat, lng = el.lon ?? el.center?.lon;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
  if (Object.hasOwn(cache, key)) return cache[key];
  await sleep(1100);
  const areas = await overpass(`[out:json][timeout:30];is_in(${lat},${lng})->.a;area.a["boundary"="administrative"]["admin_level"~"^(4|6)$"];out tags;`);
  const province = osmAreaProvince(areas.elements, provinces);
  cache[key] = province; writeFileSync(cachePath, JSON.stringify(cache, null, 2) + "\n");
  return province;
}

let plan;
if (args.includes("--plan")) {
  plan = JSON.parse(readFileSync(resolve(root, value("--plan")), "utf8"));
  if (plan.hash !== planHash(plan)) throw new Error("El plan ha cambiado: vuelve a preparar y presentar el recuento");
} else {
  const raw = args.includes("--entrada") ? JSON.parse(readFileSync(resolve(root, value("--entrada")), "utf8")) : await overpass(query);
  if (!Array.isArray(raw.elements)) throw new Error("Entrada OSM no válida");
  writeFileSync(join(directory, "fuente-osm.json"), JSON.stringify(raw, null, 2) + "\n");
  const candidates = [], counts = { provincias: {}, descartados: 0, sinProvincia: 0, porRevisar: 0, protegidos: 0, duplicados: 0 };
  const refs = new Set();
  for (const el of raw.elements) {
    const tags = el.tags ?? {};
    let province = osmProvince(tags["addr:province"] || tags["addr:state"] || "", provinces);
    if (!province) province = await byCoordinates(el);
    const candidate = osmGymCandidate(el, province, excludedGymProvince);
    if (!candidate || refs.has(candidate.sourceRef)) { counts.descartados++; continue; }
    refs.add(candidate.sourceRef); candidates.push(candidate);
  }
  plan = { createdAt: new Date().toISOString(), rawHash: sha(raw), candidates, counts, compared: false };
}

let db;
if (compare) {
  const { PrismaClient } = await import("@prisma/client"); db = new PrismaClient();
}
try {
  if (compare && !apply) {
    const existing = await db.gym.findMany({ select: { id: true, name: true, lat: true, lng: true, sourceRef: true, source: true, ownerUserId: true, verifiedAt: true } });
    plan.candidates = plan.candidates.filter((c) => {
      const old = existing.find((g) => g.sourceRef === c.sourceRef);
      if (old && !osmMayUpdate(old)) { plan.counts.protegidos++; return false; }
      const duplicate = existing.find((g) => g.sourceRef !== c.sourceRef && gymNameKey(g.name) === gymNameKey(c.name) && g.lat !== null && g.lng !== null && c.lat !== null && c.lng !== null && gymDistanceMetres(g, c) < 150);
      if (duplicate) { c.status = "PENDING"; c.reviewNote = `Posible duplicado de ${duplicate.id}; comprobar antes de publicar`; plan.counts.duplicados++; }
      return true;
    });
    plan.compared = true;
    plan.target = { kind: real ? "real" : "demo", fingerprint: targetFingerprint() };
  }
  if (!apply) {
    plan.counts.provincias = {}; plan.counts.sinProvincia = 0; plan.counts.porRevisar = 0;
    for (const c of plan.candidates) {
      if (c.status === "PENDING") plan.counts.porRevisar++;
      if (!c.province) { plan.counts.sinProvincia++; continue; }
      const p = plan.counts.provincias[c.province] ??= { publicados: 0, porRevisar: 0 };
      p[c.status === "PUBLISHED" ? "publicados" : "porRevisar"]++;
    }
    plan.hash = planHash(plan);
    writeFileSync(join(directory, "plan-osm.json"), JSON.stringify(plan, null, 2) + "\n");
    console.log(JSON.stringify({ hash: plan.hash, comparadoConBase: plan.compared, ...plan.counts }, null, 2));
    console.log("Solo recuento: ningún dato cargado. Presentarlo al fundador antes de una carga real.");
  } else {
    if (!plan.compared) throw new Error("Primero compara el plan con la base destino (--comparar-base)");
    if (plan.target?.kind !== (real ? "real" : "demo") || plan.target?.fingerprint !== targetFingerprint()) throw new Error("El plan pertenece a otra base: compara y presenta el recuento del destino correcto");
    if (real && process.env.RECUENTO_OSM_REVISADO !== plan.hash) throw new Error("Falta el hash del recuento presentado y autorizado: RECUENTO_OSM_REVISADO");
    // Ningún seed ni cuenta de ejemplo interviene; se escriben únicamente gimnasios y su auditoría.
    let written = 0, protectedCount = 0;
    for (const c of plan.candidates) {
      if (excludedGymProvince(c.province) || c.status === "PUBLISHED" && !provinces.includes(c.province)) throw new Error("Plan con provincia no publicable; vuelve a prepararlo");
      await db.$transaction(async (tx) => {
        const before = await tx.gym.findUnique({ where: { sourceRef: c.sourceRef } });
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`gym:${before?.id ?? c.sourceRef}`}))`;
        const current = await tx.gym.findUnique({ where: { sourceRef: c.sourceRef } });
        if (current && !osmMayUpdate(current)) { protectedCount++; return; }
        const other = c.lat === null || c.lng === null ? [] : await tx.gym.findMany({ where: { province: c.province, OR: [{ sourceRef: null }, { sourceRef: { not: c.sourceRef } }] }, select: { id: true, name: true, lat: true, lng: true } });
        const duplicate = other.find((g) => gymNameKey(g.name) === gymNameKey(c.name) && g.lat !== null && g.lng !== null && gymDistanceMetres(g, c) < 150);
        const data = { ...c, importedAt: new Date(), geocodedAt: new Date(), ...(duplicate ? { status: "PENDING", reviewNote: `Posible duplicado de ${duplicate.id}; por revisar` } : {}) };
        const slug = `${gymNameKey(c.name).replace(/ /g, "-").slice(0, 80)}-osm-${c.sourceRef.replace("/", "-")}`;
        const gym = current ? await tx.gym.update({ where: { id: current.id }, data }) : await tx.gym.create({ data: { ...data, slug } });
        await tx.auditLog.create({ data: { entity: "GYM", entityId: gym.id, action: "OSM_IMPORTED", after: { sourceRef: c.sourceRef, status: data.status } } }); written++;
      });
    }
    console.log(JSON.stringify({ escritos: written, protegidos: protectedCount, plan: plan.hash }));
  }
} finally { if (db) await db.$disconnect(); }
