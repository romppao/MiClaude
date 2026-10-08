import Link from "next/link";

/** Campo de un filtro con su etiqueta visible (nunca solo un texto de ejemplo que desaparece al escribir). */
export function CampoFiltro({ etiqueta, ayuda, children }: { etiqueta: string; ayuda?: string; children: React.ReactNode }) {
  return <label className="field"><span>{etiqueta}</span>{children}{ayuda && <span className="hint">{ayuda}</span>}</label>;
}

/**
 * Filtros secundarios plegados (revisión del 8 de octubre de 2026: en el móvil, los filtros ocupaban la primera pantalla entera antes de
 * ver un solo resultado). Se abren solos si alguno está aplicado, y dicen cuántos hay.
 */
export function MasFiltros({ activos, children }: { activos: number; children: React.ReactNode }) {
  return (
    <details className="mas-filtros" open={activos > 0}>
      <summary>Más filtros{activos > 0 ? ` (${activos} ${activos === 1 ? "aplicado" : "aplicados"})` : ""}</summary>
      <div className="mas-filtros-campos">{children}</div>
    </details>
  );
}

/** Botón principal de un formulario de filtros y enlace para quitarlos todos. */
export function BotonesFiltro({ ruta, hayFiltros }: { ruta: string; hayFiltros: boolean }) {
  return (
    <>
      <button>Aplicar filtros</button>
      {/* Solo cuando hay algo que quitar: un enlace a la misma pantalla no hace nada. */}
      {hayFiltros && <Link href={ruta} className="btn secondary">Quitar todos los filtros</Link>}
    </>
  );
}

/**
 * Resumen de los filtros aplicados, cada uno con un enlace para quitarlo solo (así se entiende de un vistazo por qué salen estos resultados
 * y no hace falta volver a empezar para ampliar la búsqueda). `claves` son los parámetros de la dirección que se quitan con ese filtro.
 */
export function FiltrosActivos({ ruta, params, activos }: { ruta: string; params: Record<string, string | undefined>; activos: { texto: string; claves: string[] }[] }) {
  if (activos.length === 0) return null;
  const sin = (claves: string[]) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v && k !== "pagina" && !claves.includes(k)) q.set(k, v);
    const s = q.toString();
    return s ? `${ruta}?${s}` : ruta;
  };
  return (
    <div role="group" aria-label="Filtros aplicados" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", margin: "8px 0" }}>
      <span className="mut">Estás viendo:</span>
      {activos.map((a) => (
        <Link key={a.texto} href={sin(a.claves)} className="btn secondary" style={{ minHeight: 44 }}>
          {a.texto} <span aria-hidden="true">✕</span><span className="sr-only"> (quitar este filtro)</span>
        </Link>
      ))}
    </div>
  );
}
