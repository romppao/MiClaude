import type { Prisma } from "@prisma/client";
import { dbImageStore } from "./dbImageStore";

export type StoredImage = { bytes: Buffer; contentType: string };

/**
 * Dónde viven los bytes de las fotos y banners. La base de datos solo debe conocer la referencia.
 * `tx` es opcional: con el almacén `db` permite guardar los bytes dentro de la misma transacción que el resto de la ficha.
 */
export interface ImageStore {
  put(key: string, bytes: Uint8Array<ArrayBuffer>, contentType: string, tx?: Prisma.TransactionClient): Promise<void>;
  get(key: string): Promise<StoredImage | null>;
  delete(key: string, tx?: Prisma.TransactionClient): Promise<void>;
}

/** `IMAGE_STORE=db` (por defecto): las imágenes siguen en PostgreSQL. `s3` llegará con la parte 2 de T-004 (pendiente de proveedor). */
export function getImageStore(): ImageStore {
  const modo = process.env.IMAGE_STORE || "db";
  if (modo === "db") return dbImageStore;
  throw new Error(`IMAGE_STORE="${modo}" no está disponible todavía (T-004, parte 2: pendiente de elegir proveedor).`);
}
