/** A dónde lleva a cada papel el acceso y la confirmación del correo (una sola regla para toda la aplicación). */
export function landingFor(role: string): string {
  if (role === "ADMIN") return "/moderacion";
  if (role === "ORGANIZER") return "/organizador";
  if (role === "FIGHTER") return "/mi-ficha";
  return "/";
}

/** Tipos de cuenta que se pueden crear desde el registro (un panel por tipo). */
export const TIPOS_DE_CUENTA = ["usuario", "peleador", "entidad"] as const;
export type TipoDeCuenta = (typeof TIPOS_DE_CUENTA)[number];
export const parseTipoDeCuenta = (v: string, role = ""): TipoDeCuenta => TIPOS_DE_CUENTA.find((t) => t === v) ?? (role === "FIGHTER" ? "peleador" : "usuario");

/** Tipos de entidad que pueden pedir ser organizadoras. */
export const TIPOS_DE_ENTIDAD = ["PROMOTORA", "FEDERACION"] as const;
export type TipoDeEntidad = (typeof TIPOS_DE_ENTIDAD)[number];
export const TIPO_DE_ENTIDAD_ETIQUETA: Record<TipoDeEntidad, string> = { PROMOTORA: "Promotora", FEDERACION: "Federación" };
export const parseTipoDeEntidad = (v: string): TipoDeEntidad | null => TIPOS_DE_ENTIDAD.find((t) => t === v) ?? null;
