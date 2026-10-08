/**
 * Cuenta del creador (petición del fundador, 8 de octubre de 2026): «un usuario especial, yo como creador de la aplicación, para
 * poder entrar desde cualquier sitio con esa clave y modificar y gestionar cualquier aspecto dentro de la aplicación».
 *
 * - Cuál es: la cuenta cuyo correo electrónico está en la variable CREADOR_CORREO (se pone en el panel del alojamiento, nunca en el
 *   código), con el correo verificado. Siempre tiene los permisos de moderación y, además, gestiona cuentas y moderadores.
 * - Cómo se protege: es la cuenta que más interesa robar, así que además de la contraseña pide un segundo paso al entrar: un código
 *   de la aplicación de códigos del móvil o, sin el móvil a mano, uno de sus diez códigos de emergencia en papel (lib/accounts/totp.ts).
 */

/** Respuesta de las acciones que enseñan los códigos de emergencia una sola vez (activar el segundo paso o crear otros). */
export type EstadoCodigos = { problema?: string; codigos?: string[] };

export const correoCreador = (env: NodeJS.ProcessEnv = process.env) => (env.CREADOR_CORREO ?? "").trim().toLowerCase();

/** ¿Es esta la cuenta del creador? Exige el correo verificado: si no, bastaría con registrarse con ese correo antes que el fundador. */
export function esCreador(user: { email: string; emailVerifiedAt: Date | null } | null | undefined, env: NodeJS.ProcessEnv = process.env): boolean {
  const correo = correoCreador(env);
  return !!user && !!correo && user.email.toLowerCase() === correo && !!user.emailVerifiedAt;
}
