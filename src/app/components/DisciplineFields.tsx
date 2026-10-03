import type { Discipline, Level } from "@prisma/client";
import SelectorCategoria from "./SelectorCategoria";

type Defaults = {
  discipline?: Discipline; level?: Level; weightClass?: string | null; divisionId?: string | null;
  priorTotal?: number | null; priorWins?: number | null; priorLosses?: number | null; priorDraws?: number | null;
};

/** Campos para elegir disciplina, nivel y categoría de peso y, opcionalmente, el récord de partida (declarado por el propio deportista). */
export default function DisciplineFields({ defaults = {} }: { defaults?: Defaults }) {
  const num = (v: number | null | undefined) => (v ?? "") as number | "";
  return (
    <>
      <SelectorCategoria modo="ficha" defaults={{ discipline: defaults.discipline ?? "BOXEO", level: defaults.level ?? "AMATEUR", divisionId: defaults.divisionId, weightClass: defaults.weightClass }} />
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
