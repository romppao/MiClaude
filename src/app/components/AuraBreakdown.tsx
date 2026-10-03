import type { CategoryRanking } from "../../lib/aura/ranking";
import type { Discipline } from "@prisma/client";
import {
  DISCIPLINE_LABEL,
  levelName,
  weightClassLabel,
} from "../../lib/common/disciplines";
import { divisionLabel } from "../../lib/common/competition";

export default function AuraBreakdown({
  groups,
}: {
  groups: (CategoryRanking & { discipline: Discipline })[];
}) {
  return (
    <>
      {groups.length ? (
        <ul>
          {groups.flatMap((g) =>
            g.entries.map((e) => (
              <li
                key={`${g.discipline}-${g.level}-${g.divisionId}-${g.weightClass}-${e.fighterId}`}
              >
                <strong>{e.aura} de aura</strong> ·{" "}
                {DISCIPLINE_LABEL[g.discipline]} · {levelName(g.level)} ·{" "}
                {divisionLabel(g.divisionId)}
                {g.weightClass
                  ? ` · ${weightClassLabel(g.discipline, g.level, g.weightClass, g.divisionId)}`
                  : ""}
                <div>
                  {e.trajectory ?? 0} por trayectoria + {e.backing ?? 0} por
                  respaldo + {e.community ?? e.aura} de la comunidad.
                  {e.declared &&
                    " Incluye un título declarado por el deportista, sin respaldo comprobado."}
                </div>
              </li>
            )),
          )}
        </ul>
      ) : (
        <p className="mut">Todavía no hay aura. La verificación es opcional.</p>
      )}
    </>
  );
}
