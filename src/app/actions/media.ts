// Vídeos y fotos del público en las veladas: compartirlos y borrar los propios. Ocultarlos es cosa de moderación (avisos, entidad MEDIA).
// Todo lo que se exporta aquí es un punto de entrada público del servidor (POST): los ayudantes van sin exportar o en ./shared.
"use server";

import { revalidatePath } from "next/cache";
import { db } from "../../lib/common/db";
import { requireVerifiedUser } from "../../lib/accounts/auth";
import { audit } from "../../lib/common/audit";
import { todayMadrid } from "../../lib/common/dates";
import { normalizeImage } from "../../lib/profiles/images";
import { MAX_MEDIOS_POR_DIA, parseMedio, veladaAbiertaAlPublico } from "../../lib/media/rules";
import { almacenDeVideos, claveDe } from "../../lib/media/storage";
import { go, guard, str } from "./shared";

/** Comprueba que un vídeo subido existe, es de quien lo publica y no supera el máximo. Devuelve sus bytes o null. */
async function videoSubido(clave: string, userId: string): Promise<number | null> {
  if (!claveDe(clave, userId)) return null;
  const almacen = almacenDeVideos();
  const bytes = almacen ? await almacen.tamano(clave).catch(() => null) : null;
  return almacen && bytes && bytes <= almacen.maxBytes ? bytes : null;
}

export async function shareMedia(f: FormData) {
  const user = await requireVerifiedUser("/compartir");
  const event = await db.event.findUnique({ where: { id: str(f, "eventId") } });
  if (!event) go("/compartir", { problema: "medio_velada" });
  const back = `/compartir?velada=${event.slug}`;
  const abierta = veladaAbiertaAlPublico(event, todayMadrid());
  if (abierta !== "ok") go(back, { problema: `medio_velada_${abierta}` });
  const boutId = str(f, "boutId") || null;
  if (boutId && !(await db.bout.findFirst({ where: { id: boutId, eventId: event.id }, select: { id: true } }))) go(back, { problema: "medio_combate" });
  const foto = f.get("image");
  const hayFoto = foto instanceof File && foto.size > 0;
  const datos = parseMedio({ caption: str(f, "caption"), hayFoto, videoKey: str(f, "videoKey"), videoUrl: str(f, "videoUrl"), consentimiento: str(f, "consentimiento") === "on" });
  if (!datos.ok) go(back, { problema: datos.problema });
  if ((await db.mediaItem.count({ where: { uploaderId: user.id, createdAt: { gte: new Date(Date.now() - 864e5) } } })) >= MAX_MEDIOS_POR_DIA) go(back, { problema: "medio_limite" });
  let videoBytes: number | null = null;
  if (datos.videoKey) {
    videoBytes = await videoSubido(datos.videoKey, user.id);
    if (!videoBytes || (await db.mediaItem.findFirst({ where: { videoKey: datos.videoKey }, select: { id: true } }))) go(back, { problema: "medio_subida" });
  }
  let image: Uint8Array<ArrayBuffer> | null = null;
  if (hayFoto) {
    try { image = await normalizeImage(foto, "banner"); } catch { go(back, { problema: "imagen_invalida" }); }
  }
  const medio = await guard(back, () => db.mediaItem.create({ data: { eventId: event.id, boutId, uploaderId: user.id, kind: datos.kind, caption: datos.caption, image, videoKey: datos.videoKey, videoBytes, videoUrl: datos.videoUrl } }));
  await audit({ userId: user.id, entity: "MEDIA", entityId: medio.id, action: "CREATED", after: { eventId: event.id, boutId, kind: datos.kind, videoUrl: datos.videoUrl, subido: !!datos.videoKey } });
  revalidatePath("/", "layout");
  go(`/veladas/${event.slug}#multimedia`, { aviso: "medio_compartido" });
}

/** Quien lo subió puede borrarlo cuando quiera (también el archivo del almacén). */
export async function deleteMyMedia(f: FormData) {
  const user = await requireVerifiedUser("/mi-panel");
  const back = "/mi-panel#mis-subidas";
  const m = await db.mediaItem.findFirst({ where: { id: str(f, "mediaId"), uploaderId: user.id } });
  if (!m) go(back, { problema: "no_existe" });
  await db.mediaItem.delete({ where: { id: m.id } });
  if (m.videoKey) await almacenDeVideos()?.borrar(m.videoKey);
  await audit({ userId: user.id, entity: "MEDIA", entityId: m.id, action: "DELETED", before: { eventId: m.eventId, kind: m.kind } });
  revalidatePath("/", "layout");
  go(back, { aviso: "medio_borrado" });
}
