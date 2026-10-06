"use server";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { db } from "../../lib/common/db";
import { requireVerifiedUser } from "../../lib/accounts/auth";
import { profileKind, profileAccess } from "../../lib/profiles/profiles";
import { imagePosition, normalizeImage } from "../../lib/profiles/images";
import { getImageStore } from "../../lib/common/imageStore";
import { imageKey } from "../../lib/common/imageKeys";
import { safeHttpUrl } from "../../lib/common/url";
import { audit } from "../../lib/common/audit";
import { str, go, checkLengths } from "./shared";

export async function saveProfile(f: FormData) {
  const user = await requireVerifiedUser();
  const kind = profileKind(str(f, "kind")); const id = str(f, "entityId");
  if (!kind || !id || id.length > 100) go("/mi-cuenta", { problema: "sin_permiso" });
  const back = `/perfiles/${kind}/${id}/editar`;
  const { source, editable } = await profileAccess(kind, id, user);
  if (!source || !editable) go("/mi-cuenta", { problema: "sin_permiso" });
  checkLengths(f, back, { bio: 2000, website: 500, city: 100, name: 150, ownerEmail: 200 });
  const website = str(f, "website") ? safeHttpUrl(str(f, "website")) : null;
  if (str(f, "website") && !website) go(back, { problema: "enlace_invalido" });
  const avatarX = imagePosition(str(f, "avatarX")), avatarY = imagePosition(str(f, "avatarY"));
  const bannerX = imagePosition(str(f, "bannerX")), bannerY = imagePosition(str(f, "bannerY"));
  if ([avatarX, avatarY, bannerX, bannerY].some(v => v === null)) go(back, { problema: "imagen_invalida" });
  let avatar: Uint8Array<ArrayBuffer> | null | undefined, banner: Uint8Array<ArrayBuffer> | null | undefined;
  try {
    const photo = f.get("avatar"), cover = f.get("banner");
    if (photo instanceof File && photo.size) avatar = await normalizeImage(photo, "avatar");
    else if (str(f, "removeAvatar") === "on") avatar = null;
    if (cover instanceof File && cover.size) banner = await normalizeImage(cover, "banner");
    else if (str(f, "removeBanner") === "on") banner = null;
  } catch { go(back, { problema: "imagen_invalida" }); }
  let ownerId: string | null | undefined = source.ownerId ?? undefined;
  if (user.role === "ADMIN" && kind !== "peleador" && kind !== "promotor") {
    const email = str(f, "ownerEmail").toLowerCase();
    const owner = email ? await db.user.findUnique({ where: { email } }) : null;
    if (email && !owner?.emailVerifiedAt) go(back, { problema: "titular_invalido" });
    ownerId = owner?.id ?? null;
  }
  const data = { bio: str(f, "bio") || null, website, city: str(f, "city") || null, name: kind === "federacion" ? str(f, "name") || source.name : undefined, ownerId, hasAvatar: avatar === undefined ? undefined : avatar !== null, hasBanner: banner === undefined ? undefined : banner !== null, avatarX: avatarX!, avatarY: avatarY!, bannerX: bannerX!, bannerY: bannerY! };
  await db.$transaction(async tx => {
    await tx.profile.upsert({ where: { kind_entityId: { kind, entityId: id } }, create: { kind, entityId: id, ...data }, update: data });
    // Los bytes pasan por el almacén de imágenes (hoy la propia base de datos, dentro de la misma transacción).
    const store = getImageStore();
    if (avatar) await store.put(imageKey(kind, id, "avatar"), avatar, "image/webp", tx); else if (avatar === null) await store.delete(imageKey(kind, id, "avatar"), tx);
    if (banner) await store.put(imageKey(kind, id, "banner"), banner, "image/webp", tx); else if (banner === null) await store.delete(imageKey(kind, id, "banner"), tx);
    await audit({ userId: user.id, entity: "PROFILE", entityId: id, action: "PROFILE_UPDATED", after: { kind, imagesUpdated: avatar !== undefined || banner !== undefined } }, tx);
  });
  revalidatePath("/", "layout"); go(back, { aviso: "perfil_guardado" });
}
export async function createFederation(f: FormData) {
  const user = await requireVerifiedUser();
  if (user.role !== "ADMIN") go("/federaciones", { problema: "sin_permiso" });
  checkLengths(f, "/federaciones", { name: 150 });
  const name = str(f, "name"); if (!name) go("/federaciones", { problema: "nombre_ficha" });
  const id = randomUUID();
  await db.profile.create({ data: { kind: "federacion", entityId: id, name } });
  await audit({ userId: user.id, entity: "PROFILE", entityId: id, action: "FEDERATION_CREATED", after: { name } });
  go(`/perfiles/federacion/${id}/editar`);
}
