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
