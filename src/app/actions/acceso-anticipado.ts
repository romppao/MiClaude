"use server";

// Acceso anticipado: moderación lo enciende o lo apaga y lleva la lista de correos invitados (lib/accounts/acceso-anticipado.ts).
// Todo lo que se exporta aquí es un punto de entrada público del servidor (POST): los ayudantes van sin exportar o en ./shared.

import { revalidatePath } from "next/cache";
import { db } from "../../lib/common/db";
import { audit } from "../../lib/common/audit";
import { requireAdmin } from "../../lib/accounts/permissions";
import { AJUSTE_ACCESO_ANTICIPADO, MAX_CORREOS_POR_ENVIO, leerCorreos } from "../../lib/accounts/acceso-anticipado";
import { go, str } from "./shared";

const AQUI = "/moderacion/acceso-anticipado";

/** Enciende o apaga el acceso anticipado. Encendido, solo crean cuenta los correos de la lista; quien ya tiene cuenta no cambia. */
export async function cambiarAccesoAnticipado(f: FormData) {
  const admin = await requireAdmin();
  const encender = str(f, "estado") === "si";
  const value = encender ? "si" : "no";
  await db.$transaction([
    db.appSetting.upsert({ where: { key: AJUSTE_ACCESO_ANTICIPADO }, create: { key: AJUSTE_ACCESO_ANTICIPADO, value }, update: { value } }),
    db.auditLog.create({ data: { userId: admin.id, entity: "SETTING", entityId: AJUSTE_ACCESO_ANTICIPADO, action: encender ? "EARLY_ACCESS_ON" : "EARLY_ACCESS_OFF" } }),
  ]);
  revalidatePath("/", "layout");
  go(AQUI, { aviso: encender ? "acceso_activado" : "acceso_desactivado" });
}

/** Añade correos a la lista (pegados, uno por línea). Los repetidos se ignoran; en el historial solo queda cuántos, no los correos. */
export async function invitarAccesoAnticipado(f: FormData) {
  const admin = await requireAdmin();
  const { validos, invalidos } = leerCorreos(str(f, "correos"));
  if (!validos.length) go(AQUI, { problema: invalidos.length ? "acceso_correos_no_validos" : "acceso_correos_vacios" });
  if (validos.length > MAX_CORREOS_POR_ENVIO) go(AQUI, { problema: "acceso_demasiados" });
  const note = str(f, "nota").slice(0, 200) || null;
  const { count } = await db.earlyAccessInvite.createMany({ data: validos.map((email) => ({ email, note, addedById: admin.id })), skipDuplicates: true });
  await audit({ userId: admin.id, entity: "EARLY_ACCESS", entityId: "lista", action: "INVITES_ADDED", after: { anadidos: count, repetidos: validos.length - count, noValidos: invalidos.length } });
  go(AQUI, { aviso: invalidos.length ? "acceso_invitados_con_errores" : "acceso_invitados" });
}

/** Quita un correo de la lista. Si esa persona ya creó su cuenta, la conserva: solo deja de estar invitada. */
export async function quitarAccesoAnticipado(f: FormData) {
  const admin = await requireAdmin();
  const { count } = await db.earlyAccessInvite.deleteMany({ where: { email: str(f, "correo").toLowerCase() } });
  if (count) await audit({ userId: admin.id, entity: "EARLY_ACCESS", entityId: "lista", action: "INVITE_REMOVED" });
  go(AQUI, { aviso: "acceso_quitado" });
}
