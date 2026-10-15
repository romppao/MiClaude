// Avisos personales: solo la cuenta de la sesión puede marcarlos como leídos.
"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "../../lib/accounts/auth";
import { db } from "../../lib/common/db";
import { go, str } from "./shared";

export async function readNotification(f: FormData) {
  const user = await requireUser("/avisos");
  const id = str(f, "notificationId");
  if (!id || id.length > 40) go("/avisos", { problema: "no_existe" });
  const changed = await db.notification.updateMany({ where: { id, userId: user.id, readAt: null }, data: { readAt: new Date() } });
  if (changed.count !== 1) go("/avisos", { problema: "no_existe" });
  revalidatePath("/", "layout"); go("/avisos", { aviso: "aviso_leido" });
}
export async function readAllNotifications() {
  const user = await requireUser("/avisos");
  await db.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
  revalidatePath("/", "layout"); go("/avisos", { aviso: "avisos_leidos" });
}
