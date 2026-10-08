import type { Discipline } from "@prisma/client";
import { safeHttpUrl } from "../common/url";

/**
 * Lector de canales RSS 2.0 y Atom (prensa, federaciones, agregadores y canales de vídeo) sin dependencias. Solo extrae lo que
 * la portada necesita (titular, enlace, fecha, medio, resumen y miniatura) y descarta lo que no sea seguro: enlaces que no sean
 * http(s), miniaturas de dominios no permitidos por la política de seguridad (next.config.mjs) y fechas imposibles.
 */
export type EntradaNoticia = { guid: string; url: string; title: string; publisher: string | null; summary: string | null; imageUrl: string | null; publishedAt: Date };

export const MAX_ENTRADAS_POR_CANAL = 30;
export const TITULAR_MAX = 200;
export const RESUMEN_MAX = 280;
/** Dominios de miniaturas que se muestran (deben coincidir con img-src en next.config.mjs). */
export const HOSTS_DE_IMAGEN = ["i.ytimg.com"];

const ENTIDADES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

export function decodificar(texto: string): string {
  return texto
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
      if (e[0] === "#") {
        const n = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : "";
      }
      return Object.prototype.hasOwnProperty.call(ENTIDADES, e.toLowerCase()) ? ENTIDADES[e.toLowerCase()] : m;
    });
}

/** Quita etiquetas HTML y espacios sobrantes (los resúmenes de la prensa suelen traer HTML escapado). */
export const textoPlano = (html: string) =>
  decodificar(decodificar(html).replace(/<[^>]*>/g, " "))
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const recortar = (t: string, max: number) => (t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t);

