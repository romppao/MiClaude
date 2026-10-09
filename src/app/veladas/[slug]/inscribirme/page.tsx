import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "../../../../lib/common/db";
import { getUser } from "../../../../lib/accounts/auth";
import { todayMadrid } from "../../../../lib/common/dates";
import { EVENT_KIND_LABEL, LEVEL_LABEL, fmtDate } from "../../../../lib/common/labels";
import { DISCIPLINE_LABEL, categoryLabel } from "../../../../lib/common/disciplines";
import { REG_MESSAGE_MAX, REG_STATUS_LABEL, claveCategoria, enListaDeEspera, inscripcionAbierta, ocupacion, puedeRetirarInscripcion } from "../../../../lib/events/registrations";
import { requestRegistration, withdrawRegistration } from "../../../actions/registrations";
import SelectorCategoria from "../../../components/SelectorCategoria";

export const metadata: Metadata = { title: "Solicitar participar", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * Pedir participar en una velada o un interclub. La categoría llega rellenada con la de la ficha del peleador en esa disciplina; el peso
 * y el mensaje son opcionales. Si ya la pidió, se ve su estado y se puede retirar.
 */
export default async function Inscribirme({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = await db.event.findUnique({ where: { slug } });
  if (!e) notFound();
  const user = await getUser();
  const me = user?.fighter ?? null;
  const [mia, ficha] = me ? await Promise.all([
    db.eventRegistration.findUnique({ where: { eventId_fighterId: { eventId: e.id, fighterId: me.id } } }),
    db.fighterDiscipline.findUnique({ where: { fighterId_discipline: { fighterId: me.id, discipline: e.discipline } } }),
  ]) : [null, null];
  const abierta = inscripcionAbierta(e, todayMadrid());
  // Plazas por categoría: si el organizador las ha puesto, se elige entre ellas y se ve cuántas quedan.
  const [plazas, filas] = await Promise.all([
    db.eventSlot.findMany({ where: { eventId: e.id }, orderBy: [{ divisionId: "asc" }, { weightClass: "asc" }] }),
    db.eventRegistration.findMany({ where: { eventId: e.id }, select: { status: true, divisionId: true, weightClass: true } }),
  ]);
  const ocup = ocupacion(plazas, filas);
  const enEspera = mia ? enListaDeEspera(mia, ocup) : false;
  const propia = ficha && ficha.level === e.level ? claveCategoria(ficha.divisionId, ficha.weightClass) : "";
  const aqui = `/veladas/${e.slug}/inscribirme`;
  return (
    <div className="pantalla" style={{ gap: 18, maxWidth: 640 }}>
      <div><h1>Solicitar participar</h1><p className="lead" style={{ fontSize: 16 }}>En <Link href={`/veladas/${e.slug}`}>{e.name}</Link>: {EVENT_KIND_LABEL[e.kind].toLowerCase()} de {DISCIPLINE_LABEL[e.discipline]} {LEVEL_LABEL[e.level].toLowerCase()}, {fmtDate(e.date)}, {e.city}.</p></div>
      {e.registrationNote && <p className="notice" style={{ margin: 0 }}><span aria-hidden="true">ℹ </span><strong>Requisitos del organizador:</strong> {e.registrationNote}</p>}
      {mia && mia.status !== "WITHDRAWN" ? (
        <section className="tarjeta" aria-label="Tu solicitud">
          <span className={`pildora ${mia.status === "ACCEPTED" ? "pildora-acc" : mia.status === "PENDING" ? "pildora-violeta" : ""}`} style={{ alignSelf: "flex-start" }}>{enEspera ? "En lista de espera" : REG_STATUS_LABEL[mia.status]}</span>
          <div>Categoría: {categoryLabel(e.discipline, e.level, mia.divisionId, mia.weightClass)}{mia.weightKg ? ` · ${String(mia.weightKg).replace(".", ",")} kg` : ""}</div>
          {mia.reply && <p style={{ margin: 0 }}><strong>Mensaje del organizador:</strong> {mia.reply}</p>}
          <p className="mut" style={{ margin: 0 }}>{mia.status === "ACCEPTED" ? "El organizador cuenta contigo. Te avisará cuando te empareje en el cartel." : enEspera ? "Tu categoría tiene todas sus plazas cubiertas. Si se libera una o el organizador amplía las plazas, podrá aceptarte; te avisaremos por correo." : mia.status === "PENDING" ? "El organizador la está revisando. Te avisaremos por correo cuando responda." : "El organizador no puede contar contigo esta vez."}</p>
          {puedeRetirarInscripcion(mia.status) && (
            <form action={withdrawRegistration}>
              <input type="hidden" name="registrationId" value={mia.id} /><input type="hidden" name="desde" value="velada" />
              <button className="secondary">Retirar mi solicitud</button>
            </form>
          )}
        </section>
      ) : !abierta ? (
        <p className="notice notice-bad" style={{ margin: 0 }}><span aria-hidden="true">⚠ </span>La inscripción de este evento está cerrada. <Link href="/veladas?inscripcion=abierta">Ver eventos con inscripción abierta</Link></p>
      ) : !user ? (
        <div className="tarjeta"><p style={{ margin: 0 }}>Para pedir participar necesitas una cuenta de peleador.</p><Link className="btn btn-grande" href={`/entrar?next=${encodeURIComponent(aqui)}`}>Entrar</Link><Link className="btn secondary" href="/registro?tipo=peleador">Crear mi cuenta de peleador</Link></div>
      ) : !user.emailVerifiedAt ? (
        <p className="notice notice-bad" style={{ margin: 0 }}><span aria-hidden="true">⚠ </span>Primero <Link href="/verificar">confirma tu correo electrónico</Link>.</p>
      ) : !me ? (
        <p className="notice notice-bad" style={{ margin: 0 }}><span aria-hidden="true">⚠ </span>Para pedir participar necesitas tu ficha de peleador. <Link href="/mi-ficha">Crear o reclamar mi ficha</Link></p>
      ) : !ficha ? (
        <p className="notice notice-bad" style={{ margin: 0 }}><span aria-hidden="true">⚠ </span>Este evento es de {DISCIPLINE_LABEL[e.discipline]}, que no está en tu ficha. <Link href="/mi-ficha#pestana-datos">Añadirla en «Mi ficha»</Link></p>
      ) : (
        <form action={requestRegistration} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <input type="hidden" name="eventId" value={e.id} />
          {plazas.length ? (
            <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
              <legend className="leyenda">Elige tu categoría</legend>
              <span className="hint">El organizador busca peleadores en estas categorías.</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                {plazas.map((pl) => {
                  const clave = claveCategoria(pl.divisionId, pl.weightClass);
                  const o = ocup.get(clave);
                  return (
                    <label key={pl.id} className="marcar tarjeta" style={{ padding: "10px 14px", gap: 12 }}>
                      <input type="radio" name="categoria" value={clave} required defaultChecked={clave === propia} />
                      <span style={{ display: "flex", flexDirection: "column" }}>
                        <span>{categoryLabel(e.discipline, e.level, pl.divisionId || null, pl.weightClass)}</span>
                        <span className="meta">{o?.llena ? "Completa: quedarías en lista de espera" : o?.libres === 1 ? "Queda 1 plaza" : `Quedan ${o?.libres ?? pl.places} plazas`}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ) : (
            <SelectorCategoria modo="combate" fijas={{ discipline: e.discipline, level: e.level }} defaults={{ discipline: e.discipline, level: e.level, divisionId: ficha.level === e.level ? ficha.divisionId ?? "" : "", weightClass: ficha.level === e.level ? ficha.weightClass ?? "" : "" }} />
          )}
          <label className="field"><span>Tu peso actual en kilos (opcional)</span><input name="weightKg" inputMode="decimal" maxLength={6} placeholder="67,5" /><span className="hint">Ayuda al organizador a emparejarte.</span></label>
          <label className="field"><span>¿Algo que deba saber el organizador? (opcional)</span><textarea name="message" maxLength={REG_MESSAGE_MAX} rows={2} placeholder="Tu gimnasio, tu entrenador, tu experiencia…" /></label>
          <p className="mut" style={{ margin: 0 }}>El organizador verá tu ficha (récord, aura y combates), la categoría, el peso y lo que escribas. Pedir participar no te asegura un combate: el organizador elige y empareja.</p>
          <button className="btn-grande">Solicitar participar</button>
        </form>
      )}
      <p style={{ margin: 0 }}><Link href="/mis-inscripciones">Ver todas mis inscripciones</Link></p>
    </div>
  );
}
