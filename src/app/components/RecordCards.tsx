import type { Discipline, FighterDiscipline, Level } from "@prisma/client";
import { DISCIPLINE_LABEL, DISCIPLINE_ORDER, weightClassLabel } from "../../lib/common/disciplines";
import { LEVEL_LABEL } from "../../lib/common/labels";
import { combinedRecord, emptyTally, formatRecord, type Records } from "../../lib/fighters/record";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * Un cuadro de récord por disciplina y nivel. La cifra principal suma el récord de partida **solo si se declaró con detalle**;
 * el desglose deja siempre claro qué está registrado en la app y qué lo declara el propio deportista.
 */
export default function RecordCards({ records, disciplines }: { records: Records; disciplines: FighterDiscipline[] }) {
  const byDiscipline = new Map(disciplines.map((d) => [d.discipline, d]));
  const shown = DISCIPLINE_ORDER.filter((d) => byDiscipline.has(d) || records[d]);
  const cards: { discipline: Discipline; level: Level }[] = [];
  for (const d of shown) {
    const main = byDiscipline.get(d)?.level ?? "AMATEUR";
    const levels = new Set<Level>([main]);
    for (const l of ["PRO", "AMATEUR"] as Level[]) {
      const t = records[d]?.[l];
      if (t && t.w + t.l + t.d + t.nc > 0) levels.add(l);
    }
    for (const level of levels) cards.push({ discipline: d, level });
  }
  return (
    <div className="grid">
      {cards.map(({ discipline, level }) => {
        const fd = byDiscipline.get(discipline);
        const tally = records[discipline]?.[level] ?? emptyTally();
        const prior = fd && fd.level === level ? { total: fd.priorTotal, wins: fd.priorWins, losses: fd.priorLosses, draws: fd.priorDraws } : null;
        const c = combinedRecord(tally, prior);
        return (
          <div key={`${discipline}-${level}`} className="card">
            <div className="mut">{DISCIPLINE_LABEL[discipline]} · {LEVEL_LABEL[level]}{fd?.weightClass ? ` · ${weightClassLabel(discipline, fd.weightClass)}` : ""}</div>
            <div className="rec">{formatRecord({ ...c, nc: tally.nc })}</div>
            <div className="mut">victorias – derrotas – empates</div>
            <div className="mut">
              {tally.ko > 0 && `${tally.ko} por KO`}{tally.ko > 0 && tally.sub > 0 && " · "}{tally.sub > 0 && `${plural(tally.sub, "sumisión", "sumisiones")}`}
              {tally.unverified > 0 && `${tally.ko + tally.sub > 0 ? " · " : ""}${plural(tally.unverified, "pendiente de confirmar", "pendientes de confirmar")}`}
            </div>
            {c.priorDetailed && <div className="mut">Incluye {plural(c.priorTotal, "combate anterior", "combates anteriores")} declarados por el propio deportista (registrado en la app: {formatRecord(tally)}).</div>}
            {!c.priorDetailed && c.priorTotal > 0 && <div className="mut">Además, {plural(c.priorTotal, "combate anterior", "combates anteriores")} sin detallar, declarados por el propio deportista.</div>}
          </div>
        );
      })}
      {cards.length === 0 && <p className="mut">Todavía no hay disciplinas ni combates registrados.</p>}
    </div>
  );
}
