import { isEmail } from "../common/text";

export const REPORT_REASONS: Record<string, string> = {
  NO_OCURRIO: "Este combate no ocurrió",
  RESULTADO: "El resultado no es correcto",
  DATOS_PERSONALES: "Contiene datos personales o contenido inapropiado",
  SUPLANTACION: "Alguien se hace pasar por esta persona",
  INAPROPIADO: "Es ofensivo, falso o inapropiado",
  MI_IMAGEN: "Aparezco yo (o un menor a mi cargo) y no doy permiso para publicarlo",
  ILEGAL: "Es ilegal (delito, amenazas, odio, derechos de autor…)",
  MENORES: "Abuso o explotación sexual de menores",
  OTRO: "Otro motivo",
};

export const REPORT_ENTITIES = ["BOUT", "FIGHTER", "AURA", "MEDIA", "PAGINA", "GYM"] as const;
export type ReportEntity = (typeof REPORT_ENTITIES)[number];

/** Motivos que se ofrecen según lo que se avisa. */
export const REASONS_BY_ENTITY: Record<ReportEntity, string[]> = {
  BOUT: ["NO_OCURRIO", "RESULTADO", "DATOS_PERSONALES", "OTRO"],
  FIGHTER: ["DATOS_PERSONALES", "SUPLANTACION", "OTRO"],
  AURA: ["INAPROPIADO", "DATOS_PERSONALES", "OTRO"],
  MEDIA: ["MI_IMAGEN", "INAPROPIADO", "OTRO"],
  // Aviso desde /avisar, con o sin cuenta (DSA, art. 16): sobre cualquier página de Lona.
  PAGINA: ["ILEGAL", "DATOS_PERSONALES", "MI_IMAGEN", "SUPLANTACION", "INAPROPIADO", "MENORES", "OTRO"],
  GYM: ["DATOS_PERSONALES", "OTRO"],
};

export const MAX_REPORTS_PER_DAY = 10;

/** Avisos sin cuenta por dirección IP y día: frena los envíos masivos sin impedir que alguien avise de varias cosas. */
export const AVISOS_SIN_CUENTA_POR_DIA = 5;
export const AVISO_EXPLICACION_MIN = 20;
export const AVISO_EXPLICACION_MAX = 2000;

export type AvisoSinCuenta = { ruta: string; motivo: string; explicacion: string; nombre: string | null; correo: string | null };

/**
 * Comprueba el formulario de aviso sin cuenta (/avisar; DSA, art. 16.2): dónde está el contenido (una página de Lona), por qué es ilegal o
 * incumple las normas, quién avisa y la declaración de buena fe. En los avisos de abuso sexual de menores, el nombre, el correo y la
 * declaración son opcionales (art. 16.2.c). Devuelve la dirección reducida a su ruta dentro de Lona (sin dominio).
 */
export function parseAvisoSinCuenta(
  d: { direccion: string; motivo: string; explicacion: string; nombre: string; correo: string; declaracion: boolean },
  appUrl: string,
): { ok: true; value: AvisoSinCuenta } | { ok: false; problema: string } {
  const ruta = rutaDeLona(d.direccion, appUrl);
  if (!ruta) return { ok: false, problema: "aviso_direccion" };
  if (!REASONS_BY_ENTITY.PAGINA.includes(d.motivo)) return { ok: false, problema: "aviso_motivo" };
  const explicacion = d.explicacion.trim();
  if (explicacion.length < AVISO_EXPLICACION_MIN) return { ok: false, problema: "aviso_explicacion_corta" };
  if (explicacion.length > AVISO_EXPLICACION_MAX) return { ok: false, problema: "texto_largo" };
  const anonimo = d.motivo === "MENORES";
  const nombre = d.nombre.replace(/\s+/g, " ").trim().slice(0, 120);
  const correo = d.correo.trim().toLowerCase();
  if (correo && !isEmail(correo)) return { ok: false, problema: "aviso_correo" };
  if (!anonimo && (!nombre || !correo)) return { ok: false, problema: "aviso_identidad" };
  if (!anonimo && !d.declaracion) return { ok: false, problema: "aviso_declaracion" };
  return { ok: true, value: { ruta, motivo: d.motivo, explicacion, nombre: nombre || null, correo: correo || null } };
}

/** Reduce una dirección a su ruta dentro de Lona («/peleadores/ana»). Acepta la dirección completa o solo la ruta; cualquier otra web, null. */
export function rutaDeLona(direccion: string, appUrl: string): string | null {
  const texto = direccion.trim();
  if (!texto || texto.length > 500 || /[\u0000-\u001f\u007f\\]/.test(texto)) return null;
  let base: URL;
  try { base = new URL(appUrl); } catch { return null; }
  try {
    const u = texto.startsWith("/") && !texto.startsWith("//") ? new URL(texto, base) : new URL(/^https?:\/\//i.test(texto) ? texto : `https://${texto}`);
    const mismoSitio = u.host === base.host || u.host === `www.${base.host}` || `www.${u.host}` === base.host;
    if (!mismoSitio) return null;
    return (u.pathname + u.search + u.hash) || "/";
  } catch {
    return null;
  }
}
