/**
 * A dónde lleva el acceso y la confirmación del correo (una sola regla para toda la aplicación). Decisión del fundador (8 de octubre de 2026):
 * después de entrar, todas las personas ven la misma portada con la actualidad; lo propio de cada cuenta está en «Mi panel». Moderación va a su cola.
 */
export function landingFor(role: string): string {
  return role === "ADMIN" ? "/moderacion" : "/";
}

/** Papel con el que se eligen el menú, la barra inferior y «Mi panel». Una entidad pendiente de aprobar funciona como un usuario. */
export type Papel = "visitante" | "usuario" | "peleador" | "entrenador" | "entidad";
export function papelDe(user: { role: string; fighter?: unknown } | null): Papel {
  if (!user) return "visitante";
  if (user.role === "ORGANIZER") return "entidad";
  if (user.role === "TRAINER") return "entrenador";
  if (user.role === "FIGHTER" || user.fighter) return "peleador";
  return "usuario";
}

/** Quién puede crear veladas e interclubs: entidades aprobadas, entrenadores (decisión del fundador, 8 de octubre de 2026) y moderación. */
export const puedeOrganizar = (role: string) => role === "ORGANIZER" || role === "TRAINER" || role === "ADMIN";

/** Tipos de cuenta que se pueden crear desde el registro (un panel por tipo). */
export const TIPOS_DE_CUENTA = ["usuario", "peleador", "entrenador", "entidad"] as const;
export type TipoDeCuenta = (typeof TIPOS_DE_CUENTA)[number];
export const parseTipoDeCuenta = (v: string, role = ""): TipoDeCuenta => TIPOS_DE_CUENTA.find((t) => t === v) ?? (role === "FIGHTER" ? "peleador" : "usuario");

/** Papel con el que empieza cada tipo de cuenta. La entidad empieza como persona normal: el permiso de organizadora lo concede un moderador. */
export const ROL_INICIAL: Record<TipoDeCuenta, "FAN" | "FIGHTER" | "TRAINER"> = { usuario: "FAN", peleador: "FIGHTER", entrenador: "TRAINER", entidad: "FAN" };

/** Pasos del registro de cada tipo de cuenta (el primero, elegir el tipo, es común). */
export const PASOS_REGISTRO: Record<TipoDeCuenta, readonly ("tipo" | "datos" | "intereses" | "ficha" | "perfil" | "clase")[]> = {
  usuario: ["tipo", "datos", "intereses"],
  peleador: ["tipo", "datos", "ficha"],
  entrenador: ["tipo", "datos", "perfil", "clase"],
  entidad: ["tipo", "datos"],
};

/** Tipos de entidad que pueden pedir ser organizadoras. */
export const TIPOS_DE_ENTIDAD = ["PROMOTORA", "FEDERACION", "CLUB"] as const;
export type TipoDeEntidad = (typeof TIPOS_DE_ENTIDAD)[number];
export const TIPO_DE_ENTIDAD_ETIQUETA: Record<TipoDeEntidad, string> = { PROMOTORA: "Promotora", FEDERACION: "Federación", CLUB: "Club" };
export const parseTipoDeEntidad = (v: string): TipoDeEntidad | null => TIPOS_DE_ENTIDAD.find((t) => t === v) ?? null;
