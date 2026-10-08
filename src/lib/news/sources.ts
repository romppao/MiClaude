import type { Discipline, NewsSourceKind } from "@prisma/client";

/**
 * Fuentes iniciales de la portada (petición del fundador, 8 de octubre de 2026: «noticias actuales de la escena de los deportes de contacto»,
 * de fuentes fiables y variadas: canales de vídeo, prensa y federaciones, no una sola). Se crean solas la primera vez que se actualizan las
 * noticias; después, moderación las activa, desactiva o añade otras en /moderacion/noticias sin tocar el código.
 *
 * Comprobación: desde el entorno de desarrollo no se pudo abrir ninguna de estas direcciones (la red lo impide). Los identificadores de los
 * canales de vídeo se comprobaron con búsquedas; el formato de Google Noticias es el público. La aplicación anota si cada fuente funciona
 * («Última lectura correcta» en moderación): hay que revisarlo en la demo antes de publicar. Riesgo pendiente: las condiciones de uso de
 * Google Noticias para un uso comercial (docs/TRASLADO.md).
 */
export type FuenteInicial = { name: string; url: string; kind: NewsSourceKind; disciplines: Discipline[] };

const youtube = (canal: string) => `https://www.youtube.com/feeds/videos.xml?channel_id=${canal}`;
/** Búsqueda de Google Noticias en español de España, solo de la última semana: reúne titulares de muchos medios distintos. */
export const googleNoticias = (consulta: string) => `https://news.google.com/rss/search?q=${encodeURIComponent(`${consulta} when:7d`)}&hl=es&gl=ES&ceid=ES:es`;

export const FUENTES_INICIALES: FuenteInicial[] = [
  { name: "Prensa española: boxeo", url: googleNoticias("boxeo"), kind: "AGREGADOR", disciplines: ["BOXEO"] },
  { name: "Prensa española: jiu-jitsu", url: googleNoticias('"jiu-jitsu" OR "jiu jitsu"'), kind: "AGREGADOR", disciplines: ["JIUJITSU"] },
  { name: "Prensa española: K-1", url: googleNoticias('"K-1" OR "K1" combate'), kind: "AGREGADOR", disciplines: ["K1"] },
  { name: "Prensa española: kickboxing", url: googleNoticias("kickboxing"), kind: "AGREGADOR", disciplines: ["KICKBOXING"] },
  { name: "Prensa española: MMA", url: googleNoticias('MMA OR UFC "artes marciales mixtas"'), kind: "AGREGADOR", disciplines: ["MMA"] },
  { name: "Prensa española: Muay Thai", url: googleNoticias('"muay thai"'), kind: "AGREGADOR", disciplines: ["MUAYTHAI"] },
  { name: "Federaciones españolas", url: googleNoticias('"federación española" boxeo OR kickboxing OR "muay thai" OR "jiu-jitsu" OR "lucha"'), kind: "FEDERACION", disciplines: [] },
  { name: "UFC (canal de vídeo)", url: youtube("UCvgfXK4nTYKudb0rFR6noLA"), kind: "VIDEO", disciplines: ["MMA"] },
  { name: "ONE Championship (canal de vídeo)", url: youtube("UCiormkBf3jm6mfb7k0yPbKA"), kind: "VIDEO", disciplines: [] },
  { name: "GLORY Kickboxing (canal de vídeo)", url: youtube("UCKj5FIgxeihLRLDpVqKp_aA"), kind: "VIDEO", disciplines: ["KICKBOXING"] },
];

export const TIPO_DE_FUENTE_ETIQUETA: Record<NewsSourceKind, string> = { VIDEO: "Canal de vídeo", PRENSA: "Prensa", FEDERACION: "Federación", AGREGADOR: "Varios medios" };

/** Cada cuánto se vuelve a leer una fuente, y cuánto se conservan las noticias. */
export const REFRESCO_MS = 30 * 60_000;
export const CONSERVAR_DIAS = 45;
