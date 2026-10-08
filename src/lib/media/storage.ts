import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, rm, stat } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { randomUUID } from "node:crypto";
import { presignar, type Credenciales } from "./s3";

/**
 * Almacén de vídeos subidos a la aplicación (petición del fundador, 8 de octubre de 2026: «subir los vídeos en la app de verdad y, si no es
 * viable, mediante enlaces»). Los vídeos no van a la base de datos: pesan demasiado.
 *
 *  - «r2»: Cloudflare R2 (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET y, para un cubo de la UE, R2_JURISDICCION=eu). El navegador
 *    sube el vídeo directamente al almacén con una dirección temporal firmada, sin pasar por nuestro servidor. Ver docs/VIDEOS.md.
 *  - «disco»: una carpeta del servidor (MEDIA_DIR). Para desarrollo, pruebas y la demo. En la demo de Render el disco se borra al
 *    reiniciar, así que los vídeos subidos allí son temporales.
 *  - Sin ninguno de los dos (producción sin R2 configurado): solo se admiten enlaces (YouTube, Instagram…).
 */
export type Almacen = {
  tipo: "r2" | "disco";
  maxBytes: number;
  /** Dónde y cómo sube el navegador el archivo. */
  subida(clave: string, tipoMime: string): { url: string; cabeceras: Record<string, string> };
  /** Tamaño del objeto si existe (para comprobar la subida antes de publicarla). */
  tamano(clave: string): Promise<number | null>;
  borrar(clave: string): Promise<void>;
};

export const TIPOS_DE_VIDEO: Record<string, string> = { "video/mp4": "mp4", "video/quicktime": "mov", "video/webm": "webm" };
const MB = 1024 * 1024;
export const MAX_VIDEO_R2 = 500 * MB;
export const MAX_VIDEO_DISCO = 100 * MB;

/** Clave de un vídeo: siempre dentro de la carpeta de quien lo sube, para que nadie pueda publicar como suyo el vídeo de otra persona. */
export const nuevaClave = (userId: string, tipoMime: string) => `videos/${userId}/${randomUUID()}.${TIPOS_DE_VIDEO[tipoMime]}`;
export const CLAVE_VALIDA = /^videos\/[a-z0-9]{8,40}\/[0-9a-f-]{36}\.(mp4|mov|webm)$/;
export const claveDe = (clave: string, userId: string) => CLAVE_VALIDA.test(clave) && clave.startsWith(`videos/${userId}/`);
export const tipoDeClave = (clave: string) => Object.keys(TIPOS_DE_VIDEO).find((t) => clave.endsWith(`.${TIPOS_DE_VIDEO[t]}`)) ?? "video/mp4";

function configuracionR2(env: NodeJS.ProcessEnv) {
  const { R2_ACCOUNT_ID: cuenta, R2_ACCESS_KEY_ID: id, R2_SECRET_ACCESS_KEY: secreto, R2_BUCKET: cubo } = env;
  if (!cuenta || !id || !secreto || !cubo) return null;
  // Cubo con jurisdicción de la Unión Europea (ADR-003): su dirección lleva «.eu». Se elige al crear el cubo y no se puede cambiar.
  const eu = env.R2_JURISDICCION === "eu" ? ".eu" : "";
  return { base: `https://${cuenta}${eu}.r2.cloudflarestorage.com/${cubo}`, credenciales: { accessKeyId: id, secretAccessKey: secreto, region: "auto" } satisfies Credenciales };
}

/** Carpeta del almacén en disco: MEDIA_DIR, o una por defecto fuera de producción (o en la demo). */
export function carpetaEnDisco(env: NodeJS.ProcessEnv = process.env): string | null {
  if (env.MEDIA_DIR) return resolve(env.MEDIA_DIR);
  if (env.NODE_ENV !== "production" || env.DEMO_MODE === "si") return resolve(".subidas");
  return null;
}

/** Ruta en disco de una clave, sin salirse nunca de la carpeta (la clave ya se valida, pero por si acaso). */
export function rutaEnDisco(carpeta: string, clave: string): string | null {
  if (!CLAVE_VALIDA.test(clave)) return null;
  const ruta = resolve(join(carpeta, clave));
  return ruta.startsWith(carpeta + sep) ? ruta : null;
}

