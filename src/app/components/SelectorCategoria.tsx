"use client";

import { BELTS } from "../../lib/fighters/graduation";
import { useId, useState } from "react";
import type { Discipline, Level } from "@prisma/client";
import { lookup } from "../../lib/common/safe";
import { divisionById, divisionsFor } from "../../lib/common/competition";
import { DISCIPLINE_LABEL, DISCIPLINE_ORDER, LEVEL_ORDER, levelName, weightClassesFor, weightNote, type CategoriaPeso } from "../../lib/common/disciplines";

type Valores = { belt?: string | null; beltDegrees?: number | null; discipline?: Discipline | ""; level?: Level | ""; weightClass?: string | null; divisionId?: string | null };

type Props = {
  /** «ficha»: elegir la propia disciplina, nivel y categoría (todo obligatorio salvo la categoría). «filtro»: buscar (todo opcional). */
  modo: "ficha" | "filtro" | "combate";
  fijas?: { discipline: Discipline; level: Level };
  disciplinas?: Discipline[];
  nivelesPorDisciplina?: Partial<Record<Discipline, Level>>;
  defaults?: Valores;
  /** Nombres de los campos del formulario (por defecto, los de la ficha). */
  nombres?: { discipline: string; level: string; weightClass: string; divisionId?: string };
};

const mismasListas = (a: CategoriaPeso[], b: CategoriaPeso[]) => a.length === b.length && a.every((c, i) => c.valor === b[i].valor);

/**
 * Disciplina → nivel → categoría de peso. Las categorías no son las mismas en cada disciplina ni entre profesional y amateur, así que la lista
 * de categorías se calcula con lo elegido arriba y cada una lleva su peso en kilos. Si no hay una lista confiable para esa combinación, se dice
 * con claridad en vez de enseñar categorías que no le corresponden.
 */
export default function SelectorCategoria({ modo, fijas, nivelesPorDisciplina, disciplinas = DISCIPLINE_ORDER, defaults = {}, nombres = { discipline: "discipline", level: "level", weightClass: "weightClass" } }: Props) {
  const id = useId();
  const esFiltro = modo === "filtro";
  const [disciplina, setDisciplina] = useState<Discipline | "">(fijas?.discipline ?? defaults.discipline ?? (modo === "combate" ? disciplinas[0] ?? "" : ""));
  const [nivel, setNivel] = useState<Level | "">(fijas?.level ?? defaults.level ?? (esFiltro ? "" : "AMATEUR"));
  const [divisionId, setDivisionId] = useState(defaults.divisionId ?? "");
  const division = divisionById(divisionId);
  const [categoria, setCategoria] = useState(defaults.weightClass ?? "");

  // Categorías según lo elegido. En una búsqueda sin nivel se enseñan las de los dos niveles (separadas si difieren).
  const niveles: Level[] = nivel ? [nivel] : LEVEL_ORDER;
  const listas = disciplina ? niveles.map((n) => ({ nivel: n, categorias: weightClassesFor(disciplina, n, divisionId) })).filter((l) => l.categorias.length > 0) : [];
  const unicaLista = listas.length > 0 && listas.every((l) => mismasListas(l.categorias, listas[0].categorias));
  const disponibles = new Set(listas.flatMap((l) => l.categorias.map((c) => c.valor)));
  const nota = disciplina && nivel ? weightNote(disciplina, nivel, divisionId) : "";
  const sinLista = !!disciplina && !!nivel && weightClassesFor(disciplina, nivel, divisionId).length === 0;

  const cambiar = (d: Discipline | "", n: Level | "") => {
    setDisciplina(d); setNivel(modo === "combate" && d && d !== disciplina && nivelesPorDisciplina ? lookup(nivelesPorDisciplina, d) ?? n : n); setDivisionId("");
    if (divisionId) { setCategoria(""); return; }
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
      {!fijas ? <><label className="field">
        <span>Disciplina</span>
        <select name={nombres.discipline} value={disciplina} onChange={(e) => cambiar(e.target.value as Discipline | "", nivel)} required={!esFiltro}>
          <option value="">{esFiltro ? "Todas las disciplinas" : "Elige una disciplina"}</option>
          {disciplinas.map((d) => <option key={d} value={d}>{DISCIPLINE_LABEL[d]}</option>)}
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
      </> : <><input type="hidden" name={nombres.discipline} value={fijas.discipline} /><input type="hidden" name={nombres.level} value={fijas.level} /></>}
      <label className="field">
        <span>División deportiva (edad y categoría)</span>
        <select name={nombres.divisionId ?? "divisionId"} value={divisionId} disabled={!disciplina} onChange={(e) => { setDivisionId(e.target.value); setCategoria(""); }} aria-describedby={`${id}-division`}>
          <option value="">{esFiltro ? "Todas las divisiones" : "Prefiero indicarlo más tarde"}</option>
          {disciplina && niveles.flatMap(n => divisionsFor(disciplina, n)).map(d => <option key={d.id} value={d.id}>{d.label}{!nivel ? ` · ${levelName(d.level)}` : ""}</option>)}
        </select>
        <span className="hint" id={`${id}-division`} aria-live="polite">
          {division ? <>{division.note} <a href={division.source} target="_blank" rel="noreferrer">Consultar reglamento</a></> : "Elige la división de tu competición. Dejarla sin confirmar conserva una declaración incompleta; no te asigna a élite ni acredita tu edad. En un combate, indica la división de aquel día."}
        </span>
      </label>
      <label className="field" style={{ minWidth: 240 }}>
        <span>Categoría de peso</span>
        <select name={nombres.weightClass} value={categoria} onChange={(e) => setCategoria(e.target.value)} disabled={!disciplina} aria-describedby={`${id}-nota`}>
          <option value="">{vacioCategoria}</option>
          {/* Un valor guardado que ya no está en la lista (datos antiguos) se conserva para no esconder lo que se declaró. */}
          {categoria && !disponibles.has(categoria) && <option value={categoria}>{categoria}</option>}
          {unicaLista
            ? listas[0].categorias.map(opcion)
            : listas.map((l) => <optgroup key={l.nivel} label={levelName(l.nivel)}>{l.categorias.map(opcion)}</optgroup>)}
        </select>
        <span className="hint" id={`${id}-nota`} aria-live="polite">
          {sinLista ? nota : nota ? `${nota} Los kilos son los límites del reglamento indicado. Confirma la convocatoria con la organización.` : esFiltro ? "Elige una disciplina para ver sus categorías, con su peso en kilos." : ""}
        </span>
      </label>
      {!esFiltro && disciplina === "JIUJITSU" && <fieldset className="graduation-fields">
        <legend>Graduación de BJJ (opcional)</legend>
        <label className="field"><span>Cinturón</span><select name="belt" defaultValue={defaults.belt ?? ""}><option value="">Sin indicar</option>{Object.entries(BELTS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        <label className="field"><span>Grados</span><input name="beltDegrees" type="number" min={0} max={10} defaultValue={defaults.beltDegrees ?? ""} /></label>
        <p className="mut">Indica tu graduación real. Es información declarada por ti, no una acreditación verificada por Ring España. Las reglas de graduación dependen de la edad y de la organización.</p>
      </fieldset>}
    </>
  );
}
