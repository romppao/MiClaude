/** ¿Tiene el objeto esa clave PROPIA? (`in` recorre la cadena de prototipos y acepta «__proto__», «constructor»…) */
export const hasOwn = (obj: object, key: string): boolean => Object.prototype.hasOwnProperty.call(obj, key);

/** Lee una clave de un diccionario de textos ignorando las heredadas; devuelve undefined si no es propia. */
export function lookup<T>(obj: Record<string, T>, key: string | null | undefined): T | undefined {
  return key != null && hasOwn(obj, key) ? obj[key] : undefined;
}

/** Un parámetro de la URL puede llegar repetido (?q=a&q=b) como lista: se toma el primero. */
export const oneParam = (v: string | string[] | undefined): string | undefined => (Array.isArray(v) ? v[0] : v);

/** Todos los parámetros de la URL con un solo valor cada uno (el primero si llegan repetidos): los listados los reciben ya «aplanados». */
export function flatParams(raw: Record<string, string | string[] | undefined>): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const k of Object.keys(raw)) out[k] = oneParam(raw[k]);
  return out;
}
