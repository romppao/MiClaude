import Link from "next/link";

/** Campo de un filtro con su etiqueta visible (nunca solo un texto de ejemplo que desaparece al escribir). */
export function CampoFiltro({ etiqueta, ayuda, children }: { etiqueta: string; ayuda?: string; children: React.ReactNode }) {
  return <label className="field"><span>{etiqueta}</span>{children}{ayuda && <span className="hint">{ayuda}</span>}</label>;
}

/** Botón principal de un formulario de filtros y enlace para quitarlos todos. */
export function BotonesFiltro({ ruta }: { ruta: string }) {
  return (
    <>
      <button>Aplicar filtros</button>
      <Link href={ruta} className="btn secondary">Quitar filtros</Link>
    </>
  );
}
