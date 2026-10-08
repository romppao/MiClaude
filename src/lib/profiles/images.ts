import sharp from "sharp";
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
/**
 * Devuelve bytes WebP de JPEG/PNG/WebP estático de hasta 4 MiB y 25 millones de píxeles.
 * Orienta según metadatos, reduce dentro del tamaño del slot y no amplía. El formato declarado por
 * el formulario no es suficiente: sharp comprueba la imagen real. Rechaza vacío, exceso o animación
 * con imagen_invalida; errores de decodificación también se propagan y la acción los traduce.
 */
export async function normalizeImage(file: File, slot: "avatar" | "banner") {
  if (file.size > MAX_IMAGE_BYTES || !file.size) throw new Error("imagen_invalida");
  const input = Buffer.from(await file.arrayBuffer());
  const pipeline = sharp(input, { limitInputPixels: 25000000, failOn: "warning" });
  const metadata = await pipeline.metadata();
  if (!metadata.format || !["jpeg", "png", "webp"].includes(metadata.format) || (metadata.pages ?? 1) > 1) throw new Error("imagen_invalida");
  return new Uint8Array(await pipeline.rotate().resize({ width: slot === "avatar" ? 640 : 1920, height: slot === "avatar" ? 640 : 1200, fit: "inside", withoutEnlargement: true }).webp({ quality: 85 }).toBuffer());
}
/** Porcentaje entero 0–100 para encuadre; devuelve null ante vacío, signo, decimal o valor fuera del rango. */
export function imagePosition(raw: string) {
  return /^\d{1,3}$/.test(raw) && Number(raw) <= 100 ? Number(raw) : null;
}
