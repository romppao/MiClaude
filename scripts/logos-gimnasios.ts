// Busca el logotipo de cada gimnasio de la lista investigada en SU PROPIA web y lo deja listo para la tarjeta.
// Petición del fundador (17-10-2026): «los logos de los gimnasios se pueden encontrar muy fácil… luego mejorar las imágenes».
//
//   npx tsx scripts/logos-gimnasios.ts                → prueba con todos los que tienen web y escribe public/gimnasios/logos y src/lib/common/gimnasios-logos.json
//   npx tsx scripts/logos-gimnasios.ts --solo texto   → solo los que contengan «texto» en el nombre (para repetir uno)
//   npx tsx scripts/logos-gimnasios.ts --reprocesar   → vuelve a tratar las imágenes ya encontradas (sin releer las páginas)
//   npx tsx scripts/logos-gimnasios.ts --web slug=https://…   → fija a mano la web de un gimnasio que no la tenía en la lista
//
// Reglas (ver docs/LEGAL.md, «Logotipos de gimnasios»):
//  - Solo se lee la página de inicio del gimnasio (una petición por web, con identificación clara y pausa entre peticiones) y se respeta robots.txt.
//  - Nunca Instagram ni redes: exigen sesión y sus condiciones no permiten leerlas de forma automática.
//  - Se guarda de dónde salió cada logotipo (src/lib/common/gimnasios-logos.json) para poder retirarlo si el gimnasio lo pide.
//  - El logotipo que sube el propio gimnasio (perfil reclamado) siempre manda sobre este.
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";
import { slugName } from "../src/lib/common/labels";

type Fila = { name: string; city: string; province: string; website?: string | null; instagram?: string | null };
type Entrada = { archivo: string; origen: string; pagina: string; fecha: string };

