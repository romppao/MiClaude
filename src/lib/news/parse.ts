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
  ["MUAYTHAI", /\bmuay ?thai\b|\bboxeo tailandes\b|\bthai ?boxing\b|\bnak ?muay\b/],
  ["KICKBOXING", /\bkick ?boxing\b|\bkick-boxing\b|\bkickboxer\b/],
  ["K1", /\bk-?1\b/],
  ["MMA", /\bmma\b|\bufc\b|artes marciales mixtas|\bpfl\b|\bbellator\b|\bcage warriors\b|\boctogono\b|\btopuria\b/],
  ["JIUJITSU", /\bjiu[ -]?jitsu\b|\bjiujitsu\b|\bbjj\b|\bgrappling\b|\badcc\b/],
  ["BOXEO", /\bboxeo\b|\bboxeador(a|es|as)?\b|\bpugil(es|ista|istas)?\b|\bboxing\b|\b(wbc|wba|ibf|wbo|cmb|fib|omb|ebu)\b/],
];
// Expresiones que contienen la palabra de otra disciplina: se quitan antes de seguir buscando («boxeo tailandés» no es boxeo,
// «kick boxing» no es boxeo).
const QUITAR_TRAS: Partial<Record<Discipline, RegExp>> = {
  MUAYTHAI: /\bboxeo tailandes\b|\bthai ?boxing\b/g,
  KICKBOXING: /\bkick ?boxing\b|\bkick-boxing\b/g,
};

/** Disciplinas que nombra un texto, por palabras clave. «Boxeo tailandés» es Muay Thai y «kick boxing» es kickboxing, no boxeo. */
export function detectarDisciplinas(texto: string): Discipline[] {
  let t = sinTildes(texto);
  const salida: Discipline[] = [];
  for (const [d, re] of PALABRAS) {
    if (re.test(t)) salida.push(d);
    const quitar = QUITAR_TRAS[d];
    if (quitar) t = t.replace(quitar, " ");
  }
  return salida;
}

/**
 * Disciplina de una noticia (petición del fundador, 8 de octubre de 2026: «única y exclusivamente contenido de cada disciplina en su
 * pantalla»). Una noticia solo va a la portada de una disciplina si su **titular** habla de esa y de ninguna otra:
 * - el titular nombra una sola disciplina → esa;
 * - nombra varias (por ejemplo, «velada de boxeo y MMA») → ninguna: solo sale en la portada común («Todos»);
 * - no nombra ninguna → la de la fuente, pero solo si es un medio dedicado a una sola disciplina (no una búsqueda en Google Noticias,
 *   que trae noticias que solo la mencionan de pasada) y el resumen no habla de otra.
 * Devuelve null si la noticia no es de deportes de contacto (una fuente general cuyo titular no nombra ninguna): se descarta.
 */
export function clasificar(fuente: { disciplines: Discipline[]; kind: string }, e: Pick<EntradaNoticia, "title" | "summary">): Discipline[] | null {
  const titular = detectarDisciplinas(e.title);
  if (titular.length === 1) return titular;
  if (titular.length > 1) return [];
  const dedicada = fuente.disciplines.length === 1 && fuente.kind !== "AGREGADOR";
  if (dedicada) {
    const resumen = detectarDisciplinas(e.summary ?? "");
    return resumen.every((d) => d === fuente.disciplines[0]) ? fuente.disciplines : [];
  }
  return fuente.disciplines.length > 0 ? [] : null;
}

// ---------- Idioma: solo noticias en español (petición del fundador: «no quiero noticias en inglés») ----------

const PALABRAS_ES = new Set("el la los las de del que en y por con para una un su sus al se tras ante contra sobre como pero mas este esta gana pierde campeon campeona combate pelea velada noche nuevo nueva espanol espanola titulo".split(" "));
const PALABRAS_EN = new Set("the and of to in for with on at after his her is are from by wins win beats fight fighter night new title who how what will".split(" "));

/**
 * ¿Está el titular en español? Cuenta palabras frecuentes de cada idioma (y las letras propias del español). Un titular que solo tiene
 * nombres propios («Topuria - Holloway») no se puede saber y se acepta, porque todas las fuentes son en español.
 */
export function enEspanol(titular: string): boolean {
  const letrasEs = /[ñáéíóú¿¡]/i.test(titular);
  const palabras = sinTildes(titular).split(/[^a-z0-9]+/).filter(Boolean);
  const es = palabras.filter((p) => PALABRAS_ES.has(p)).length + (letrasEs ? 2 : 0);
  const en = palabras.filter((p) => PALABRAS_EN.has(p)).length;
  return es >= en;
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
