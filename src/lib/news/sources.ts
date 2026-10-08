import type { Discipline, NewsSourceKind } from "@prisma/client";

/**
 * Fuentes iniciales de la portada. Peticiones del fundador (8 de octubre de 2026): noticias de fuentes fiables y variadas, **solo en
 * español** y **única y exclusivamente de cada disciplina en su pantalla**. Por eso:
 * - medios y federaciones españolas dedicados a una sola disciplina (sus noticias van a esa disciplina);
 * - medios y federaciones que tratan varias (FEKM: kickboxing, K-1 y Muay Thai; Jaula Magazine; Deporte de Contacto) sin disciplina
 *   fija: cada titular va a la disciplina que nombra, y si no nombra ninguna se descarta;
 * - búsquedas de Google Noticias en español de España por disciplina, excluyendo las demás.
 * Además, cada titular se clasifica (lib/news/parse.ts: clasificar) y se descarta si no está en español (enEspanol) o si no es del
 * panorama español (lib/news/espana.ts): «fomentar que la gente apoye a los nuestros». Las fuentes con `local: true` (federaciones y
 * medios que solo cubren España) no necesitan comprobar cada titular; los medios que también cubren lo internacional (Espabox,
 * MMA España, UFC Español, Jaula Magazine…) sí: solo entra lo que nombra España, una comunidad, una provincia o a un español de élite.
 * No se encontró ningún medio en español dedicado solo a K-1, solo a kickboxing o solo a Muay Thai.
 *
 * Comprobación pendiente: desde el entorno de desarrollo no se pudo abrir ninguna dirección (la red lo impide). Los medios se eligieron
 * por búsquedas (activos en 2026, WordPress con su canal /feed/); el canal de vídeo de UFC Español, por su identificador publicado.
 * La aplicación anota si cada fuente funciona («Última lectura correcta» en /moderacion/noticias): revisarlo en la demo. Riesgo pendiente:
 * las condiciones de uso de Google Noticias para un uso comercial (docs/TRASLADO.md).
 */
export type FuenteInicial = { name: string; url: string; kind: NewsSourceKind; disciplines: Discipline[]; local?: boolean };

const youtube = (canal: string) => `https://www.youtube.com/feeds/videos.xml?channel_id=${canal}`;
/** Búsqueda de Google Noticias en español de España, solo de la última semana: reúne titulares de muchos medios distintos. */
export const googleNoticias = (consulta: string) => `https://news.google.com/rss/search?q=${encodeURIComponent(`${consulta} when:7d`)}&hl=es&gl=ES&ceid=ES:es`;

// Para cada disciplina, la búsqueda excluye las demás: así llegan menos noticias mezcladas. Aun así, cada titular se vuelve a clasificar
// (lib/news/parse.ts, clasificar): solo entra en una disciplina si su titular habla de esa y de ninguna otra.
// Y pide el panorama español: la noticia debe nombrar España o a los españoles (después se comprueba cada titular, lib/news/espana.ts).
const ESPANA = '(España OR español OR española OR españoles OR "campeonato de España")';
const SIN = (...otras: string[]) => otras.map((o) => `-${o.includes(" ") ? `"${o}"` : o}`).join(" ");

