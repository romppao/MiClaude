"use server";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { ubicarGimnasio } from "../../lib/common/geo";
import { excludedGymProvince } from "../../lib/common/gym-policy";
import { db } from "../../lib/common/db";
import { requireVerifiedUser } from "../../lib/accounts/auth";
import { profileKind, profileAccess } from "../../lib/profiles/profiles";
import { imagePosition, normalizeImage } from "../../lib/profiles/images";
import { safeHttpUrl } from "../../lib/common/url";
import { audit } from "../../lib/common/audit";
import { registrarFallo } from "../../lib/common/fallos";
import { borrarFotos, guardarFoto, type FotoGuardada } from "../../lib/media/fotos";
import { slugName } from "../../lib/common/labels";
import { provinciaConGimnasios } from "../../lib/common/territorio";
import { oneLine } from "../../lib/common/text";
import { str, go, checkLengths } from "./shared";

export async function saveProfile(f: FormData) {
  const user = await requireVerifiedUser();
  const kind = profileKind(str(f, "kind")); const id = str(f, "entityId");
  if (!kind || !id || id.length > 100) go("/mi-cuenta", { problema: "sin_permiso" });
  const back = `/perfiles/${kind}/${id}/editar`;
  const { source, editable } = await profileAccess(kind, id, user);
  if (!source || !editable) go("/mi-cuenta", { problema: "sin_permiso" });
  checkLengths(f, back, { bio: 2000, website: 500, city: 100, name: 150, ownerEmail: 200, address: 200, trainerGym: 120 });
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
  // Las fotos nuevas van al almacén de fotos (o a la base si no hay almacén: lib/media/fotos.ts); las que se sustituyen o quitan se borran después.
  const sinFoto: FotoGuardada = { clave: null, bytes: null };
  let foto: FotoGuardada | undefined, fondo: FotoGuardada | undefined;
  try {
    foto = avatar === undefined ? undefined : avatar ? await guardarFoto("perfiles", avatar) : sinFoto;
    fondo = banner === undefined ? undefined : banner ? await guardarFoto("perfiles", banner) : sinFoto;
  } catch (e) {
    await borrarFotos([foto?.clave]);
    await registrarFallo({ origen: "ACCION", contexto: "No se pudo guardar una foto de perfil en el almacén", error: e });
    go(back, { problema: "foto_no_guardada" });
  }
  const anterior = foto || fondo ? await db.profile.findUnique({ where: { kind_entityId: { kind, entityId: id } }, select: { avatarKey: true, bannerKey: true } }) : null;
  const data = { bio: str(f, "bio") || null, website, city: str(f, "city") || null, name: kind === "federacion" ? str(f, "name") || source.name : undefined, ownerId, avatar: foto?.bytes, avatarKey: foto?.clave, banner: fondo?.bytes, bannerKey: fondo?.clave, hasAvatar: avatar === undefined ? undefined : avatar !== null, hasBanner: banner === undefined ? undefined : banner !== null, avatarX: avatarX!, avatarY: avatarY!, bannerX: bannerX!, bannerY: bannerY! };
  // Dirección del gimnasio (mapa de /gimnasios, 13 de octubre de 2026): si cambia, se borran sus coordenadas y se vuelven a buscar.
  const address = kind === "gimnasio" && f.has("address") ? str(f, "address") || null : undefined;
  const gymAntes = address !== undefined ? await db.gym.findUnique({ where: { id }, select: { address: true } }) : null;
  const direccionCambiada = address !== undefined && (gymAntes?.address ?? null) !== address;
  try {
    await db.$transaction(async tx => {
      // El mismo permiso de edición del perfil protege la vinculación del gimnasio del entrenador.
      if (kind === "entrenador" && f.has("trainerGym")) {
        const trainer = await tx.trainer.findUniqueOrThrow({ where: { id } });
        const name = oneLine(str(f, "trainerGym"));
        const city = trainer.city ?? trainer.province ?? "";
        // En las provincias sin gimnasios en Lona (Cataluña) el entrenador se queda sin gimnasio vinculado (T-016, C5-02).
        const gymId = name && provinciaConGimnasios(trainer.province) ? (await tx.gym.upsert({ where: { slug: slugName(name, city) }, create: { name, slug: slugName(name, city), city, province: trainer.province ?? "" }, update: {} })).id : null;
        await tx.trainer.update({ where: { id }, data: { gymId } });
        await audit({ userId: user.id, entity: "TRAINER", entityId: id, action: "PROFILE_UPDATED", before: { gymId: trainer.gymId }, after: { gymId } }, tx);
      }
      if (kind === "gimnasio") await tx.gym.update({ where: { id }, data: { source: user.role === "ADMIN" ? "MANUAL" : "PROPIETARIO", ...(user.role === "ADMIN" && f.has("ownerEmail") ? { ownerUserId: ownerId ?? null, claimedAt: ownerId ? new Date() : null } : {}) } });
      if (direccionCambiada) await tx.gym.update({ where: { id }, data: { address, lat: null, lng: null, geoSource: null, geocodedAt: null } });
      await tx.profile.upsert({ where: { kind_entityId: { kind, entityId: id } }, create: { kind, entityId: id, ...data }, update: data });
      await audit({ userId: user.id, entity: "PROFILE", entityId: id, action: "PROFILE_UPDATED", after: { kind, imagesUpdated: avatar !== undefined || banner !== undefined } }, tx);
    });
  } catch (e) {
    await borrarFotos([foto?.clave, fondo?.clave]); // no se guardó el perfil: las fotos nuevas no deben quedarse huérfanas en el almacén
    throw e;
  }
  await borrarFotos([foto && anterior?.avatarKey, fondo && anterior?.bannerKey]);
  if (direccionCambiada) after(() => ubicarGimnasio(id));
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
