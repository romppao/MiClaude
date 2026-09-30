import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "../../../lib/db";
import { computeRecords, formatRecord } from "../../../lib/record";
import { getUser } from "../../../lib/auth";
import { createReport, rateBoxer, toggleFollow } from "../../actions";
import { REPORT_REASONS } from "../../../lib/reports";
import { LEVEL_LABEL, METHOD_LABEL, STANCE_LABEL, fmtDate } from "../../../lib/labels";

export const dynamic = "force-dynamic";

export default async function BoxerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const boxer = await db.boxer.findUnique({ where: { slug }, include: { gym: true, trainer: true } });
  if (!boxer) notFound();
  const bouts = await db.bout.findMany({
    where: { OR: [{ boxerAId: boxer.id }, { boxerBId: boxer.id }] },
    include: { event: true, boxerA: true, boxerB: true },
    orderBy: { event: { date: "desc" } },
  });
  const records = computeRecords(boxer.id, bouts);
  const user = await getUser();
  const [followerCount, following] = await Promise.all([
    db.follow.count({ where: { boxerId: boxer.id } }),
    user ? db.follow.findUnique({ where: { userId_boxerId: { userId: user.id, boxerId: boxer.id } } }) : Promise.resolve(null),
  ]);
  const [ratings, myRatings] = await Promise.all([
    db.rating.findMany({ where: { boxerId: boxer.id }, include: { user: { select: { name: true } }, bout: { include: { event: true } } }, orderBy: { createdAt: "desc" }, take: 50 }),
    user ? db.rating.findMany({ where: { boxerId: boxer.id, userId: user.id } }) : Promise.resolve([]),
  ]);
  const avg = ratings.length ? ratings.reduce((s, r) => s + r.score, 0) / ratings.length : null;
  const reportForm = (entity: "BOUT" | "BOXER", entityId: string) =>
    user?.emailVerifiedAt ? (
      <details style={{ marginTop: 6 }}>
        <summary className="mut">¿Hay un error? Avísanos</summary>
        <form action={createReport} style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
          <input type="hidden" name="entity" value={entity} /><input type="hidden" name="entityId" value={entityId} />
          <input type="hidden" name="back" value={`/boxeadores/${boxer.slug}`} />
          <select name="reason" aria-label="Motivo del aviso" defaultValue="">
            <option value="" disabled>Motivo…</option>
            {Object.entries(REPORT_REASONS).filter(([k]) => entity === "BOUT" ? k !== "SUPLANTACION" : k !== "NO_OCURRIO" && k !== "RESULTADO").map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input name="message" aria-label="Detalles (opcional)" placeholder="Detalles (opcional)" maxLength={500} />
          <button className="secondary">Enviar aviso</button>
        </form>
      </details>
    ) : null;
  const isParticipant = (b: { boxerAId: string; boxerBId: string }) => !!user?.boxer && (user.boxer.id === b.boxerAId || user.boxer.id === b.boxerBId);
  const age = boxer.birthDate ? Math.floor((Date.now() - boxer.birthDate.getTime()) / 3.15576e10) : null;
  return (
    <>
      <span className={`tag ${boxer.level}`}>{LEVEL_LABEL[boxer.level]}</span>
      <h1>{boxer.firstName} {boxer.lastName}</h1>
      {boxer.alias && <p className="mut">“{boxer.alias}”</p>}
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", margin: "8px 0 16px" }}>
        {user?.boxer?.id !== boxer.id && (user ? (
          <form action={toggleFollow}>
            <input type="hidden" name="boxerId" value={boxer.id} /><input type="hidden" name="back" value={`/boxeadores/${boxer.slug}`} />
            <button className={following ? "secondary" : undefined}>{following ? "Dejar de seguir" : "Seguir a este boxeador"}</button>
          </form>
        ) : <Link href={`/entrar?next=${encodeURIComponent(`/boxeadores/${boxer.slug}`)}`}>Entra para seguir a este boxeador</Link>)}
        <span className="mut">{followerCount} {followerCount === 1 ? "seguidor" : "seguidores"}</span>
      </div>
      <div className="grid">
        {(["PRO", "AMATEUR"] as const).map((l) => (
          <div key={l} className="card"><div className="mut">Récord {LEVEL_LABEL[l].toLowerCase()} (V-D-E)</div><div className="rec">{formatRecord(records[l])}</div><div className="mut">{records[l].ko} por KO{records[l].unverified ? ` · ${records[l].unverified} pendientes de confirmar` : ""}</div></div>
        ))}
      </div>
      <div className="card" style={{ marginTop: 12 }}>
        <div className="mut">Valoración del público</div>
        <div className="rec">{avg ? `${avg.toFixed(1)} / 5` : "—"}</div>
        <div className="mut">{ratings.length} {ratings.length === 1 ? "valoración" : "valoraciones"}</div>
      </div>
      <h2>Ficha</h2>
      <table><tbody>
        {[
          ["Categoría", boxer.weightClass], ["Guardia", boxer.stance && STANCE_LABEL[boxer.stance]],
          ["Edad", age], ["Altura", boxer.heightCm && `${boxer.heightCm} cm`], ["Envergadura", boxer.reachCm && `${boxer.reachCm} cm`],
          ["Procedencia", [boxer.city, boxer.province].filter(Boolean).join(", ")],
        ].filter(([, v]) => v).map(([k, v]) => <tr key={k as string}><th>{k}</th><td>{v}</td></tr>)}
        {boxer.gym && <tr><th>Gimnasio</th><td><Link href={`/gimnasios/${boxer.gym.slug}`}>{boxer.gym.name}</Link></td></tr>}
        {boxer.trainer && <tr><th>Entrenador</th><td><Link href={`/entrenadores/${boxer.trainer.slug}`}>{boxer.trainer.name}</Link></td></tr>}
      </tbody></table>
      {boxer.bio && <p>{boxer.bio}</p>}
      {reportForm("BOXER", boxer.id)}
      <h2>Combates</h2>
      <table>
        <thead><tr><th>Fecha</th><th>Rival</th><th></th><th>Método</th><th>Velada</th><th>Tu valoración</th></tr></thead>
        <tbody>
          {bouts.map((b) => {
            const isA = b.boxerAId === boxer.id;
            const opp = isA ? b.boxerB : b.boxerA;
            const out = !b.result ? "" : b.result === "DRAW" ? "D" : b.result === "NO_CONTEST" ? "NC" : (b.result === "A_WIN") === isA ? "W" : "L";
            return (
              <tr key={b.id}>
                <td>{b.event.date.toLocaleDateString("es-ES", { timeZone: "Europe/Madrid" })}</td>
                <td><Link href={`/boxeadores/${opp.slug}`}>{opp.firstName} {opp.lastName}</Link></td>
                <td className={out === "NC" ? "D" : out}>{out || "—"}</td>
                <td>{b.method ? METHOD_LABEL[b.method] : ""}{b.endRound ? ` (R${b.endRound})` : ""}</td>
                <td><Link href={`/veladas/${b.event.slug}`}>{b.event.name}</Link> <span className={`tag ${b.event.level}`}>{LEVEL_LABEL[b.event.level]}</span>{b.evidenceUrl && <a className="tag" href={b.evidenceUrl} target="_blank" rel="noopener noreferrer nofollow ugc">evidencia ↗</a>}{b.verification === "SELF_REPORTED" && <span className="tag">pendiente de confirmar</span>}{b.verification === "DISPUTED" && <span className="tag">en revisión</span>}{(b.verification === "VERIFIED" || b.verification === "CONFIRMED") && <span className="tag">{b.verification === "VERIFIED" ? "verificado" : "confirmado por el rival"}</span>}</td>
                <td>
                  {reportForm("BOUT", b.id)}
                  {b.result && b.verification !== "DISPUTED" && b.event.date <= new Date() && !isParticipant(b) && (
                    user?.emailVerifiedAt ? (
                      <form action={rateBoxer} style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        <input type="hidden" name="boutId" value={b.id} /><input type="hidden" name="boxerId" value={boxer.id} />
                        <input type="hidden" name="back" value={`/boxeadores/${boxer.slug}`} />
                        <select name="score" aria-label="Tu nota" defaultValue={myRatings.find((r) => r.boutId === b.id)?.score ?? 5}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} {n === 1 ? "estrella" : "estrellas"}</option>)}</select>
                        <input name="comment" aria-label="Tu comentario (opcional)" placeholder="Tu comentario (opcional)" defaultValue={myRatings.find((r) => r.boutId === b.id)?.comment ?? ""} maxLength={500} />
                        <label className="mut"><input type="checkbox" name="attended" defaultChecked={myRatings.find((r) => r.boutId === b.id)?.attended} /> lo vi en directo</label>
                        <button>{myRatings.some((r) => r.boutId === b.id) ? "Actualizar mi valoración" : "Valorar a este boxeador"}</button>
                      </form>
                    ) : user ? <Link href="/verificar">Confirma tu correo electrónico para valorar</Link>
                      : <Link href={`/entrar?next=${encodeURIComponent(`/boxeadores/${boxer.slug}`)}`}>Entra para valorar</Link>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {bouts.length === 0 && <p className="mut">Sin combates registrados.</p>}
      <h2>Lo que dice el público</h2>
      {ratings.map((r) => (
        <div key={r.id} className="card" style={{ marginBottom: 8 }}>
          <strong>{r.score} ★</strong> <span className="mut">· {r.user.name} · {r.bout.event.name}{r.attended ? " · lo vio en directo" : ""}</span>
          {r.comment && <div>{r.comment}</div>}
        </div>
      ))}
      {ratings.length === 0 && <p className="mut">Todavía nadie ha valorado a este boxeador.</p>}
    </>
  );
}
