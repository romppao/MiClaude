/** Claves de las imágenes de perfil: `perfiles/<tipo>/<id>/<avatar|banner>.webp`. Son iguales sea cual sea el almacén. */
export type ImageSlot = "avatar" | "banner";

export function imageKey(kind: string, entityId: string, slot: ImageSlot): string {
  return `perfiles/${kind}/${entityId}/${slot}.webp`;
}

/** Devuelve las partes de una clave, o `null` si no tiene la forma esperada (nunca se fía de una clave sin comprobarla). */
export function parseImageKey(key: string): { kind: string; entityId: string; slot: ImageSlot } | null {
  const m = /^perfiles\/([^/]{1,40})\/([^/]{1,100})\/(avatar|banner)\.webp$/.exec(key);
  return m ? { kind: m[1], entityId: m[2], slot: m[3] as ImageSlot } : null;
}