export const FUENTES_INICIALES: FuenteInicial[] = [
  { name: "Prensa española: boxeo", url: googleNoticias(`boxeo ${ESPANA} ${SIN("MMA", "UFC", "kickboxing", "muay thai", "boxeo tailandés", "K-1", "jiu-jitsu")}`), kind: "AGREGADOR", disciplines: ["BOXEO"] },
  { name: "Prensa española: jiu-jitsu", url: googleNoticias(`("jiu-jitsu" OR "jiu jitsu" OR grappling) ${ESPANA} ${SIN("MMA", "UFC", "boxeo", "kickboxing")}`), kind: "AGREGADOR", disciplines: ["JIUJITSU"] },
  { name: "Prensa española: K-1", url: googleNoticias(`"K-1" ${ESPANA} ${SIN("MMA", "UFC", "boxeo")}`), kind: "AGREGADOR", disciplines: ["K1"] },
  { name: "Prensa española: kickboxing", url: googleNoticias(`kickboxing ${ESPANA} ${SIN("MMA", "UFC", "muay thai", "jiu-jitsu")}`), kind: "AGREGADOR", disciplines: ["KICKBOXING"] },
  { name: "Prensa española: MMA", url: googleNoticias(`(UFC OR MMA OR "artes marciales mixtas") ${ESPANA} ${SIN("boxeo", "kickboxing", "muay thai")}`), kind: "AGREGADOR", disciplines: ["MMA"] },
  { name: "Prensa española: Muay Thai", url: googleNoticias(`("muay thai" OR "boxeo tailandés") ${ESPANA} ${SIN("MMA", "UFC", "kickboxing")}`), kind: "AGREGADOR", disciplines: ["MUAYTHAI"] },
  { name: "Federaciones españolas", url: googleNoticias('"federación española" (boxeo OR kickboxing OR "muay thai" OR "jiu-jitsu")'), kind: "FEDERACION", disciplines: [], local: true },
  // Dedicados a una sola disciplina
  { name: "Espabox", url: "https://www.espabox.com/feed/", kind: "PRENSA", disciplines: ["BOXEO"] },
  { name: "Asociación Española de Boxeo (AEBOX)", url: "https://aebox.org/feed/", kind: "FEDERACION", disciplines: ["BOXEO"], local: true },
  { name: "Real Federación Española de Boxeo", url: "https://feboxeo.es/feed/", kind: "FEDERACION", disciplines: ["BOXEO"], local: true },
  { name: "MMA España", url: "https://www.mma.es/feed/", kind: "PRENSA", disciplines: ["MMA"] },
  { name: "UFC Español (canal de vídeo)", url: youtube("UCYXJFtx4SUkrb2p_8mhLPzQ"), kind: "VIDEO", disciplines: ["MMA"] },
  { name: "Fighter Corner (jiu-jitsu)", url: "https://fightercorner.es/feed/", kind: "PRENSA", disciplines: ["JIUJITSU"], local: true },
  // Tratan varias disciplinas: cada titular va a la que nombra
  { name: "Federación Española de Kickboxing y Muaythai (FEKM)", url: "https://fekm.es/feed/", kind: "FEDERACION", disciplines: [], local: true },
  { name: "Jaula Magazine", url: "https://jaulamagazine.com/feed/", kind: "PRENSA", disciplines: [] },
  { name: "Deporte de Contacto", url: "https://deportedecontacto.com/category/noticias/feed/", kind: "PRENSA", disciplines: [] },
];

/**
 * Fuentes que se dejaron de usar el 8 de octubre de 2026 (el fundador: «no quiero noticias en inglés» y «única y exclusivamente contenido
 * de cada disciplina»): los canales de vídeo en inglés y las búsquedas anteriores, que mezclaban disciplinas. Se desactivan y se borran
 * sus titulares al actualizar (lib/news/refresh.ts).
 */
export const FUENTES_RETIRADAS: string[] = [
  youtube("UCvgfXK4nTYKudb0rFR6noLA"), // UFC (inglés)
  youtube("UCiormkBf3jm6mfb7k0yPbKA"), // ONE Championship (inglés)
  youtube("UCKj5FIgxeihLRLDpVqKp_aA"), // GLORY Kickboxing (inglés)
  googleNoticias("boxeo"),
  googleNoticias('"jiu-jitsu" OR "jiu jitsu"'),
  googleNoticias('"K-1" OR "K1" combate'),
  googleNoticias("kickboxing"),
  googleNoticias('MMA OR UFC "artes marciales mixtas"'),
  googleNoticias('"muay thai"'),
  googleNoticias('"federación española" boxeo OR kickboxing OR "muay thai" OR "jiu-jitsu" OR "lucha"'),
];

export const TIPO_DE_FUENTE_ETIQUETA: Record<NewsSourceKind, string> = { VIDEO: "Canal de vídeo", PRENSA: "Prensa", FEDERACION: "Federación", AGREGADOR: "Varios medios" };

/** Cada cuánto se vuelve a leer una fuente, y cuánto se conservan las noticias. */
export const REFRESCO_MS = 30 * 60_000;
export const CONSERVAR_DIAS = 45;
