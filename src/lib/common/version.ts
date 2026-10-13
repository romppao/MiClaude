import paquete from "../../../package.json";

/**
 * Versión de la aplicación (docs/VERSIONES.md): la de package.json, que solo cambia con `node scripts/version.mjs subir`.
 * Se muestra en la ayuda, en moderación y en /salud, y se guarda en cada fallo registrado para saber en qué versión ocurrió.
 * Solo para el servidor: importar package.json en un componente de cliente metería el archivo entero en el navegador.
 */
export const VERSION: string = paquete.version;

/** Commit desplegado, si el alojamiento lo indica (Render pone RENDER_GIT_COMMIT); los 7 primeros caracteres, o null. */
export function commitDesplegado(): string | null {
  const c = process.env.RENDER_GIT_COMMIT ?? process.env.GIT_COMMIT ?? "";
  return /^[0-9a-f]{7,40}$/.test(c) ? c.slice(0, 7) : null;
}
