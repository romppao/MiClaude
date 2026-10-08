import { safeHttpUrl } from "../common/url";

/**
 * Vídeos y fotos del público en una velada (petición del fundador, 8 de octubre de 2026): «un espacio para subir contenido que han grabado
 * o fotografiado en la velada, para que los peleadores puedan obtener contenido de sus combates». Cada envío es una foto o un vídeo
 * (subido a la aplicación o, si no se puede, un enlace), con la confirmación de que quien lo comparte lo grabó y puede compartirlo.
 */
export const PIE_MAX = 120;
export const MAX_MEDIOS_POR_DIA = 20;
/** Cuántos días después de la velada se puede seguir compartiendo (las imágenes llegan días después). */
export const DIAS_PARA_COMPARTIR = 120;

export const CONSENTIMIENTO =
  "Confirmo que he grabado o fotografiado yo este contenido en la velada, que puedo compartirlo y que los peleadores del combate pueden verlo y descargarlo para su uso personal. Si aparecen menores, cuento con el permiso de su familia o su club.";

export type MedioInput = { caption: string; hayFoto: boolean; videoKey: string; videoUrl: string; consentimiento: boolean };
export type MedioParsed = { ok: true; kind: "PHOTO" | "VIDEO"; caption: string | null; videoKey: string | null; videoUrl: string | null } | { ok: false; problema: string };

export function parseMedio(i: MedioInput): MedioParsed {
  if (!i.consentimiento) return { ok: false, problema: "medio_consentimiento" };
  const caption = i.caption.replace(/\s+/g, " ").trim();
  if (caption.length > PIE_MAX) return { ok: false, problema: "medio_pie_largo" };
  const video = !!(i.videoKey || i.videoUrl);
  if (i.hayFoto && video) return { ok: false, problema: "medio_uno_solo" };
  if (!i.hayFoto && !video) return { ok: false, problema: "medio_vacio" };
  if (i.hayFoto) return { ok: true, kind: "PHOTO", caption: caption || null, videoKey: null, videoUrl: null };
  if (i.videoKey) return { ok: true, kind: "VIDEO", caption: caption || null, videoKey: i.videoKey, videoUrl: null };
  const url = safeHttpUrl(i.videoUrl);
  if (!url || !url.startsWith("https://")) return { ok: false, problema: "medio_enlace" };
  return { ok: true, kind: "VIDEO", caption: caption || null, videoKey: null, videoUrl: url };
}

/** ¿Se puede compartir contenido de esta velada? Ya celebrada (o de hoy), no cancelada y como mucho DIAS_PARA_COMPARTIR días después. */
export function veladaAbiertaAlPublico(e: { date: Date; status: string }, hoy: string): "ok" | "futura" | "cancelada" | "antigua" {
  const dia = e.date.toISOString().slice(0, 10);
  if (e.status === "CANCELLED") return "cancelada";
  if (dia > hoy) return "futura";
  if (Date.parse(hoy) - Date.parse(dia) > DIAS_PARA_COMPARTIR * 864e5) return "antigua";
  return "ok";
}

/** Nombre del archivo al descargar: «velada-2026-10-04-combate.mp4». */
export const nombreDeDescarga = (slug: string, ext: string) => `${slug.replace(/[^a-z0-9-]/g, "").slice(0, 60) || "video"}.${ext}`;