export function almacenDeVideos(env: NodeJS.ProcessEnv = process.env): Almacen | null {
  const r2 = configuracionR2(env);
  if (r2) {
    const url = (clave: string) => `${r2.base}/${clave}`;
    return {
      tipo: "r2",
      maxBytes: MAX_VIDEO_R2,
      subida: (clave, tipoMime) => ({ url: presignar({ metodo: "PUT", url: url(clave), credenciales: r2.credenciales, segundos: 3600 }), cabeceras: { "Content-Type": tipoMime } }),
      async tamano(clave) {
        const r = await fetch(presignar({ metodo: "HEAD", url: url(clave), credenciales: r2.credenciales, segundos: 300 }), { method: "HEAD", signal: AbortSignal.timeout(10_000) });
        return r.ok ? Number(r.headers.get("content-length") ?? 0) : null;
      },
      async borrar(clave) {
        await fetch(presignar({ metodo: "DELETE", url: url(clave), credenciales: r2.credenciales, segundos: 300 }), { method: "DELETE", signal: AbortSignal.timeout(10_000) }).catch(() => undefined);
      },
    };
  }
  const carpeta = carpetaEnDisco(env);
  if (!carpeta) return null;
  return {
    tipo: "disco",
    maxBytes: MAX_VIDEO_DISCO,
    subida: (clave, tipoMime) => ({ url: `/subidas/${clave}`, cabeceras: { "Content-Type": tipoMime } }),
    async tamano(clave) {
      const ruta = rutaEnDisco(carpeta, clave);
      return ruta ? stat(ruta).then((s) => s.size, () => null) : null;
    },
    async borrar(clave) {
      const ruta = rutaEnDisco(carpeta, clave);
      if (ruta) await rm(ruta, { force: true });
    },
  };
}

/** Dirección temporal para ver o descargar un vídeo de R2 (la página redirige a ella). En disco devuelve null: se sirve desde el servidor. */
export function lecturaR2(clave: string, descarga?: string, env: NodeJS.ProcessEnv = process.env): string | null {
  const r2 = configuracionR2(env);
  if (!r2) return null;
  const consulta = descarga ? { "response-content-disposition": `attachment; filename="${descarga.replace(/[^\w.-]/g, "_")}"` } : undefined;
  return presignar({ metodo: "GET", url: `${r2.base}/${clave}`, credenciales: r2.credenciales, segundos: 3600, consulta });
}

/** Guarda en disco lo que envía el navegador, cortando si supera el máximo. Devuelve los bytes escritos o null si se pasó. */
export async function guardarEnDisco(carpeta: string, clave: string, cuerpo: ReadableStream<Uint8Array>, max: number): Promise<number | null> {
  const ruta = rutaEnDisco(carpeta, clave);
  if (!ruta) return null;
  await mkdir(dirname(ruta), { recursive: true });
  let bytes = 0;
  const contador = new Transform({
    transform(trozo: Buffer, _c, hecho) {
      bytes += trozo.length;
      hecho(bytes > max ? new Error("demasiado_grande") : null, trozo);
    },
  });
  try {
    await pipeline(Readable.fromWeb(cuerpo as import("node:stream/web").ReadableStream<Uint8Array>), contador, createWriteStream(ruta, { flags: "wx" }));
    return bytes;
  } catch {
    await rm(ruta, { force: true });
    return null;
  }
}

/** Sirve un vídeo del disco admitiendo «Range» (necesario para avanzar y retroceder en el reproductor del móvil). */
export async function servirDesdeDisco(carpeta: string, clave: string, rango: string | null, cabeceras: Record<string, string>): Promise<Response> {
  const ruta = rutaEnDisco(carpeta, clave);
  const info = ruta ? await stat(ruta).catch(() => null) : null;
  if (!ruta || !info) return new Response(null, { status: 404 });
  const base = { ...cabeceras, "Content-Type": tipoDeClave(clave), "Accept-Ranges": "bytes" };
  const m = rango?.match(/^bytes=(\d*)-(\d*)$/);
  if (m && (m[1] || m[2])) {
    const inicio = m[1] ? Number(m[1]) : Math.max(0, info.size - Number(m[2]));
    const fin = m[1] && m[2] ? Math.min(Number(m[2]), info.size - 1) : info.size - 1;
    if (inicio > fin || inicio >= info.size) return new Response(null, { status: 416, headers: { ...base, "Content-Range": `bytes */${info.size}` } });
    const flujo = Readable.toWeb(createReadStream(ruta, { start: inicio, end: fin })) as ReadableStream;
    return new Response(flujo, { status: 206, headers: { ...base, "Content-Range": `bytes ${inicio}-${fin}/${info.size}`, "Content-Length": String(fin - inicio + 1) } });
  }
  return new Response(Readable.toWeb(createReadStream(ruta)) as ReadableStream, { headers: { ...base, "Content-Length": String(info.size) } });
}

/** Respuesta para ver (o descargar, con `descarga`) un vídeo guardado, venga de R2 o del disco. */
export async function responderVideo(clave: string, rango: string | null, descarga?: string): Promise<Response> {
  const cabeceras: Record<string, string> = { "Cache-Control": "private, max-age=300", "X-Content-Type-Options": "nosniff", ...(descarga && { "Content-Disposition": `attachment; filename="${descarga}"` }) };
  const r2 = lecturaR2(clave, descarga);
  if (r2) return new Response(null, { status: 302, headers: { Location: r2, "Cache-Control": "private, no-store" } });
  const carpeta = carpetaEnDisco();
  return carpeta ? servirDesdeDisco(carpeta, clave, rango, cabeceras) : new Response(null, { status: 404 });
}
