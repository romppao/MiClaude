import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "../../../lib/common/db";
import { computeRecords } from "../../../lib/fighters/record";
import { DISCIPLINE_LABEL } from "../../../lib/common/disciplines";
import RecordCards from "../../components/RecordCards";
import VerificationTag from "../../components/VerificationTag";
import { getUser } from "../../../lib/accounts/auth";
import { giveAura, removeAura } from "../../actions/aura";
import { createReport, toggleFollow } from "../../actions/community";
import { REASONS_BY_ENTITY, REPORT_REASONS, type ReportEntity } from "../../../lib/community/reports";
import { LEVEL_LABEL, METHOD_LABEL, STANCE_LABEL, resultWord } from "../../../lib/common/labels";
import { publicFighterName, publicUserName } from "../../../lib/common/names";
import { canGiveAura } from "../../../lib/aura/rules";
import { plural } from "../../../lib/common/text";
import { eventDayReached } from "../../../lib/common/dates";
import { PROBLEMAS } from "../../../lib/common/messages";
import { lookup } from "../../../lib/common/safe";

export const dynamic = "force-dynamic";

const getFighter = cache((slug: string) => db.fighter.findUnique({ where: { slug }, include: { gym: true, trainer: true, disciplines: true } }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const fighter = await getFighter((await params).slug);
  if (!fighter) return { title: "Peleador no encontrado" };
  const nombre = publicFighterName(fighter);
  return {
    title: nombre,
    description: `Ficha de ${nombre} en Ring España: récord por disciplina, combates y aura del público.`,
    // Una ficha sin reclamar u ocultada no debe aparecer en los buscadores.
    robots: fighter.listed && !fighter.hiddenAt ? undefined : { index: false, follow: false },
  };
}

/** Condición de los combates que cuentan de cara al público: ni rechazados ni de veladas canceladas. */
const COUNTED = { verification: { not: "DISPUTED" as const }, event: { status: { not: "CANCELLED" as const } } };

export default async function FighterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const fighter = await getFighter(slug);
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
    db.aura.count({ where: { fighterId: fighter.id, bout: COUNTED } }),
    db.aura.findMany({ where: { fighterId: fighter.id, bout: COUNTED }, include: { user: { select: { name: true } }, bout: { include: { event: true } } }, orderBy: { createdAt: "desc" }, take: 50 }),
    user ? db.aura.findMany({ where: { fighterId: fighter.id, userId: user.id } }) : Promise.resolve([]),
  ]);

  const back = `/peleadores/${fighter.slug}`;
  const nombre = publicFighterName(fighter);
  const publica = fighter.listed && !fighter.hiddenAt; // sin reclamar u oculta: solo se muestran nombre abreviado, récord y combates

  const reportForm = (entity: ReportEntity, entityId: string, etiqueta: string | undefined, sobre: string) =>
    user?.emailVerifiedAt ? (
      <details style={{ marginTop: 6 }}>
        <summary className="mut" aria-label={`${etiqueta ?? "¿Hay un error? Avísanos"}: ${sobre}`}>{etiqueta ?? "¿Hay un error? Avísanos"}</summary>
        <form action={createReport} style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
          <input type="hidden" name="entity" value={entity} /><input type="hidden" name="entityId" value={entityId} />
          <input type="hidden" name="back" value={back} />
          <select name="reason" aria-label="Motivo del aviso" defaultValue="">
            <option value="" disabled>Motivo…</option>
            {REASONS_BY_ENTITY[entity].map((k) => <option key={k} value={k}>{REPORT_REASONS[k]}</option>)}
          </select>
          <input name="message" aria-label="Detalles (opcional)" placeholder="Detalles (opcional)" maxLength={500} />
          <button className="secondary" aria-label={`Enviar aviso sobre ${sobre}`}>Enviar aviso</button>
        </form>
      </details>
    ) : entity === "FIGHTER" ? (
      // Quien no puede avisar (sin cuenta o sin correo confirmado) debe saber por qué y qué hacer, no encontrarse con nada.
      <p className="mut" style={{ marginTop: 6 }}>
        {user ? <Link href="/verificar">¿Hay un error en esta ficha? Confirma tu correo electrónico para avisarnos</Link>
          : <Link href={`/entrar?next=${encodeURIComponent(back)}`}>¿Hay un error en esta ficha? Entra en tu cuenta para avisarnos</Link>}
      </p>
    ) : null;
  const age = publica && fighter.birthDate ? Math.floor((Date.now() - fighter.birthDate.getTime()) / 3.15576e10) : null;

  return (
    <>
      <span className={`tag ${fighter.level}`}>{LEVEL_LABEL[fighter.level]}</span>
      {!fighter.listed && !fighter.hiddenAt && <span className="tag">ficha sin reclamar</span>}
      <h1>{nombre}</h1>
      {publica && fighter.alias && <p className="mut">“{fighter.alias}”</p>}
      {!publica && (
        <p className="mut">
          {fighter.hiddenAt
            ? "Los datos personales de esta ficha se han ocultado. Se conservan los combates porque forman parte del récord de otras personas."
            : "Esta ficha la ha creado otra persona al registrar un combate. Solo se muestra el nombre abreviado hasta que su titular la reclame o el combate se confirme. Si eres esta persona, puedes reclamarla desde «Mi ficha» o pedir que se retiren tus datos: consulta la página de privacidad."}
        </p>
      )}
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", margin: "8px 0 16px" }}>
        {user?.fighter?.id !== fighter.id && !fighter.hiddenAt && (user ? (
          <form action={toggleFollow}>
            <input type="hidden" name="fighterId" value={fighter.id} /><input type="hidden" name="back" value={back} />
            <button className={following ? "secondary" : undefined}>{following ? "Dejar de seguir" : "Seguir a este peleador"}</button>
          </form>
        ) : <Link href={`/entrar?next=${encodeURIComponent(back)}`}>Entra para seguir a este peleador</Link>)}
        <span className="mut">{plural(followerCount, "seguidor", "seguidores")}</span>
      </div>

      <RecordCards records={records} disciplines={fighter.disciplines} />
      <div className="card" style={{ marginTop: 12 }}>
        <div className="mut">Aura del público</div>
        <div className="rec">{auraTotal}</div>
        <div className="mut">{plural(auraTotal, "aura recibida", "auras recibidas")}. El aura es el reconocimiento del público: cada persona puede darla una vez por combate.</div>
      </div>
      {publica && (
        <>
          <h2>Ficha</h2>
          <table><tbody>
            {[
              ["Guardia", fighter.stance && STANCE_LABEL[fighter.stance]],
              ["Edad", age], ["Altura", fighter.heightCm && `${fighter.heightCm} cm`], ["Envergadura", fighter.reachCm && `${fighter.reachCm} cm`],
              ["Procedencia", [fighter.city, fighter.province].filter(Boolean).join(", ")],
            ].filter(([, v]) => v).map(([k, v]) => <tr key={k as string}><th scope="row">{k}</th><td>{v}</td></tr>)}
            {fighter.gym && <tr><th scope="row">Gimnasio</th><td><Link href={`/gimnasios/${fighter.gym.slug}`}>{fighter.gym.name}</Link></td></tr>}
            {fighter.trainer && <tr><th scope="row">Entrenador</th><td><Link href={`/entrenadores/${fighter.trainer.slug}`}>{fighter.trainer.name}</Link></td></tr>}
          </tbody></table>
          {fighter.bio && <p>{fighter.bio}</p>}
        </>
      )}
      {reportForm("FIGHTER", fighter.id, undefined, `la ficha de ${nombre}`)}

      <h2>Combates</h2>
      <div className="table-wrap" tabIndex={0} role="region" aria-label={`Combates de ${nombre}`}>
      <table className="apilada">
        <caption className="mut" style={{ textAlign: "left" }}>Combates de {nombre}, del más reciente al más antiguo</caption>
        <thead><tr><th scope="col">Fecha</th><th scope="col">Rival</th><th scope="col">Resultado</th><th scope="col">Cómo terminó</th><th scope="col">Velada</th><th scope="col">Aura</th></tr></thead>
        <tbody>
          {bouts.map((b) => {
            const isA = b.fighterAId === fighter.id;
            const opp = isA ? b.fighterB : b.fighterA;
            // Lo que declara un peleador sobre su rival no se muestra como hecho en la ficha del rival hasta que este lo confirme; lo rechazado tampoco.
            const enRevision = b.verification === "DISPUTED";
            const pendiente = b.verification === "SELF_REPORTED" && !isA;
            const oculto = enRevision || pendiente;
            const r = resultWord(b.result, isA);
            const mine = myAuras.some((x) => x.boutId === b.id);
            const aura = canGiveAura({ bout: b, fighterId: fighter.id, viewerFighterId: user?.fighter?.id });
            // Cuando no se puede dar aura, se dice por qué (en vez de dejar la celda vacía).
            const notaAura = !aura.ok ? lookup(PROBLEMAS, aura.problema) : pendiente ? `Se podrá dar aura cuando ${nombre} confirme el combate.` : null;
            return (
              <tr key={b.id}>
                <td data-label="Fecha">{b.event.date.toLocaleDateString("es-ES", { timeZone: "Europe/Madrid" })}</td>
                <td data-label="Rival"><Link href={`/peleadores/${opp.slug}`}>{publicFighterName(opp)}</Link></td>
                <td data-label="Resultado">
                  {enRevision ? <span className="mut">Resultado en revisión</span>
                    : pendiente ? <span className="mut">Pendiente de confirmar por {nombre}</span>
                    : !b.result ? <span className="mut">{eventDayReached(b.event.date) ? "Resultado por anotar" : "Próximo combate"}</span>
                    : <span className={r.cls}>{r.text}</span>}
                </td>
                <td data-label="Cómo terminó">{!oculto && b.method ? METHOD_LABEL[b.method] : ""}{!oculto && b.endRound ? ` (asalto ${b.endRound})` : ""}</td>
                <td data-label="Velada">
                  <Link href={`/veladas/${b.event.slug}`}>{b.event.name}</Link>{" "}
                  <span className="tag">{DISCIPLINE_LABEL[b.event.discipline]}</span><span className={`tag ${b.event.level}`}>{LEVEL_LABEL[b.event.level]}</span>
                  {b.event.status === "CANCELLED" && <span className="tag">cancelada</span>}
                  <VerificationTag verification={b.verification} />
                  {b.evidenceUrl && <a className="tag" href={b.evidenceUrl} target="_blank" rel="noopener noreferrer nofollow ugc">Ver evidencia<span aria-hidden="true"> ↗</span><span className="sr-only"> (se abre en otra pestaña)</span></a>}
                </td>
                <td data-label="Aura">
                  {reportForm("BOUT", b.id, undefined, `el combate contra ${publicFighterName(opp)}`)}
                  {aura.ok && !pendiente && (user?.emailVerifiedAt ? (
                    mine ? (
                      <form action={removeAura} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <input type="hidden" name="boutId" value={b.id} /><input type="hidden" name="fighterId" value={fighter.id} />
                        <input type="hidden" name="back" value={back} />
                        <span className="W">Has dado aura</span>
                        <button className="secondary" aria-label={`Quitar mi aura del combate de ${nombre} en ${b.event.name}`}>Quitar mi aura</button>
                      </form>
                    ) : (
                      <form action={giveAura} style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        <input type="hidden" name="boutId" value={b.id} /><input type="hidden" name="fighterId" value={fighter.id} />
                        <input type="hidden" name="back" value={back} />
                        <input name="comment" aria-label="Tu comentario (opcional)" placeholder="Tu comentario (opcional)" maxLength={500} />
                        <label className="mut"><input type="checkbox" name="attended" /> Lo vi en directo</label>
                        <button aria-label={`Dar aura a ${nombre} por el combate en ${b.event.name}`}>Dar aura</button>
                        <span className="hint mut" style={{ flexBasis: "100%" }}>Se mostrará tu nombre ({publicUserName(user.name)}) y tu comentario, si lo escribes.</span>
                      </form>
                    )
                  ) : user ? <Link href="/verificar">Confirma tu correo electrónico para dar aura</Link>
                    : <Link href={`/entrar?next=${encodeURIComponent(back)}`}>Entra para dar aura</Link>)}
                  {notaAura && <span className="mut">{notaAura}</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
      {bouts.length === 0 && <p className="mut">Sin combates registrados.</p>}

      <h2>Lo que dice el público</h2>
      {auras.map((r) => (
        <div key={r.id} className="card" style={{ marginBottom: 8 }}>
          <strong>{publicUserName(r.user.name)}</strong> <span className="mut">dio aura en «{r.bout.event.name}»{r.attended ? " · lo vio en directo" : ""}</span>
          {r.hiddenAt ? <div className="mut">Comentario retirado por moderación.</div> : r.comment && <div>{r.comment}</div>}
          {!r.hiddenAt && r.comment && reportForm("AURA", r.id, "Avisar de este comentario", `el comentario de ${publicUserName(r.user.name)}`)}
        </div>
      ))}
      {auras.length === 0 && <p className="mut">Todavía nadie ha dado aura a este peleador. Si has visto uno de sus combates, puedes ser la primera persona.</p>}
    </>
  );
}
