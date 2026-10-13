import { textoPlano } from "./parse";

/** Identidad editorial independiente del medio que redistribuye el titular. */
export const tituloNormalizado = (title: string) => textoPlano(title).normalize("NFKD").replace(/\p{M}/gu, "").toLocaleLowerCase("es").replace(/[^\p{L}\p{N}]+/gu, " ").trim();

export function enlaceNormalizado(raw: string): string {
  try {
    const url = new URL(raw);
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) if (/^(utm_|fbclid$|gclid$)/i.test(key)) url.searchParams.delete(key);
    url.searchParams.sort();
    // «/noticia/?a=1» y «/noticia?a=1» son la misma: la barra final se quita también cuando hay parámetros.
    if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, "");
    return url.toString().replace(/\/$/, "");
  } catch { return raw.trim(); }
}

type Titular = { title: string; url: string; disciplines: string[]; imageUrl: string | null };

/** Fusiona también duplicados transitivos (A comparte URL con B y B título con C).
 * Conserva el primer titular, une disciplinas y aprovecha una foto disponible. No borra datos de las fuentes.
 */
export function fusionarNoticias<T extends Titular>(rows: T[]): T[] {
  const parent = rows.map((_, i) => i);
  const root = (i: number): number => parent[i] === i ? i : (parent[i] = root(parent[i]));
  const seen = new Map<string, number>();
  rows.forEach((row, i) => {
    for (const key of [`url:${enlaceNormalizado(row.url)}`, `title:${tituloNormalizado(row.title)}`]) {
      const prev = seen.get(key);
      if (prev !== undefined) parent[root(i)] = root(prev);
      else seen.set(key, i);
    }
  });
  const groups = new Map<number, T>();
  rows.forEach((row, i) => {
    const key = root(i), prev = groups.get(key);
    groups.set(key, prev ? { ...prev, imageUrl: prev.imageUrl ?? row.imageUrl, disciplines: [...new Set([...prev.disciplines, ...row.disciplines])] } : { ...row });
  });
  return [...groups.values()];
}
