import { db } from "../common/db";
import { isEmail } from "../common/text";
import { correoCreador } from "./creador";

/**
 * Acceso anticipado (17 de octubre de 2026, petición del fundador: «haré un acceso anticipado a personas concretas»). Mientras está encendido,
 * solo crean cuenta —con correo o con Google— los correos de la lista que lleva moderación en /moderacion/acceso-anticipado. Quien ya tiene
 * cuenta entra igual. Apagado por defecto: la demo y las pruebas no cambian. Guía para el fundador: docs/ACCESO-ANTICIPADO.md.
 */
export const AJUSTE_ACCESO_ANTICIPADO = "acceso_anticipado";
/** Correos que se pueden añadir de una vez (pegados en el cuadro de texto). */
export const MAX_CORREOS_POR_ENVIO = 200;

/** Separa un texto pegado (una línea por correo, o separados por comas, puntos y comas o espacios) en correos válidos, sin repetir, y los que no lo son. */
export function leerCorreos(texto: string): { validos: string[]; invalidos: string[] } {
  const validos: string[] = [];
  const invalidos: string[] = [];
  for (const trozo of texto.split(/[\s,;]+/)) {
    const c = trozo.trim().replace(/^<|>$/g, "").toLowerCase();
    if (!c) continue;
    if (!isEmail(c)) { if (!invalidos.includes(trozo.trim())) invalidos.push(trozo.trim()); continue; }
    if (!validos.includes(c)) validos.push(c);
  }
  return { validos, invalidos };
}

/** ¿Puede crear cuenta este correo? Con el acceso anticipado apagado, todo el mundo; encendido, la lista y la cuenta del creador. */
export function decidirAlta(d: { activo: boolean; invitado: boolean; esCorreoDelCreador: boolean }): boolean {
  return !d.activo || d.invitado || d.esCorreoDelCreador;
}

export async function accesoAnticipadoActivo(): Promise<boolean> {
  const a = await db.appSetting.findUnique({ where: { key: AJUSTE_ACCESO_ANTICIPADO }, select: { value: true } });
  return a?.value === "si";
}

/** Lo que se comprueba antes de crear una cuenta (registro con correo o primera entrada con Google). */
export async function puedeCrearCuenta(email: string): Promise<boolean> {
  const correo = email.trim().toLowerCase();
  const activo = await accesoAnticipadoActivo();
  if (!activo) return true;
  const invitado = !!(await db.earlyAccessInvite.findUnique({ where: { email: correo }, select: { email: true } }));
  return decidirAlta({ activo, invitado, esCorreoDelCreador: !!correoCreador() && correo === correoCreador() });
}
