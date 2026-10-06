import Link from "next/link";

/** Enlaces «Anterior» y «Siguiente» de un listado, conservando el resto de filtros de la dirección. */
export default function Paginacion({ ruta, params, actual, paginas, desde, hasta, total, unidad, parametro = "pagina", ancla, etiqueta = "Páginas del listado" }: {
  ruta: string; params: Record<string, string | undefined>; actual: number; paginas: number; desde: number; hasta: number; total: number; unidad: [string, string];
  parametro?: string; ancla?: string; etiqueta?: string;
}) {
  const href = (n: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v && k !== parametro && k !== "aviso" && k !== "problema") q.set(k, v);
    if (n > 1) q.set(parametro, String(n));
    const s = q.toString();
    return `${s ? `${ruta}?${s}` : ruta}${ancla ? `#${ancla}` : ""}`;
  };
  if (total === 0) return null;
  return (
    <nav aria-label={etiqueta} style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", margin: "16px 0" }}>
      <span className="mut">Mostrando del {desde} al {hasta} de {total} {total === 1 ? unidad[0] : unidad[1]}{paginas > 1 ? ` · página ${actual} de ${paginas}` : ""}</span>
      {actual > 1 && <Link href={href(actual - 1)} rel="prev" className="btn secondary">← Página anterior</Link>}
      {actual < paginas && <Link href={href(actual + 1)} rel="next" className="btn secondary">Página siguiente →</Link>}
    </nav>
  );
}
