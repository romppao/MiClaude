export const PAGE_SIZE = 24;
const MAX_PAGE = 1000;

/** Número de página pedido en la dirección (?pagina=2): entero de 1 a 1000; cualquier otra cosa es la primera. */
export function pageNumber(raw: string | string[] | undefined): number {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return v && /^\d{1,4}$/.test(v) ? Math.min(Math.max(parseInt(v, 10), 1), MAX_PAGE) : 1;
}

/** Datos para consultar y mostrar una página: cuántos saltar, cuántos traer, total de páginas y página real (nunca pasa de la última). */
export function pageWindow(total: number, page: number, size = PAGE_SIZE) {
  const pages = Math.max(1, Math.ceil(total / size));
  const current = Math.min(page, pages);
  return { skip: (current - 1) * size, take: size, pages, current, total, from: total === 0 ? 0 : (current - 1) * size + 1, to: Math.min(current * size, total) };
}
