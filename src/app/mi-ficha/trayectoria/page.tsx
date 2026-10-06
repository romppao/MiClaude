import Link from "next/link";
import { redirect } from "next/navigation";
import { requireVerifiedUser } from "../../../lib/accounts/auth";
import { db } from "../../../lib/common/db";
import { auraRanking } from "../../../lib/aura/ranking";
import { SCOPE_LABEL } from "../../../lib/aura/trajectory";
import {
  saveAchievement,
  withdrawAchievement,
  restoreOwnAchievement,
  requestAchievementReview,
} from "../../actions/trajectory";
import SelectorCategoria from "../../components/SelectorCategoria";
import TrajectoryList from "../../components/TrajectoryList";
import AuraBreakdown from "../../components/AuraBreakdown";

export const metadata = { title: "Mi trayectoria y aura" };
export const dynamic = "force-dynamic";
export default async function Trajectory() {
  const user = await requireVerifiedUser();
  const me = user.fighter;
  if (!me) redirect("/mi-ficha");
  const [achievements, groups] = await Promise.all([
    db.fighterAchievement.findMany({
      where: { fighterId: me.id },
      include: { supportAccreditation: true },
      orderBy: { awardedOn: "desc" },
    }),
    auraRanking({ fighterId: me.id }),
  ]);
  const fields = (a?: (typeof achievements)[number]) => (
    <>
      <label className="field">
        <span>Nombre del campeonato</span>
        <input
          name="championship"
          required
          maxLength={160}
          defaultValue={a?.championship}
        />
      </label>
      <label className="field">
        <span>Entidad que organizó el campeonato</span>
        <input
          name="organization"
          required
          maxLength={160}
          defaultValue={a?.organization}
        />
      </label>
      <label className="field">
        <span>Fecha en que ganaste el título</span>
        <input
          name="awardedOn"
          type="date"
          required
          min="1920-01-01"
          defaultValue={a?.awardedOn.toISOString().slice(0, 10)}
        />
        <span className="hint">
          Para títulos de otros años cuyo reglamento no tengas a mano, elige «Prefiero
          indicarlo más tarde» en la división. No se asignan a tu categoría actual.
        </span>
      </label>
      <label className="field">
        <span>Ámbito del título</span>
        <select name="scope" required defaultValue={a?.scope ?? ""}>
          <option value="">Elige el ámbito</option>
          {Object.entries(SCOPE_LABEL).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </label>
      <SelectorCategoria
        modo="ficha"
        disciplinas={me.disciplines.map((d) => d.discipline)}
        defaults={a ?? {}}
      />
      <label className="field">
        <span>Enlace a una fuente (opcional)</span>
        <input
          name="evidenceUrl"
          type="url"
          maxLength={1000}
          defaultValue={a?.evidenceUrl ?? ""}
        />
        <span className="hint">
          Puedes declarar el título sin una fuente. Aportar un enlace no lo
          verifica automáticamente.
        </span>
      </label>
    </>
  );
  return (
    <>
      <h1>Mi trayectoria y aura</h1>
      <p>
        <Link href="/mi-ficha">Volver a mi ficha</Link> ·{" "}
        <Link href="/ayuda#aura">Cómo se calcula el aura</Link>
      </p>
      <p>
        Puedes contar tu trayectoria desde el primer día. El respaldo de
        entrenadores, organizadores o federaciones es opcional; tu rival no
        tiene que aprobar un título.
      </p>
      <h2>Mi aura por categoría</h2>
      <AuraBreakdown groups={groups} />
      <h2>Mis títulos</h2>
      <TrajectoryList achievements={achievements} />
      <p className="mut">
        Solo se toma el título con mayor aporte de cada categoría. Repetir
        títulos o subir de respaldo no suma varias veces el mismo logro.
      </p>
      {achievements.map((a) => (
        <details key={a.id} className="card">
          <summary>
            Gestionar: {a.championship}
            {a.withdrawnAt
              ? " · retirado"
              : a.rejectedAt
                ? " · excluido por moderación"
                : ""}
          </summary>
          {a.rejectionReason && (
            <p>Motivo de la decisión: {a.rejectionReason}</p>
          )}
          {!a.withdrawnAt && (
            <form action={requestAchievementReview} className="search">
              <input type="hidden" name="achievementId" value={a.id} />
              <input
                type="hidden"
                name="version"
                value={a.updatedAt.toISOString()}
              />
              <label className="field">
                <span>Fuente para solicitar respaldo o revisión</span>
                <input
                  name="evidenceUrl"
                  type="url"
                  required
                  maxLength={1000}
                  defaultValue={a.evidenceUrl ?? ""}
                />
              </label>
              <label className="field">
                <span>Qué demuestra esta fuente</span>
                <input name="note" required maxLength={500} />
              </label>
              <button>Solicitar revisión del logro</button>
            </form>
          )}
          {a.reviewRequestedAt && (
            <p>
              Has solicitado una revisión. Puedes seguir participando mientras
              se revisa.
            </p>
          )}
          {!a.withdrawnAt && !a.rejectedAt && (
            <>
              <p>
                Corregir los datos retira el respaldo anterior y vuelve a
                calcular el título como declarado.
              </p>
              <form action={saveAchievement} className="search">
                <input type="hidden" name="achievementId" value={a.id} />
                <input
                  type="hidden"
                  name="version"
                  value={a.updatedAt.toISOString()}
                />
                {fields(a)}
                <button>Guardar corrección del título</button>
              </form>
            </>
          )}
          {a.withdrawnAt && (
            <form action={restoreOwnAchievement}>
              <input type="hidden" name="achievementId" value={a.id} />
              <input
                type="hidden"
                name="version"
                value={a.updatedAt.toISOString()}
              />
              <button className="secondary">
                Volver a mostrar este título
              </button>
            </form>
          )}
          {!a.withdrawnAt && (
            <form action={withdrawAchievement}>
              <input type="hidden" name="achievementId" value={a.id} />
              <input
                type="hidden"
                name="version"
                value={a.updatedAt.toISOString()}
              />
              <button className="secondary">
                Retirar este título del aura
              </button>
            </form>
          )}
        </details>
      ))}
      <h2>Declarar un título anterior</h2>
      <form action={saveAchievement} className="search">
        {fields()}
        <button>Guardar título declarado</button>
      </form>
    </>
  );
}
