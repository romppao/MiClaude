import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";
import { presignar } from "./s3";
import { carpetaEnDisco, configuracionR2 } from "./storage";
import { registrarFallo } from "../common/fallos";

/**
 * Almacén de las fotos que sube la gente: foto y banner de los perfiles, fotos de los highlights, fotos del público en las veladas
 * y carteles de las veladas
 * (T-004, parte 2; aprobado por el fundador el 15 de octubre de 2026). Hasta la 0.16 se guardaban dentro de PostgreSQL, y la base gratuita
 * (0,5 GB) se habría llenado con unos miles de fotos.
 *
 *  - «r2»: Cloudflare R2, el mismo cubo que los vídeos (variables R2_*; docs/VIDEOS.md), bajo la carpeta `fotos/`. Las fotos se sirven a
 *    través de la aplicación (las rutas /imagenes, /highlights y /medios), que siguen comprobando si la ficha o la velada es visible.
 *  - «disco»: una carpeta del servidor, solo si FOTOS_EN_DISCO=si (pruebas y desarrollo). No en la demo de Render: su disco se borra al
 *    reiniciar y las fotos desaparecerían.
 *  - Sin ninguno de los dos: las fotos siguen guardándose en la base de datos, como antes. Así nada se rompe mientras no haya cuenta de R2.
 *
 * Las filas guardan la clave (`avatarKey`, `bannerKey`, `imageKey`) o, si no hay almacén, los bytes. Al leer, manda la clave; las fotos
 * antiguas sin clave se siguen leyendo de la base hasta que se trasladen (scripts/fotos-al-almacen.ts).
 */
export type CarpetaDeFotos = "perfiles" | "highlights" | "medios" | "carteles";
export const CLAVE_DE_FOTO = /^fotos\/(perfiles|highlights|medios|carteles)\/[0-9a-f-]{36}\.webp$/;
export const nuevaClaveDeFoto = (carpeta: CarpetaDeFotos) => `fotos/${carpeta}/${randomUUID()}.webp`;

export type AlmacenDeFotos = {
  tipo: "r2" | "disco";
  guardar(clave: string, bytes: Uint8Array): Promise<void>;
  leer(clave: string): Promise<Uint8Array | null>;
  borrar(clave: string): Promise<void>;
};

const ESPERA = 15_000;

export function almacenDeFotos(env: NodeJS.ProcessEnv = process.env): AlmacenDeFotos | null {
  const r2 = configuracionR2(env);
  if (r2) {
    const firmar = (metodo: "GET" | "PUT" | "DELETE", clave: string) => presignar({ metodo, url: `${r2.base}/${clave}`, credenciales: r2.credenciales, segundos: 300 });
    return {
      tipo: "r2",
      async guardar(clave, bytes) {
        const r = await fetch(firmar("PUT", clave), { method: "PUT", body: bytes as Uint8Array<ArrayBuffer>, headers: { "Content-Type": "image/webp" }, signal: AbortSignal.timeout(ESPERA) });
        if (!r.ok) throw new Error(`El almacén de fotos rechazó la subida (código ${r.status})`);
      },
      async leer(clave) {
        const r = await fetch(firmar("GET", clave), { signal: AbortSignal.timeout(ESPERA) });
        if (r.status === 404) return null;
        if (!r.ok) throw new Error(`El almacén de fotos no devolvió la foto (código ${r.status})`);
        return new Uint8Array(await r.arrayBuffer());
      },
      async borrar(clave) {
        const r = await fetch(firmar("DELETE", clave), { method: "DELETE", signal: AbortSignal.timeout(ESPERA) });
        if (!r.ok && r.status !== 404) throw new Error(`El almacén de fotos no borró la foto (código ${r.status})`);
      },
    };
  }
  const carpeta = env.FOTOS_EN_DISCO === "si" ? carpetaEnDisco(env) : null;
  if (!carpeta) return null;
  const ruta = (clave: string) => {
    if (!CLAVE_DE_FOTO.test(clave)) return null;
    const r = resolve(join(carpeta, clave));
    return r.startsWith(carpeta + sep) ? r : null;
  };
  return {
    tipo: "disco",
    async guardar(clave, bytes) {
      const r = ruta(clave);
      if (!r) throw new Error("Clave de foto no válida");
      await mkdir(dirname(r), { recursive: true });
      await writeFile(r, bytes, { flag: "wx" });
    },
    async leer(clave) {
      const r = ruta(clave);
      return r ? readFile(r).then((b) => new Uint8Array(b), () => null) : null;
    },
    async borrar(clave) {
      const r = ruta(clave);
      if (r) await rm(r, { force: true });
    },
  };
}

/** Dónde queda una foto nueva: en el almacén (con su clave) o, si no hay almacén, en la propia fila. */
export type FotoGuardada = { clave: string | null; bytes: Uint8Array<ArrayBuffer> | null };

/** Guarda una foto ya normalizada (WebP). Si el almacén falla, lanza: la acción no debe publicar una foto que no se ha guardado. */
export async function guardarFoto(carpeta: CarpetaDeFotos, bytes: Uint8Array<ArrayBuffer>, almacen = almacenDeFotos()): Promise<FotoGuardada> {
  if (!almacen) return { clave: null, bytes };
  const clave = nuevaClaveDeFoto(carpeta);
  await almacen.guardar(clave, bytes);
  return { clave, bytes: null };
}

/** Lee una foto de una fila: por su clave si la tiene y, si no, los bytes guardados en la base (fotos anteriores al traslado). */
export async function leerFoto(fila: { clave: string | null | undefined; bytes: Uint8Array | null | undefined }, almacen = almacenDeFotos()): Promise<Uint8Array | null> {
  if (fila.clave) {
    if (!almacen) {
      await registrarFallo({ origen: "SERVIDOR", error: "Hay fotos en el almacén, pero el almacén de fotos no está configurado (variables R2_*)" });
      return null;
    }
    return almacen.leer(fila.clave);
  }
  return fila.bytes ? new Uint8Array(fila.bytes) : null;
}

/**
 * Borra fotos del almacén después de borrar o sustituir sus filas (al quitar una foto, retirar un highlight, borrar la cuenta…). Nunca lanza:
 * la fila ya no existe y la persona no debe ver un error; si el almacén falla, queda registrado en «Fallos» para borrarla a mano.
 */
export async function borrarFotos(claves: (string | null | undefined)[], almacen = almacenDeFotos()): Promise<void> {
  const validas = claves.filter((c): c is string => !!c && CLAVE_DE_FOTO.test(c));
  if (!validas.length) return;
  if (!almacen) {
    await registrarFallo({ origen: "SERVIDOR", error: `No se pudieron borrar ${validas.length} fotos: el almacén de fotos no está configurado` });
    return;
  }
  for (const clave of validas) {
    try { await almacen.borrar(clave); } catch (e) {
      await registrarFallo({ origen: "SERVIDOR", contexto: `No se pudo borrar la foto ${clave} del almacén`, error: e });
    }
  }
}
