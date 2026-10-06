import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { parseImageKey } from "./imageKeys";
import type { ImageStore } from "./imageStore";

/** Almacén actual: los bytes están en las columnas `Profile.avatar` y `Profile.banner`. Es el único sitio que las lee o escribe. */
function partes(key: string) {
  const p = parseImageKey(key);
  if (!p) throw new Error("clave_de_imagen_invalida");
  return p;
}

export const dbImageStore: ImageStore = {
  async put(key, bytes, _contentType, tx) {
    const { kind, entityId, slot } = partes(key);
    const cliente: Prisma.TransactionClient = tx ?? db;
    const where = { kind_entityId: { kind, entityId } };
    if (slot === "avatar") await cliente.profile.upsert({ where, create: { kind, entityId, avatar: bytes, hasAvatar: true }, update: { avatar: bytes, hasAvatar: true } });
    else await cliente.profile.upsert({ where, create: { kind, entityId, banner: bytes, hasBanner: true }, update: { banner: bytes, hasBanner: true } });
  },
  async get(key) {
    const { kind, entityId, slot } = partes(key);
    const where = { kind_entityId: { kind, entityId } };
    const fila = slot === "avatar"
      ? await db.profile.findUnique({ where, select: { avatar: true } }).then((p) => p?.avatar)
      : await db.profile.findUnique({ where, select: { banner: true } }).then((p) => p?.banner);
    return fila ? { bytes: Buffer.from(fila), contentType: "image/webp" } : null;
  },
  async delete(key, tx) {
    const { kind, entityId, slot } = partes(key);
    const cliente: Prisma.TransactionClient = tx ?? db;
    const where = { kind, entityId };
    if (slot === "avatar") await cliente.profile.updateMany({ where, data: { avatar: null, hasAvatar: false } });
    else await cliente.profile.updateMany({ where, data: { banner: null, hasBanner: false } });
  },
};
