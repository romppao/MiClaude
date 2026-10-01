/** Longitudes máximas de los textos que escribe el usuario. Los formularios usan los mismos valores en maxLength. */
export const LIMITS = {
  name: 80, firstName: 80, lastName: 120, alias: 60, gym: 100, city: 80, venue: 120, eventName: 120,
  orgName: 120, promoter: 120, bio: 600, message: 500, note: 500, comment: 500, email: 254, password: 200, url: 500,
} as const;

/** Devuelve la primera clave cuyo valor supera su longitud máxima, o null si todas caben. */
export function firstTooLong(values: Record<string, string>, limits: Record<string, number>): string | null {
  for (const [k, v] of Object.entries(values)) if (limits[k] != null && v.length > limits[k]) return k;
  return null;
}

/** Correo válido de forma estricta: un solo destinatario, sin espacios ni comas, con dominio y de longitud razonable. */
export function isEmail(s: string): boolean {
  return s.length <= LIMITS.email && /^[^\s@,;<>()"]+@[^\s@,;<>()"]+\.[^\s@,;<>()"]{2,}$/.test(s);
}

/** Quita saltos de línea y caracteres de control (para usar un texto de usuario en un asunto o cabecera de correo). */
export const oneLine = (s: string): string => s.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();

export const plural = (n: number, uno: string, varios: string): string => `${n} ${n === 1 ? uno : varios}`;
