import { randomBytes, scrypt as scryptCallback, timingSafeEqual, type ScryptOptions } from "node:crypto";

/**
 * Contraseñas con scrypt. El valor guardado lleva sus propios parámetros («scrypt$N$r$p$sal$hash»), de modo que
 * se pueden reforzar en el futuro sin invalidar las cuentas existentes: al iniciar sesión, un hash con parámetros
 * antiguos se recalcula con los actuales (`needsRehash`). El formato anterior («sal:hash», con los valores por
 * defecto de Node) sigue verificándose.
 *
 * Se usa la versión asíncrona: el cálculo va al grupo de hilos de Node y no bloquea el resto de peticiones.
 */
const CURRENT = { N: 2 ** 16, r: 8, p: 2 } as const; // recomendación de OWASP: 64 MiB, r=8, p=2
const LEGACY = { N: 16384, r: 8, p: 1 } as const;
const KEY_LENGTH = 64;
const MAX_MEMORY = 256 * 1024 * 1024;

type Params = { N: number; r: number; p: number };

const derive = (password: string, salt: Buffer, { N, r, p }: Params): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const options: ScryptOptions = { N, r, p, maxmem: MAX_MEMORY };
    scryptCallback(password, salt, KEY_LENGTH, options, (error, key) => (error ? reject(error) : resolve(key)));
  });

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, CURRENT);
  return `scrypt$${CURRENT.N}$${CURRENT.r}$${CURRENT.p}$${salt.toString("hex")}$${key.toString("hex")}`;
}

/** Interpreta el valor guardado: formato actual con parámetros, o formato anterior «sal:hash». */
function parse(stored: string): { params: Params; salt: string; hash: string } | null {
  if (stored.startsWith("scrypt$")) {
    const [, n, r, p, salt, hash] = stored.split("$");
    const params = { N: Number(n), r: Number(r), p: Number(p) };
    if (!salt || !hash || ![params.N, params.r, params.p].every((v) => Number.isInteger(v) && v > 0)) return null;
    // Se rechazan parámetros desmesurados: un valor manipulado en la base de datos no debe poder agotar la memoria.
    if (params.N > 2 ** 20 || params.r > 32 || params.p > 16) return null;
    return { params, salt, hash };
  }
  const [salt, hash] = stored.split(":");
  return salt && hash ? { params: LEGACY, salt, hash } : null;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parsed = parse(stored);
  if (!parsed) return false;
  const expected = Buffer.from(parsed.hash, "hex");
  if (expected.length !== KEY_LENGTH) return false;
  const actual = await derive(password, Buffer.from(parsed.salt, "hex"), parsed.params);
  return timingSafeEqual(actual, expected);
}

/** ¿El hash guardado usa el formato o los parámetros antiguos? Si es así, conviene recalcularlo al iniciar sesión. */
export function needsRehash(stored: string): boolean {
  const parsed = parse(stored);
  if (!parsed) return false;
  return parsed.params.N < CURRENT.N || parsed.params.r < CURRENT.r || parsed.params.p < CURRENT.p;
}

let dummy: Promise<string> | undefined;
/**
 * Hash de mentira con los parámetros actuales. Cuando el correo no existe se verifica contra él, para que iniciar
 * sesión tarde lo mismo exista o no la cuenta y no se pueda averiguar qué correos están registrados.
 */
export const dummyHash = (): Promise<string> => (dummy ??= hashPassword(randomBytes(16).toString("hex")));
