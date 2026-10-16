import Link from "next/link";
import type { Discipline } from "@prisma/client";
import { DISCIPLINE_LABEL, DISCIPLINE_ORDER } from "../../lib/common/disciplines";

/**
 * Cabecera común de los tres directorios (peleadores, entrenadores y gimnasios): saltar de uno a otro con un toque y filtrar por
 * disciplina sin abrir «Más filtros». Quien aún no sabe a quién busca (un aficionado que quiere clases de un entrenador, por ejemplo)
 * llega a los tres desde cualquiera de ellos. Los filtros que dependen de la disciplina (categoría) se quitan al cambiarla.
 */
const DIRECTORIOS = [["peleadores", "Peleadores", "/peleadores"], ["entrenadores", "Entrenadores", "/entrenadores"], ["gimnasios", "Gimnasios", "/gimnasios"]] as const;

export function DirectorioNav({ actual }: { actual: (typeof DIRECTORIOS)[number][0] }) {
  return (
    <nav className="pestanas-barra directorio-nav" aria-label="Directorios de la comunidad">
      {DIRECTORIOS.map(([clave, texto, href]) => <Link key={clave} href={href} className="directorio-enlace" aria-current={clave === actual ? "page" : undefined}>{texto}</Link>)}
    </nav>
  );
}

/** Fila deslizable de disciplinas: «Todas» más una por deporte. `conservar` son los demás filtros que se mantienen al elegir una. */
export function ChipsDisciplina({ ruta, actual, conservar }: { ruta: string; actual?: Discipline; conservar: Record<string, string | undefined> }) {
  const hacia = (d?: Discipline) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(conservar)) if (v) p.set(k, v);
    if (d) p.set("disciplina", d);
    const s = p.toString();
    return s ? `${ruta}?${s}` : ruta;
  };
  return (
    <nav className="filtros-disciplina desliza-fila" aria-label="Filtrar por disciplina">
      <Link href={hacia()} aria-current={!actual ? "page" : undefined}>Todas</Link>
      {DISCIPLINE_ORDER.map((d) => <Link key={d} href={hacia(d)} aria-current={actual === d ? "page" : undefined}>{DISCIPLINE_LABEL[d]}</Link>)}
    </nav>
  );
}
