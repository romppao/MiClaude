"use client";

import { useId, useState } from "react";
import type { Discipline, Level } from "@prisma/client";
import { DISCIPLINE_LABEL, DISCIPLINE_ORDER, LEVEL_ORDER, levelName, weightClassesFor, weightNote, type CategoriaPeso } from "../../lib/common/disciplines";

type Valores = { discipline?: Discipline | ""; level?: Level | ""; weightClass?: string | null };

type Props = {
  /** «ficha»: elegir la propia disciplina, nivel y categoría (todo obligatorio salvo la categoría). «filtro»: buscar (todo opcional). */
  modo: "ficha" | "filtro";
  defaults?: Valores;
  /** Nombres de los campos del formulario (por defecto, los de la ficha). */
  nombres?: { discipline: string; level: string; weightClass: string };
};

const mismasListas = (a: CategoriaPeso[], b: CategoriaPeso[]) => a.length === b.length && a.every((c, i) => c.valor === b[i].valor);

/**
 * Disciplina → nivel → categoría de peso. Las categorías no son las mismas en cada disciplina ni entre profesional y amateur, así que la lista
 * de categorías se calcula con lo elegido arriba y cada una lleva su peso en kilos. Si no hay una lista confiable para esa combinación, se dice
 * con claridad en vez de enseñar categorías que no le corresponden.
 */
export default function SelectorCategoria({ modo, defaults = {}, nombres = { discipline: "discipline", level: "level", weightClass: "weightClass" } }: Props) {
  const id = useId();
  const esFiltro = modo === "filtro";
  const [disciplina, setDisciplina] = useState<Discipline | "">(defaults.discipline ?? (esFiltro ? "" : "BOXEO"));
  const [nivel, setNivel] = useState<Level | "">(defaults.level ?? (esFiltro ? "" : "AMATEUR"));
  const [categoria, setCategoria] = useState(defaults.weightClass ?? "");

  // Categorías según lo elegido. En una búsqueda sin nivel se enseñan las de los dos niveles (separadas si difieren).
  const niveles: Level[] = nivel ? [nivel] : LEVEL_ORDER;
  const listas = disciplina ? niveles.map((n) => ({ nivel: n, categorias: weightClassesFor(disciplina, n) })).filter((l) => l.categorias.length > 0) : [];
  const unicaLista = listas.length > 0 && listas.every((l) => mismasListas(l.categorias, listas[0].categorias));
  const disponibles = new Set(listas.flatMap((l) => l.categorias.map((c) => c.valor)));
  const nota = disciplina && nivel ? weightNote(disciplina, nivel) : "";
  const sinLista = !!disciplina && !!nivel && weightClassesFor(disciplina, nivel).length === 0;

  const cambiar = (d: Discipline | "", n: Level | "") => {
    setDisciplina(d); setNivel(n);
    // Si la categoría elegida no existe en la nueva combinación, se vacía (nunca se queda una categoría que no corresponde).
    if (categoria) {
      const ok = d && (n ? weightClassesFor(d, n) : LEVEL_ORDER.flatMap((l) => weightClassesFor(d, l))).some((c) => c.valor === categoria);
      if (!ok) setCategoria("");
    }
  };

  const opcion = (c: CategoriaPeso) => <option key={c.valor} value={c.valor}>{c.etiqueta}</option>;
  const vacioCategoria = esFiltro ? (disciplina ? "Todas las categorías" : "Primero elige una disciplina") : "Todavía no sé mi categoría";

  return (
    <>
      <label className="field">
        <span>Disciplina</span>
        <select name={nombres.discipline} value={disciplina} onChange={(e) => cambiar(e.target.value as Discipline | "", nivel)} required={!esFiltro}>
          {esFiltro && <option value="">Todas las disciplinas</option>}
          {DISCIPLINE_ORDER.map((d) => <option key={d} value={d}>{DISCIPLINE_LABEL[d]}</option>)}
        </select>
      </label>
      <label className="field">
        <span>Nivel</span>
        <select name={nombres.level} value={nivel} onChange={(e) => cambiar(disciplina, e.target.value as Level | "")} required={!esFiltro}>
          {esFiltro && <option value="">Profesional y amateur</option>}
          {LEVEL_ORDER.map((n) => <option key={n} value={n}>{levelName(n)}</option>)}
        </select>
        {!esFiltro && <span className="hint">Profesional si compites en veladas profesionales; amateur en las demás. Es lo que tú declaras.</span>}
      </label>
      <label className="field" style={{ minWidth: 240 }}>
        <span>Categoría de peso</span>
        <select name={nombres.weightClass} value={categoria} onChange={(e) => setCategoria(e.target.value)} disabled={esFiltro && !disciplina} aria-describedby={`${id}-nota`}>
          <option value="">{vacioCategoria}</option>
          {/* Un valor guardado que ya no está en la lista (datos antiguos) se conserva para no esconder lo que se declaró. */}
          {categoria && !disponibles.has(categoria) && <option value={categoria}>{categoria}</option>}
          {unicaLista
            ? listas[0].categorias.map(opcion)
            : listas.map((l) => <optgroup key={l.nivel} label={levelName(l.nivel)}>{l.categorias.map(opcion)}</optgroup>)}
        </select>
        <span className="hint" id={`${id}-nota`} aria-live="polite">
          {sinLista ? nota : nota ? `${nota} Los kilos son el límite de cada categoría y son orientativos: cada velada puede aplicar los suyos.` : esFiltro ? "Elige una disciplina para ver sus categorías, con su peso en kilos." : ""}
        </span>
      </label>
    </>
  );
}
