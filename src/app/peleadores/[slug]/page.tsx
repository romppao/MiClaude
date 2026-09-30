import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "../../../lib/db";
import { computeRecords } from "../../../lib/record";
import { DISCIPLINE_LABEL } from "../../../lib/disciplines";
import RecordCards from "../../RecordCards";
import { getUser } from "../../../lib/auth";
import { createReport, giveAura, removeAura, toggleFollow } from "../../actions";
import { REPORT_REASONS } from "../../../lib/reports";
import { LEVEL_LABEL, METHOD_LABEL, STANCE_LABEL, fmtDate } from "../../../lib/labels";

export const dynamic = "force-dynamic";

export default async function FighterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const fighter = await db.fighter.findUnique({ where: { slug }, include: { gym: true, trainer: true, disciplines: true } });
  if (!fighter) notFound();
  const bouts = await db.bout.findMany({
    where: { OR: [{ fighterAId: fighter.id }, { fighterBId: fighter.id }] },
    include: { event: true, fighterA: true, fighterB: true },
    orderBy: { event: { date: "desc" } },
  });
  const records = computeRecords(fighter.id, bouts);
  const user = await getUser();
  const [followerCount, following] = await Promise.all([
    db.follow.count({ where: { fighterId: fighter.id } }),
    user ? db.follow.findUnique({ where: { userId_fighterId: { userId: user.id, fighterId: fighter.id } } }) : Promise.resolve(null),
  ]);
  const [auraTotal, auras, myAuras] = await Promise.all([
    db.aura.count({ where: { fighterId: fighter.id } }),
    db.aura.findMany({ where: { fighterId: fighter.id }, include: { user: { select: { name: true } }, bout: { include: { event: true } } }, orderBy: { createdAt: "desc" }, take: 50 }),
    user ? db.aura.findMany({ where: { fighterId: fighter.id, userId: user.id } }) : Promise.resolve([]),
  ]);
  const reportForm = (entity: "BOUT" | "FIGHTER", entityId: string) =>
    user?.emailVerifiedAt ? (
      <details style={{ marginTop: 6 }}>
        <summary className="mut">¿Hay un error? Avísanos</summary>
        <form action={createReport} style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
          <input type="hidden" name="entity" value={entity} /><input type="hidden" name="entityId" value={entityId} />
          <input type="hidden" name="back" value={`/peleadores/${fighter.slug}`} />
          <select name="reason" aria-label="Motivo del aviso" defaultValue="">
            <option value="" disabled>Motivo…</option>
            {Object.entries(REPORT_REASONS).filter(([k]) => entity === "BOUT" ? k !== "SUPLANTACION" : k !== "NO_OCURRIO" && k !== "RESULTADO").map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input name="message" aria-label="Detalles (opcional)" placeholder="Detalles (opcional)" maxLength={500} />
          <button className="secondary">Enviar aviso</button>
        </form>
      </details>
    ) : null;
  const isParticipant = (b: { fighterAId: string; fighterBId: string }) => !!user?.fighter && (user.fighter.id === b.fighterAId || user.fighter.id === b.fighterBId);
  const age = fighter.birthDate ? Math.floor((Date.now() - fighter.birthDate.getTime()) / 3.15576e10) : null;
  return (
    <>
      <span className={`tag ${fighter.level}`}>{LEVEL_LABEL[fighter.level]}</span>
      <h1>{fighter.firstName} {fighter.lastName}</h1>
      {fighter.alias && <p className="mut">“{fighter.alias}”</p>}
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", margin: "8px 0 16px" }}>
        {user?.fighter?.id !== fighter.id && (user ? (
          <form action={toggleFollow}>
            <input type="hidden" name="fighterId" value={fighter.id} /><input type="hidden" name="back" value={`/peleadores/${fighter.slug}`} />
            <button className={following ? "secondary" : undefined}>{following ? "Dejar de seguir" : "Seguir a este peleador"}</button>
          </form>
        ) : <Link href={`/entrar?next=${encodeURIComponent(`/peleadores/${fighter.slug}`)}`}>Entra para seguir a este peleador</Link>)}
        <span className="mut">{followerCount} {followerCount === 1 ? "seguidor" : "seguidores"}</span>
      </div>

      <RecordCards records={records} disciplines={fighter.disciplines} />
      <div className="card" style={{ marginTop: 12 }}>
        <div className="mut">Aura del público</div>
        <div className="rec">{auraTotal}</div>
        <div className="mut">{auraTotal === 1 ? "1 aura recibida" : `${auraTotal} auras recibidas`}. El aura es el reconocimiento del público: cada persona puede darla una vez por combate.</div>
      </div>
      <h2>Ficha</h2>
      <table><tbody>
        {[
          ["Guardia", fighter.stance && STANCE_LABEL[fighter.stance]],
          ["Edad", age], ["Altura", fighter.heightCm && `${fighter.heightCm} cm`], ["Envergadura", fighter.reachCm && `${fighter.reachCm} cm`],
          ["Procedencia", [fighter.city, fighter.province].filter(Boolean).join(", ")],
        ].filter(([, v]) => v).map(([k, v]) => <tr key={k as string}><th>{k}</th><td>{v}</td></tr>)}
        {fighter.gym && <tr><th>Gimnasio</th><td><Link href={`/gimnasios/${fighter.gym.slug}`}>{fighter.gym.name}</Link></td></tr>}
        {fighter.trainer && <tr><th>Entrenador</th><td><Link href={`/entrenadores/${fighter.trainer.slug}`}>{fighter.trainer.name}</Link></td></tr>}
      </tbody></table>
      {fighter.bio && <p>{fighter.bio}</p>}
      {reportForm("FIGHTER", fighter.id)}
      <h2>Combates</h2>
      <table>
        <thead><tr><th>Fecha</th><th>Rival</th><th></th><th>Método</th><th>Velada</th><th>Aura</th></tr></thead>
        <tbody>
          {bouts.map((b) => {
            const isA = b.fighterAId === fighter.id;
            const opp = isA ? b.fighterB : b.fighterA;
            const out = !b.result ? "" : b.result === "DRAW" ? "D" : b.result === "NO_CONTEST" ? "NC" : (b.result === "A_WIN") === isA ? "W" : "L";
            return (
              <tr key={b.id}>
                <td>{b.event.date.toLocaleDateString("es-ES", { timeZone: "Europe/Madrid" })}</td>
                <td><Link href={`/peleadores/${opp.slug}`}>{opp.firstName} {opp.lastName}</Link></td>
                <td className={out === "NC" ? "D" : out}>{out || "—"}</td>
                <td>{b.method ? METHOD_LABEL[b.method] : ""}{b.endRound ? ` (R${b.endRound})` : ""}</td>
                <td><Link href={`/veladas/${b.event.slug}`}>{b.event.name}</Link> <span className="tag">{DISCIPLINE_LABEL[b.event.discipline]}</span><span className={`tag ${b.event.level}`}>{LEVEL_LABEL[b.event.level]}</span>{b.evidenceUrl && <a className="tag" href={b.evidenceUrl} target="_blank" rel="noopener noreferrer nofollow ugc">evidencia ↗</a>}{b.verification === "SELF_REPORTED" && <span className="tag">pendiente de confirmar</span>}{b.verification === "DISPUTED" && <span className="tag">en revisión</span>}{(b.verification === "VERIFIED" || b.verification === "CONFIRMED") && <span className="tag">{b.verification === "VERIFIED" ? "verificado" : "confirmado por el rival"}</span>}</td>
                <td>
                  {reportForm("BOUT", b.id)}
                  {b.result && b.verification !== "DISPUTED" && b.event.date <= new Date() && !isParticipant(b) && (
                    user?.emailVerifiedAt ? (
                      myAuras.some((r) => r.boutId === b.id) ? (
                        <form action={removeAura} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                          <input type="hidden" name="boutId" value={b.id} /><input type="hidden" name="fighterId" value={fighter.id} />
                          <input type="hidden" name="back" value={`/peleadores/${fighter.slug}`} />
                          <span className="W">Has dado aura</span>
                          <button className="secondary">Quitar mi aura</button>
                        </form>
                      ) : (
                        <form action={giveAura} style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          <input type="hidden" name="boutId" value={b.id} /><input type="hidden" name="fighterId" value={fighter.id} />
                          <input type="hidden" name="back" value={`/peleadores/${fighter.slug}`} />
                          <input name="comment" aria-label="Tu comentario (opcional)" placeholder="Tu comentario (opcional)" maxLength={500} />
                          <label className="mut"><input type="checkbox" name="attended" /> Lo vi en directo</label>
                          <button>Dar aura</button>
                        </form>
                      )
                    ) : user ? <Link href="/verificar">Confirma tu correo electrónico para dar aura</Link>
                      : <Link href={`/entrar?next=${encodeURIComponent(`/peleadores/${fighter.slug}`)}`}>Entra para dar aura</Link>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {bouts.length === 0 && <p className="mut">Sin combates registrados.</p>}
      <h2>Lo que dice el público</h2>
      {auras.map((r) => (
        <div key={r.id} className="card" style={{ marginBottom: 8 }}>
          <strong>{r.user.name}</strong> <span className="mut">dio aura en «{r.bout.event.name}»{r.attended ? " · lo vio en directo" : ""}</span>
          {r.comment && <div>{r.comment}</div>}
        </div>
      ))}
      {auras.length === 0 && <p className="mut">Todavía nadie ha dado aura a este peleador. Si has visto uno de sus combates, puedes ser la primera persona.</p>}
    </>
  );
}