const UA = "Lona-directorio/1.0 (directorio de gimnasios de deportes de contacto; https://lonaclub.es)";
const SALIDA = resolve(process.cwd(), "public/gimnasios/logos");
const MANIFIESTO = resolve(process.cwd(), "src/lib/common/gimnasios-logos.json");
const MAX_BYTES = 4 * 1024 * 1024;
/** Gimnasios cuya web da una imagen que NO es su logotipo (revisado a ojo el 17-10-2026): se prefiere no mostrar nada antes que mostrar otra marca. */
const EXCLUIR: Record<string, string> = {
  "muay-thai-madrid-madrid": "su web muestra el logotipo de Fairtex, una marca de material",
  "emporio-boxing-alcorcon": "la imagen de su web es un cuadrado dorado, no su logotipo",
  "gimnasio-estoril-mostoles": "la imagen de su web es un icono genérico de pesas, no su logotipo",
};
const pausa = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function traer(url: string, tipo: "texto" | "imagen") {
  const r = await fetch(url, { headers: { "User-Agent": UA, Accept: tipo === "texto" ? "text/html,*/*;q=0.5" : "image/*,*/*;q=0.5" }, redirect: "follow", signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const largo = Number(r.headers.get("content-length") ?? 0);
  if (largo > MAX_BYTES) throw new Error("demasiado grande");
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length > MAX_BYTES) throw new Error("demasiado grande");
  return { buf, tipo: r.headers.get("content-type") ?? "", url: r.url };
}

/** ¿robots.txt prohíbe entrar a la página de inicio a cualquier robot? */
async function robotsPermite(origen: string) {
  try {
    const { buf } = await traer(`${origen}/robots.txt`, "texto");
    let aplica = false;
    for (const linea of buf.toString("utf8").split(/\r?\n/)) {
      const l = linea.replace(/#.*/, "").trim();
      if (/^user-agent:\s*\*/i.test(l)) aplica = true;
      else if (/^user-agent:/i.test(l)) aplica = false;
      else if (aplica && /^disallow:\s*\/\s*$/i.test(l)) return false;
    }
  } catch { /* sin robots.txt: se puede */ }
  return true;
}

const atributo = (etiqueta: string, nombre: string) => etiqueta.match(new RegExp(`${nombre}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"))?.slice(2).find((x) => x !== undefined) ?? "";
const absoluta = (ref: string, base: string) => { try { return new URL(ref.replace(/&amp;/g, "&"), base).href; } catch { return null; } };

/** Candidatos a logotipo, de más a menos fiable: dato estructurado, imagen con «logo» en la cabecera, icono grande. */
function candidatos(html: string, base: string): string[] {
  const salida: string[] = [];
  const poner = (ref: string | null | undefined) => { const u = ref && absoluta(ref, base); if (u && !/\.(ico|gif)(\?|$)/i.test(u) && !/\bs\d\.wp\.com\/i\/|wp-includes\/images|gravatar\.com|favicon-default|\/webclip\.png/i.test(u) && !salida.includes(u)) salida.push(u); };
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const visita = (o: unknown): void => {
        if (Array.isArray(o)) return o.forEach(visita);
        if (o && typeof o === "object") {
          const r = o as Record<string, unknown>;
          const l = r.logo;
          poner(typeof l === "string" ? l : l && typeof l === "object" ? ((l as Record<string, unknown>).url as string) : null);
          Object.values(r).forEach(visita);
        }
      };
      visita(JSON.parse(m[1]));
    } catch { /* JSON mal formado: se ignora */ }
  }
  const cabecera = html.slice(0, Math.max(20000, Math.floor(html.length / 3)));
  for (const m of cabecera.matchAll(/<img\b[^>]*>/gi)) {
    const t = m[0];
    const pistas = `${atributo(t, "class")} ${atributo(t, "id")} ${atributo(t, "alt")} ${atributo(t, "src")} ${atributo(t, "data-src")}`;
    if (/logo|brand|marca/i.test(pistas) && !/partner|sponsor|patrocin|colabora|facebook|instagram|twitter|youtube|whatsapp|footer-?bg/i.test(pistas)) poner(atributo(t, "src") || atributo(t, "data-src"));
  }
  const iconos = [...html.matchAll(/<link\b[^>]*rel\s*=\s*["']?[^>]*(?:apple-touch-icon|icon)[^>]*>/gi)].map((m) => ({ ref: atributo(m[0], "href"), px: parseInt(atributo(m[0], "sizes"), 10) || 0, apple: /apple-touch-icon/i.test(m[0]) }));
  iconos.sort((a, b) => Number(b.apple) - Number(a.apple) || b.px - a.px);
  for (const i of iconos) poner(i.ref);
  return salida.slice(0, 6);
}

/** Muchas webs sirven el logotipo en miniatura (…?w=48, …&height=60, /w_180,h_180/): si se puede, se pide el tamaño grande de la misma imagen. */
function agrandada(url: string): string {
  return url
    .replace(/([?&]w=)\d+/i, "$1640")
    .replace(/([?&]height=)\d+/i, "$1512")
    .replace(/(\/w_)\d+(%2C|,)(h_)\d+/i, "$1512$2$3512")
    .replace(/-\d{2,4}x\d{2,4}(?=\.(?:png|jpe?g|webp)(?:\?|$))/i, "");
}

/** Desvío típico medio de los canales: cerca de 0 es una imagen casi lisa (un logotipo blanco sobre blanco, por ejemplo). */
async function contraste(png: Buffer) {
  const { channels } = await sharp(png).stats();
  return channels.slice(0, 3).reduce((s, c) => s + c.stdev, 0) / 3;
}

/**
 * Recorta los márgenes, lo centra con aire y lo deja en un cuadrado de 512 px (la tarjeta lo recorta en círculo).
 * Si el logotipo es claro sobre fondo transparente (se perdería sobre blanco), se pone sobre un fondo oscuro.
 */
async function prepararLogo(buf: Buffer) {
  const base = sharp(buf, { density: 300, limitInputPixels: 40_000_000 });
  const meta = await base.metadata();
  if (!meta.width || !meta.height || Math.min(meta.width, meta.height) < 48 || Math.max(meta.width, meta.height) < 120) throw new Error("demasiado pequeño para verse nítido");
  const relacion = meta.width / meta.height;
  if (relacion > 4 || relacion < 0.25) throw new Error("no parece un logotipo (muy alargado)");
  const sobre = (fondo: string) => sharp(buf, { density: 300, limitInputPixels: 40_000_000 }).flatten({ background: fondo }).png().toBuffer();
  let fondo = "#ffffff";
  let plano = await sobre(fondo);
  let fuerza = await contraste(plano);
  // Con transparencia, se elige el fondo (blanco u oscuro) sobre el que mejor se lee.
  if (meta.hasAlpha) {
    const oscuro = await sobre("#101010");
    const fuerzaOscuro = await contraste(oscuro);
    if (fuerzaOscuro > fuerza * 1.15) { fondo = "#101010"; plano = oscuro; fuerza = fuerzaOscuro; }
  }
  if (fuerza < 12) throw new Error("imagen sin contenido visible");
  const recortado = await sharp(plano).trim({ threshold: 14 }).png().toBuffer().catch(() => plano);
  const lienzo = 512, interior = 360;
  const centro = await sharp(recortado).resize(interior, interior, { fit: "inside" }).png().toBuffer();
  return sharp({ create: { width: lienzo, height: lienzo, channels: 3, background: fondo } }).composite([{ input: centro, gravity: "centre" }]).webp({ quality: 88 }).toBuffer();
}

async function main() {
  const solo = process.argv.includes("--solo") ? process.argv[process.argv.indexOf("--solo") + 1]?.toLowerCase() : null;
  const reprocesar = process.argv.includes("--reprocesar");
  const manuales = new Map<string, string>();
  process.argv.forEach((a, i) => { if (a === "--web") { const [slug, url] = (process.argv[i + 1] ?? "").split("="); if (slug && url) manuales.set(slug, url); } });
  const filas: Fila[] = JSON.parse(readFileSync(resolve(process.cwd(), "docs/datos/gimnasios-investigados.json"), "utf8"));
  const manifiesto: Record<string, Entrada> = existsSync(MANIFIESTO) ? JSON.parse(readFileSync(MANIFIESTO, "utf8")) : {};
  mkdirSync(SALIDA, { recursive: true });
  const resumen = { con: 0, sin: 0, saltados: 0 };
  for (const f of filas) {
    const slug = slugName(f.name, f.city);
    if (EXCLUIR[slug]) { resumen.saltados++; continue; }
    const web = manuales.get(slug) ?? f.website;
    if (!web || (solo && !f.name.toLowerCase().includes(solo) && slug !== solo)) { resumen.saltados++; continue; }
    if (reprocesar && manifiesto[slug]) {
      try { const img = await traer(agrandada(manifiesto[slug].origen), "imagen").catch(() => traer(manifiesto[slug].origen, "imagen")); writeFileSync(resolve(SALIDA, `${slug}.webp`), await prepararLogo(img.buf)); console.log(`OK   ${f.name} (repetido)`); resumen.con++; } catch (e) { console.log(`—    ${f.name}: ${(e as Error).message} (se quita)`); delete manifiesto[slug]; rmSync(resolve(SALIDA, `${slug}.webp`), { force: true }); resumen.sin++; }
      await pausa(300); continue;
    }
    if (manifiesto[slug] && !solo && !manuales.has(slug)) { resumen.con++; continue; }
    try {
      const origen = new URL(web).origin;
      if (!(await robotsPermite(origen))) { console.log(`—    ${f.name}: robots.txt no lo permite`); resumen.sin++; continue; }
      const pagina = await traer(web, "texto");
      const lista = candidatos(pagina.buf.toString("utf8"), pagina.url);
      let hecho = false;
      for (const ref of lista) {
        try {
          await pausa(400);
          const img = await traer(agrandada(ref), "imagen").catch(() => traer(ref, "imagen"));
          const webp = await prepararLogo(img.buf).catch(async (e) => { if (agrandada(ref) === ref) throw e; return prepararLogo((await traer(ref, "imagen")).buf); });
          writeFileSync(resolve(SALIDA, `${slug}.webp`), webp);
          manifiesto[slug] = { archivo: `${slug}.webp`, origen: ref, pagina: pagina.url, fecha: new Date().toISOString().slice(0, 10) };
          console.log(`OK   ${f.name} ← ${ref}`);
          hecho = true; resumen.con++;
          break;
        } catch { /* se prueba el siguiente candidato */ }
      }
      if (!hecho) { console.log(`—    ${f.name}: ${lista.length ? "ningún candidato sirvió" : "sin logotipo en la página"}`); resumen.sin++; }
    } catch (e) { console.log(`—    ${f.name}: ${(e as Error).message}`); resumen.sin++; }
    await pausa(800);
  }
  const ordenado = Object.fromEntries(Object.entries(manifiesto).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(MANIFIESTO, JSON.stringify(ordenado, null, 2) + "\n");
  console.log(`\nCon logotipo: ${resumen.con} · sin logotipo: ${resumen.sin} · sin web (no se prueban): ${resumen.saltados}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
