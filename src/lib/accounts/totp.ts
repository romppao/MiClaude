import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Códigos de un solo uso para el segundo paso al entrar (RFC 6238, el estándar de Google Authenticator, Microsoft Authenticator,
 * 1Password…): 6 cifras que cambian cada 30 segundos, calculadas con HMAC-SHA1 a partir de una clave compartida. Sin dependencias.
 * Y códigos de emergencia: diez códigos de un solo uso para entrar sin el móvil (se guardan solo como SHA-256).
 */

const ALFABETO = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export const PERIODO_S = 30;

export function base32(buf: Buffer): string {
  let bits = 0, valor = 0, out = "";
  for (const byte of buf) {
    valor = ((valor << 8) | byte) & 0xffff; bits += 8; // solo hacen falta los últimos bits
    while (bits >= 5) { out += ALFABETO[(valor >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) out += ALFABETO[(valor << (5 - bits)) & 31];
  return out;
}

export function desdeBase32(texto: string): Buffer {
  const limpio = texto.toUpperCase().replace(/[\s=-]/g, "");
  let bits = 0, valor = 0;
  const out: number[] = [];
  for (const c of limpio) {
    const i = ALFABETO.indexOf(c);
    if (i < 0) throw new Error("Clave base32 no válida");
    valor = ((valor << 5) | i) & 0xffff; bits += 5;
    if (bits >= 8) { out.push((valor >>> (bits - 8)) & 255); bits -= 8; }
  }
  return Buffer.from(out);
}

/** Clave nueva de 160 bits (la longitud que recomienda la RFC 4226), en base32. */
export const nuevaClave = () => base32(randomBytes(20));

/** La clave en grupos de cuatro, para teclearla a mano sin equivocarse. */
export const claveLegible = (clave: string) => clave.match(/.{1,4}/g)!.join(" ");

/** Intervalo de 30 s al que pertenece un instante. */
export const intervalo = (ahora = Date.now()) => Math.floor(ahora / 1000 / PERIODO_S);

/** Código de `digitos` cifras de un intervalo (RFC 4226, truncado dinámico). */
export function codigo(clave: string, paso: number, digitos = 6): string {
  const contador = Buffer.alloc(8);
  contador.writeBigUInt64BE(BigInt(paso));
  const h = createHmac("sha1", desdeBase32(clave)).update(contador).digest();
  const o = h[h.length - 1] & 15;
  const n = ((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(n % 10 ** digitos).padStart(digitos, "0");
}

const iguales = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

/**
 * Comprueba un código aceptando el intervalo anterior y el siguiente (relojes algo desajustados). Devuelve el intervalo aceptado,
 * o null. Un intervalo igual o anterior a `ultimo` se rechaza: el mismo código no sirve dos veces.
 */
export function comprobarCodigo(clave: string, introducido: string, { ahora = Date.now(), ultimo = null as number | null } = {}): number | null {
  const limpio = introducido.replace(/\s/g, "");
  if (!/^\d{6}$/.test(limpio)) return null;
  const actual = intervalo(ahora);
  for (const paso of [actual - 1, actual, actual + 1]) {
    if (ultimo !== null && paso <= ultimo) continue;
    if (iguales(codigo(clave, paso), limpio)) return paso;
  }
  return null;
}

/** Dirección «otpauth://» que abre directamente la aplicación de códigos del móvil para añadir la cuenta. */
export function enlaceApp(clave: string, cuenta: string, emisor = "Ring España") {
  const etiqueta = encodeURIComponent(`${emisor}:${cuenta}`);
  return `otpauth://totp/${etiqueta}?secret=${clave}&issuer=${encodeURIComponent(emisor)}&algorithm=SHA1&digits=6&period=${PERIODO_S}`;
}

// ---------- Códigos de emergencia ----------

const ALFABETO_EMERGENCIA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin 0/O ni 1/I, que se confunden al copiarlos a mano
const normalizar = (c: string) => c.toUpperCase().replace(/[^A-Z0-9]/g, "");
export const huella = (c: string) => createHash("sha256").update(normalizar(c)).digest("hex");

/** Diez códigos de emergencia «XXXX-XXXX»: se muestran una sola vez y se guardan solo sus huellas. */
export function nuevosCodigosEmergencia(n = 10): { claros: string[]; huellas: string[] } {
  const claros = Array.from({ length: n }, () => {
    const b = randomBytes(8);
    const s = Array.from(b, (x) => ALFABETO_EMERGENCIA[x & 31]).join("");
    return `${s.slice(0, 4)}-${s.slice(4)}`;
  });
  return { claros, huellas: claros.map(huella) };
}

/** Si el texto es uno de los códigos de emergencia que quedan, devuelve la lista sin él (se gasta); si no, null. */
export function gastarCodigoEmergencia(huellas: string[], introducido: string): string[] | null {
  if (normalizar(introducido).length !== 8) return null;
  const h = huella(introducido);
  const i = huellas.findIndex((x) => iguales(x, h));
  return i < 0 ? null : huellas.filter((_, j) => j !== i);
}
