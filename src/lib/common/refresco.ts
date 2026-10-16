/**
 * Datos al día sin recargar (16 de octubre de 2026, petición del fundador: «actualizados y sincronizados en tiempo real para todos los
 * usuarios, así no se pierde nadie las cosas que pasan»). La forma más barata que cubre lo importante: las pantallas que solo se leen se
 * vuelven a pedir al servidor cuando la persona vuelve a la pestaña o a la aplicación, y cada pocos minutos mientras la tiene abierta.
 * Sin conexiones abiertas ni servicios nuevos (Render gratuito y la base de Neon cobran por uso). Si hace falta más inmediatez en algo
 * concreto (entradas, plazas), el siguiente paso son eventos del servidor solo ahí; ver docs/ARQUITECTURA.md.
 */

/** Pantallas que solo se leen: aquí un dato desfasado hace que alguien pierda una plaza, un aviso o un resultado. */
const PANTALLAS_VIVAS: RegExp[] = [
  /^\/$/,
  /^\/veladas(\/[^/]+)?$/,
  /^\/peleadores(\/[^/]+)?$/,
  /^\/entrenadores(\/[^/]+)?$/,
  /^\/gimnasios(\/[^/]+)?$/,
  /^\/ranking$/,
  /^\/disciplinas\/[^/]+$/,
  /^\/clases$/,
  /^\/avisos$/,
  /^\/mi-panel$/,
  /^\/siguiendo$/,
  /^\/mis-reservas$/,
  /^\/mis-inscripciones$/,
];

export const rutaConRefresco = (pathname: string) => PANTALLAS_VIVAS.some((r) => r.test(pathname));

/** Cada cuánto se actualiza una pantalla que sigue abierta y a la vista (con algo de variación para que no coincidan todas). */
export const INTERVALO_REFRESCO_MS = 90_000;
/** Donde alguien puede perder una plaza o una entrada si ve un dato viejo (una velada con entradas, los avisos), cada medio minuto. */
export const INTERVALO_RAPIDO_MS = 30_000;
export const intervaloDe = (pathname: string) => (/^\/veladas\/[^/]+$/.test(pathname) || pathname === "/avisos" || pathname === "/mis-inscripciones" ? INTERVALO_RAPIDO_MS : INTERVALO_REFRESCO_MS);
/** Entre dos actualizaciones, como mínimo: volver a la pestaña varias veces seguidas no repite la petición. */
export const MINIMO_ENTRE_REFRESCOS_MS = 20_000;

/** ¿Toca actualizar? No si la pestaña no se ve, si hay que esperar o si la persona está escribiendo o tiene una ventana abierta. */
export function tocaRefrescar(o: { ahora: number; ultimo: number; visible: boolean; escribiendo: boolean; ventanaAbierta: boolean }) {
  return o.visible && !o.escribiendo && !o.ventanaAbierta && o.ahora - o.ultimo >= MINIMO_ENTRE_REFRESCOS_MS;
}
