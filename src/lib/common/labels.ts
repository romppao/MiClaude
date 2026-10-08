export const LEVEL_LABEL = { PRO: "Profesional", AMATEUR: "Amateur" } as const;
/** Velada (cartel abierto) o interclub (encuentro entre clubes). El texto de ayuda acompaña al formulario de creación. */
export const EVENT_KIND_LABEL = { VELADA: "Velada", INTERCLUB: "Interclub" } as const;
export const EVENT_KIND_AYUDA = { VELADA: "Cartel abierto al público, con peleadores de varios clubes.", INTERCLUB: "Encuentro entre clubes, normalmente amateur, para dar experiencia a sus peleadores." } as const;
export const parseEventKind = (v: string): "VELADA" | "INTERCLUB" | null => (v === "VELADA" || v === "INTERCLUB" ? v : null);
export const STANCE_LABEL = { ORTODOXO: "Ortodoxo", ZURDO: "Zurdo", AMBIDIESTRO: "Ambidiestro" } as const;
export const METHOD_LABEL = {
  KO: "KO", TKO: "TKO", UD: "Decisión unánime", SD: "Decisión dividida",
  MD: "Decisión mayoritaria", RTD: "Abandono", DQ: "Descalificación", DRAW: "Empate", NC: "Sin decisión",
  SUBMISSION: "Sumisión", POINTS: "Puntos", ADVANTAGE: "Ventajas",
} as const;

export const PROVINCES = [
  "A Coruña","Álava","Albacete","Alicante","Almería","Asturias","Ávila","Badajoz","Baleares","Barcelona",
  "Burgos","Cáceres","Cádiz","Cantabria","Castellón","Ciudad Real","Córdoba","Cuenca","Girona","Granada",
  "Guadalajara","Gipuzkoa","Huelva","Huesca","Jaén","La Rioja","Las Palmas","León","Lleida","Lugo","Madrid",
  "Málaga","Murcia","Navarra","Ourense","Palencia","Pontevedra","Salamanca","Santa Cruz de Tenerife",
  "Segovia","Sevilla","Soria","Tarragona","Teruel","Toledo","Valencia","Valladolid","Bizkaia","Zamora",
  "Zaragoza","Ceuta","Melilla",
].sort((a, b) => a.localeCompare(b, "es")); // por el nombre que se muestra (Bizkaia entre Badajoz y Burgos, no entre Valladolid y Zamora)

export const fmtDate = (d: Date) =>
  d.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Madrid" });

export const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/** Huella corta y estable de un texto (FNV-1a de 32 bits, en hexadecimal): distingue nombres que el slug dejaría iguales. */
export const shortHash = (s: string): string => {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, "0");
};

/**
 * Slug de un nombre con datos que lo acompañan (ciudad, fecha…). Si el nombre no tiene ninguna letra latina (por ejemplo «Ёлка» o «拳道»),
 * `slugify` lo dejaría vacío y dos nombres distintos acabarían con el mismo slug (y se fundirían en una sola velada o gimnasio):
 * en ese caso el slug lleva además una huella corta del nombre.
 */
export const slugName = (name: string, ...acompanantes: string[]): string =>
  slugify(name) ? slugify([name, ...acompanantes].join(" ")) : `${slugify(acompanantes.join(" ")) || "sin-nombre"}-${shortHash(name)}`;

/** Cómo se llama en pantalla cada nivel de respaldo de un combate. */
export const VERIFICATION_LABEL = {
  SELF_REPORTED: "declarado · confirmación opcional",
  CONFIRMED: "confirmado por el rival",
  VERIFIED: "verificado",
  DISPUTED: "en revisión",
} as const;

/** Resultado de un combate desde el punto de vista de un peleador, con palabras (no letras sueltas). */
export function resultWord(result: "A_WIN" | "B_WIN" | "DRAW" | "NO_CONTEST" | null, isCornerA: boolean): { text: string; cls: "W" | "L" | "D" | "" } {
  if (!result) return { text: "Sin resultado", cls: "" };
  if (result === "DRAW") return { text: "Empate", cls: "D" };
  if (result === "NO_CONTEST") return { text: "Sin decisión", cls: "D" };
  return (result === "A_WIN") === isCornerA ? { text: "Victoria", cls: "W" } : { text: "Derrota", cls: "L" };
}

/** Historial de cambios: nombres en español de lo que cambia y de la acción (lo desconocido se muestra en palabras sueltas). */
export const AUDIT_ENTITY_LABEL: Record<string, string> = {
  ACHIEVEMENT: "título", ACCREDITATION: "acreditación",
  BOUT: "Combate", EVENT: "Velada", FIGHTER: "Ficha de peleador", GYM: "Gimnasio", CLAIM: "Reclamación de ficha",
  ORGANIZER: "Solicitud de organizador", REPORT: "Aviso de error", USER: "Cuenta",
};
export const AUDIT_ACTION_LABEL: Record<string, string> = {
  UPDATED: "corregido", WITHDRAWN: "retirado", REVIEW_REQUESTED: "revisión solicitada", ENDORSE: "respaldado", REJECT: "excluido por moderación", RESTORE: "restaurado como declarado", GRANTED: "acreditación concedida", REVOKED: "acreditación retirada",
  CREATED: "creado", CREATED_BY_ORGANIZER: "añadido al cartel por el organizador", RESULT_SET: "resultado indicado", RESULT_SET_BY_AUTHOR: "resultado indicado por quien lo registró",
  RIVAL_REVIEW_REQUESTED: "revisión solicitada por el rival", ENDORSED: "respaldo del hecho comprobado", WITHDRAWAL_UNDONE: "retirada del título deshecha", EVIDENCE_SET: "enlace de evidencia cambiado", RIVAL_CONFIRMED: "confirmado por el rival", RIVAL_DISPUTED: "rechazado por el rival", ADMIN_VERIFIED: "verificado por un moderador",
  ADMIN_DISPUTED: "marcado como no correcto por un moderador", ADMIN_SELF_REPORTED: "restaurado como pendiente por un moderador",
  APPROVED: "aprobada", REJECTED: "rechazada", VERIFIED: "sello de verificado concedido", VERIFICATION_REVOKED: "sello de verificado retirado",
  DISCIPLINE_ADDED: "disciplina añadida", DISCIPLINE_UPDATED: "disciplina modificada", PROFILE_UPDATED: "datos de la ficha modificados",
  RESOLVED: "cerrado como corregido", DISMISSED: "cerrado sin error", RESOLVED_AND_HIDDEN: "cerrado y contenido ocultado",
  ACCOUNT_UPDATED: "datos de la cuenta modificados", ACCOUNT_DELETED: "cuenta eliminada",
};
