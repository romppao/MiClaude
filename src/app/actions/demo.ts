// Acciones del modo demostración (solo funcionan con DEMO_MODE=si; en una instalación real se niegan).
// Todo lo que se exporta aquí es un punto de entrada público del servidor (POST).
"use server";

import { revalidatePath } from "next/cache";
import { db } from "../../lib/common/db";
import { requireUser } from "../../lib/accounts/auth";
import { audit } from "../../lib/common/audit";
import { DEMO_PAPELES, demoActiva } from "../../lib/common/demo";
import { hasOwn } from "../../lib/common/safe";
import { go, str } from "./shared";

/** Demostración: confirma el correo de la cuenta con un botón, porque la demo no envía correos. */
export async function demoConfirmarCorreo() {
  const user = await requireUser();
  if (!demoActiva()) go("/", { problema: "demo_no_activa" });
  if (!user.emailVerifiedAt) {
    await db.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date() } });
    await audit({ userId: user.id, entity: "USER", entityId: user.id, action: "DEMO_EMAIL_VERIFIED" });
  }
  revalidatePath("/", "layout");
  go("/verificar", { aviso: "correo_verificado" });
}

/** Demostración: cambia el papel de la cuenta (aficionado, peleador, organizador o moderador) para probar cada parte de la aplicación. */
export async function demoCambiarPapel(f: FormData) {
  const user = await requireUser();
  if (!demoActiva()) go("/", { problema: "demo_no_activa" });
  const papel = str(f, "papel");
  if (!hasOwn(DEMO_PAPELES, papel)) go("/mi-cuenta", { problema: "demo_papel_invalido" });
  await db.$transaction(async (tx) => {
    await tx.user.update({ where: { id: user.id }, data: { role: papel as keyof typeof DEMO_PAPELES } });
    // Un organizador aparece como «verificado» porque tiene una solicitud aprobada: en la demo se crea sola.
    if (papel === "ORGANIZER") {
      await tx.organizerRequest.upsert({
        where: { userId: user.id },
        create: { userId: user.id, orgName: "Organización de demostración", message: "Creada por el modo demostración", status: "APPROVED", reviewNote: "Demostración", reviewedAt: new Date() },
        update: { status: "APPROVED", reviewedAt: new Date() },
      });
    }
    await audit({ userId: user.id, entity: "USER", entityId: user.id, action: "DEMO_ROLE_CHANGED", before: { role: user.role }, after: { role: papel } }, tx);
  });
  revalidatePath("/", "layout");
  go("/mi-cuenta", { aviso: "demo_papel_cambiado" });
}
