export const LEVEL_LABEL = { PRO: "Profesional", AMATEUR: "Amateur" } as const;
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
];

export const fmtDate = (d: Date) =>
  d.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Madrid" });

export const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/** Cómo se llama en pantalla cada nivel de respaldo de un combate. */
export const VERIFICATION_LABEL = {
  SELF_REPORTED: "pendiente de confirmar",
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
  BOUT: "Combate", EVENT: "Velada", FIGHTER: "Ficha de peleador", GYM: "Gimnasio", CLAIM: "Reclamación de ficha",
  ORGANIZER: "Solicitud de organizador", REPORT: "Aviso de error", USER: "Cuenta",
};
export const AUDIT_ACTION_LABEL: Record<string, string> = {
  CREATED: "creado", CREATED_BY_ORGANIZER: "añadido al cartel por el organizador", RESULT_SET: "resultado indicado", RESULT_SET_BY_AUTHOR: "resultado indicado por quien lo registró",
  EVIDENCE_SET: "enlace de evidencia cambiado", RIVAL_CONFIRMED: "confirmado por el rival", RIVAL_DISPUTED: "rechazado por el rival", ADMIN_VERIFIED: "verificado por un moderador",
  ADMIN_DISPUTED: "marcado como no correcto por un moderador", ADMIN_SELF_REPORTED: "restaurado como pendiente por un moderador",
  APPROVED: "aprobada", REJECTED: "rechazada", VERIFIED: "sello de verificado concedido", VERIFICATION_REVOKED: "sello de verificado retirado",
  DISCIPLINE_ADDED: "disciplina añadida", DISCIPLINE_UPDATED: "disciplina modificada", PROFILE_UPDATED: "datos de la ficha modificados",
  RESOLVED: "cerrado como corregido", DISMISSED: "cerrado sin error", RESOLVED_AND_HIDDEN: "cerrado y contenido ocultado",
  ACCOUNT_UPDATED: "datos de la cuenta modificados", ACCOUNT_DELETED: "cuenta eliminada",
};
