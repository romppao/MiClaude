const BASE = "http://interno.invalid";

/**
 * Devuelve `raw` solo si es una ruta interna de la propia aplicación; si no, `fallback`.
 * Se apoya en el analizador de URL del navegador/servidor, que trata «/\dominio», «/<TAB>/dominio» o «//dominio»
 * como direcciones externas: comparar solo el inicio de la cadena deja pasar esos casos (redirección abierta).
 */
export function internalPath(raw: string, fallback = "/"): string {
  if (!raw || raw.length > 500 || !raw.startsWith("/")) return fallback;
  if (/[\\\u0000-\u001f\u007f]/.test(raw)) return fallback;
  try {
    const u = new URL(raw, BASE);
    if (u.origin !== BASE) return fallback;
    return u.pathname + u.search + u.hash;
  } catch {
    return fallback;
  }
}

/** Dirección de la pantalla de acceso con el motivo y, si se conoce, la página a la que volver después de entrar. */
export const loginPath = (next?: string): string => `/entrar?${next ? `next=${encodeURIComponent(next)}&` : ""}problema=sin_sesion`;
