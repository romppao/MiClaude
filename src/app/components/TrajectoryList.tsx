import {
  achievementPoints,
  effectiveSupport,
  SCOPE_LABEL,
  SUPPORT_LABEL,
  type SupportedAchievement,
} from "../../lib/aura/trajectory";
import {
  DISCIPLINE_LABEL,
  levelName,
  weightClassLabel,
} from "../../lib/common/disciplines";
import { divisionLabel } from "../../lib/common/competition";
import { fmtDate } from "../../lib/common/labels";

export default function TrajectoryList({
  achievements,
}: {
  achievements: SupportedAchievement[];
}) {
  const visible = achievements.filter((a) => !a.withdrawnAt && !a.rejectedAt);
  return (
    <>
      {visible.length ? (
        <ul>
          {visible.map((a) => {
            const points = achievementPoints(a);
            return (
              <li key={a.id}>
                <strong>
                  {SCOPE_LABEL[a.scope]}: {a.championship}
                </strong>{" "}
                · {a.organization} · {fmtDate(a.awardedOn)}
                <div className="mut">
                  {DISCIPLINE_LABEL[a.discipline]} · {levelName(a.level)} ·{" "}
                  {divisionLabel(a.divisionId)}
                  {a.weightClass
                    ? ` · ${weightClassLabel(a.discipline, a.level, a.weightClass, a.divisionId)}`
                    : ""}
                </div>
                <div>
                  {SUPPORT_LABEL[effectiveSupport(a)]}
                  {a.supportAuthority && effectiveSupport(a) !== "DECLARED"
                    ? ` · ${a.supportAuthority}`
                    : ""}
                  . Aporte posible: {points.trajectory} por trayectoria +{" "}
                  {points.backing} por respaldo.
                </div>
                {a.evidenceUrl && (
                  <a
                    href={a.evidenceUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow ugc"
                  >
                    Consultar fuente del logro
                    <span className="sr-only"> (se abre en otra pestaña)</span>
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mut">
          Todavía no hay títulos declarados. Puedes participar y recibir aura
          sin tener títulos ni verificaciones.
        </p>
      )}
    </>
  );
}