const escapar = (nombre: string) => nombre.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function etiqueta(bloque: string, nombre: string): string | null {
  const m = bloque.match(new RegExp(`<${escapar(nombre)}(?:\\s[^>]*)?>([\\s\\S]*?)</${escapar(nombre)}>`, "i"));
  return m ? m[1] : null;
}
function atributo(bloque: string, nombre: string, attr: string, filtro?: (abre: string) => boolean): string | null {
  for (const m of bloque.matchAll(new RegExp(`<${escapar(nombre)}\\s[^>]*>`, "gi"))) {
    if (filtro && !filtro(m[0])) continue;
    const a = m[0].match(new RegExp(`\\s${escapar(attr)}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i"));
    if (a) return decodificar(a[2] ?? a[3] ?? "");
  }
  return null;
}

function imagenPermitida(url: string | null): string | null {
  const u = url ? safeHttpUrl(url) : null;
  if (!u) return null;
  const { hostname, protocol } = new URL(u);
  return protocol === "https:" && HOSTS_DE_IMAGEN.includes(hostname) ? u : null;
}

function fecha(texto: string | null, ahora: Date): Date | null {
  if (!texto) return null;
  const t = Date.parse(decodificar(texto).trim());
  if (!Number.isFinite(t) || t < Date.UTC(2000, 0, 1)) return null;
  return new Date(Math.min(t, ahora.getTime()));
}

export function parseFeed(xml: string, ahora: Date = new Date()): EntradaNoticia[] {
  const atom = /<feed[\s>]/i.test(xml) && !/<rss[\s>]/i.test(xml);
  const bloques = [...xml.matchAll(atom ? /<entry[\s>][\s\S]*?<\/entry>/gi : /<item[\s>][\s\S]*?<\/item>/gi)].map((m) => m[0]);
  const salida: EntradaNoticia[] = [];
  for (const b of bloques) {
    if (salida.length >= MAX_ENTRADAS_POR_CANAL) break;
    const enlace = atom
      ? atributo(b, "link", "href", (abre) => !/rel\s*=/.test(abre) || /rel\s*=\s*["']alternate["']/i.test(abre))
      : textoPlano(etiqueta(b, "link") ?? "") || null;
    const url = enlace ? safeHttpUrl(enlace) : null;
    let titulo = textoPlano(etiqueta(b, "title") ?? "");
    const publicado = fecha(atom ? etiqueta(b, "published") ?? etiqueta(b, "updated") : etiqueta(b, "pubDate") ?? etiqueta(b, "dc:date"), ahora);
    if (!url || !titulo || !publicado) continue;
    // Agregadores (Google Noticias): el medio viene en <source> y repetido al final del titular («Titular - Medio»).
    const medio = atom ? null : textoPlano(etiqueta(b, "source") ?? "") || null;
    if (medio && titulo.endsWith(` - ${medio}`)) titulo = titulo.slice(0, -(medio.length + 3)).trim();
    const resumenBruto = atom ? etiqueta(b, "media:description") ?? etiqueta(b, "summary") : etiqueta(b, "description");
    const resumen = resumenBruto ? textoPlano(resumenBruto) : "";
    const guid = textoPlano(etiqueta(b, atom ? "id" : "guid") ?? "") || url;
    const imagen = imagenPermitida(
      atributo(b, "media:thumbnail", "url") ?? atributo(b, "media:content", "url", (abre) => /medium\s*=\s*["']image["']|type\s*=\s*["']image\//i.test(abre)) ?? atributo(b, "enclosure", "url", (abre) => /type\s*=\s*["']image\//i.test(abre)),
    );
    salida.push({
      guid: recortar(guid, 500),
      url,
      title: recortar(titulo, TITULAR_MAX),
      publisher: medio ? recortar(medio, 80) : null,
      summary: resumen && resumen !== titulo ? recortar(resumen, RESUMEN_MAX) : null,
      imageUrl: imagen,
      publishedAt: publicado,
    });
  }
  return salida;
}

const sinTildes = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const PALABRAS: [Discipline, RegExp][] = [
  ["MUAYTHAI", /\bmuay ?thai\b|\bboxeo tailandes\b|\bthai boxing\b/],
  ["KICKBOXING", /\bkick ?boxing\b/],
  ["K1", /\bk-?1\b/],
  ["MMA", /\bmma\b|\bufc\b|artes marciales mixtas|\bpfl\b|\bbellator\b/],
  ["JIUJITSU", /\bjiu[ -]?jitsu\b|\bbjj\b|\bgrappling\b|\badcc\b/],
  ["BOXEO", /\bboxeo\b|\bboxeador(a|es|as)?\b|\bpugil(es)?\b|\bboxing\b|\b(wbc|wba|ibf|wbo|cmb|fib|omb)\b/],
];

/** Disciplinas de un titular por palabras clave. «Boxeo tailandés» es Muay Thai, no boxeo. */
export function detectarDisciplinas(texto: string): Discipline[] {
  let t = sinTildes(texto);
  const salida: Discipline[] = [];
  for (const [d, re] of PALABRAS) {
    if (re.test(t)) salida.push(d);
    if (d === "MUAYTHAI") t = t.replace(/\bboxeo tailandes\b|\bthai boxing\b/g, " ");
  }
  return salida;
}

/** Disciplinas de una noticia: las que cubre la fuente (si es temática) más las que se detectan en el titular y el resumen. */
export function disciplinasDe(fuente: Discipline[], e: Pick<EntradaNoticia, "title" | "summary">): Discipline[] {
  return [...new Set([...fuente, ...detectarDisciplinas(`${e.title} ${e.summary ?? ""}`)])];
}

/**
 * Orden de la portada: lo más reciente primero, pero sin que un mismo medio acapare la lista (petición del fundador: fuentes variadas).
 * Cada medio entra como mucho `porMedio` veces en las primeras posiciones; lo que sobra se añade después, también por fecha.
 */
export function variar<T extends { publishedAt: Date; clave: string }>(lista: T[], max: number, porMedio = 2): T[] {
  const orden = [...lista].sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  const cuenta = new Map<string, number>();
  const primero: T[] = [], despues: T[] = [];
  for (const x of orden) {
    const n = cuenta.get(x.clave) ?? 0;
    (n < porMedio ? primero : despues).push(x);
    cuenta.set(x.clave, n + 1);
  }
  return [...primero, ...despues].slice(0, max);
}
