import type { Discipline } from "@prisma/client";
import { DISCIPLINE_LABEL, DISCIPLINE_ORDER, WEIGHT_CLASSES } from "../lib/disciplines";

type Defaults = {
  discipline?: Discipline; weightClass?: string | null;
  priorTotal?: number | null; priorWins?: number | null; priorLosses?: number | null; priorDraws?: number | null;
};

/** Campos para elegir disciplina y categoría de peso y, opcionalmente, el récord de partida (declarado por el propio deportista). */
export default function DisciplineFields({ defaults = {} }: { defaults?: Defaults }) {
  const selected = defaults.discipline ? `${defaults.discipline}:${defaults.weightClass ?? ""}` : "BOXEO:";
  const num = (v: number | null | undefined) => (v ?? "") as number | "";
  return (
    <>
      <label className="field" style={{ minWidth: 240 }}>
        <span>Disciplina y categoría de peso</span>
        <select name="disciplineChoice" defaultValue={selected}>
          {DISCIPLINE_ORDER.map((d) => (
            <optgroup key={d} label={DISCIPLINE_LABEL[d]}>
              <option value={`${d}:`}>{DISCIPLINE_LABEL[d]} · todavía no sé mi categoría</option>
              {WEIGHT_CLASSES[d].map((w) => <option key={w} value={`${d}:${w}`}>{DISCIPLINE_LABEL[d]} · {w}</option>)}
            </optgroup>
          ))}
        </select>
      </label>
      <fieldset style={{ border: "1px solid var(--line)", borderRadius: 8, padding: "8px 12px", flex: "1 1 100%" }}>
        <legend>Tus combates anteriores (opcional)</legend>
        <p className="mut" style={{ margin: "0 0 8px" }}>
          Si ya habías competido antes, indica cuántos combates llevas. Si no recuerdas tu récord, con el número de combates basta.
          Lo que escribas aquí lo declaras tú: en tu ficha aparecerá como «declarado por el propio deportista».
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <label className="field"><span>Combates que llevas</span><input name="priorTotal" type="number" min={0} max={1000} defaultValue={num(defaults.priorTotal)} /></label>
          <label className="field"><span>Victorias</span><input name="priorWins" type="number" min={0} max={1000} defaultValue={num(defaults.priorWins)} /></label>
          <label className="field"><span>Derrotas</span><input name="priorLosses" type="number" min={0} max={1000} defaultValue={num(defaults.priorLosses)} /></label>
          <label className="field"><span>Empates</span><input name="priorDraws" type="number" min={0} max={1000} defaultValue={num(defaults.priorDraws)} /></label>
        </div>
      </fieldset>
    </>
  );
}
