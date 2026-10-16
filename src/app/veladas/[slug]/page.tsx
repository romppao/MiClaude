import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "../../../lib/common/db";
import { LEVEL_LABEL, METHOD_LABEL, fmtDate } from "../../../lib/common/labels";
import { divisionLabel } from "../../../lib/common/competition";
import { DISCIPLINE_LABEL, weightClassLabel, categoryLabel } from "../../../lib/common/disciplines";
import { publicFighterName } from "../../../lib/common/names";
import VerificationTag from "../../components/VerificationTag";
import { eventDayReached, todayMadrid } from "../../../lib/common/dates";
import { getUser } from "../../../lib/accounts/auth";
import { REG_STATUS_LABEL, claveCategoria, inscripcionAbierta, ocupacion } from "../../../lib/events/registrations";
import { veladaAbiertaAlPublico } from "../../../lib/media/rules";
import { recordHidden } from "../../../lib/fighters/privacy";
import { GaleriaMedios, SELECT_MEDIO } from "../../components/Multimedia";
import { bloquearUsuario, createReport } from "../../actions/community";
import { bloqueadosPor } from "../../../lib/community/bloqueos";
import { setAttendance } from "../../actions/events";
import { calendarDayStart } from "../../../lib/common/dates";
import { ESTADO_ENTRADA, MAX_ENTRADAS, cierreDeReservas, fmtBizum, fmtHora, motivoSinReserva, plazasOcupadas, urlCartel } from "../../../lib/events/entradas";
import { reservarEntradas } from "../../actions/entradas";
import ReservaEntradas from "../../components/ReservaEntradas";

export const dynamic = "force-dynamic";

const getEvent = cache((slug: string) =>
  db.event.findUnique({
    where: { slug },
    include: { organizer: { select: { role: true, trainer: { select: { slug: true, name: true } }, organizerRequest: { select: { orgName: true, status: true } } } }, bouts: { orderBy: { order: "desc" }, include: { fighterA: true, fighterB: true, supportAccreditation: true } } },
  }),
);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const e = await getEvent((await params).slug);
  if (!e) return { title: "Velada no encontrada" };
  return { title: e.name, description: `${e.name}: ${DISCIPLINE_LABEL[e.discipline]} · ${fmtDate(e.date)} · ${e.venue}, ${e.city}. Cartel y resultados en Lona.` };
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ahora = new Date();
  const e = await getEvent(slug);
  if (!e) notFound();
  const org = e.organizer?.organizerRequest;
  const oficial = !!e.organizerId && org?.status === "APPROVED";
  const entrenador = e.organizer?.role === "TRAINER" ? e.organizer.trainer : null;
  const [user, todosLosMedios] = await Promise.all([getUser(), db.mediaItem.findMany({ where: { eventId: e.id, hiddenAt: null }, orderBy: [{ createdAt: "desc" }, { id: "asc" }], take: 60, select: SELECT_MEDIO })]);
  // Lo que compartieron personas que quien mira ha bloqueado no se le muestra (lib/community/bloqueos.ts).
  const ocultos = await bloqueadosPor(user?.id);
  const medios = todosLosMedios.filter((m) => !ocultos.includes(m.uploaderId));
  if ((e.status === "PENDING_AUTHORIZATION" || e.status === "REJECTED") && user?.id !== e.organizerId && user?.role !== "ADMIN") notFound();
  // Plazas por categoría que ofrece el organizador, con las que quedan libres.
  const plazas = e.registrationOpen ? await db.eventSlot.findMany({ where: { eventId: e.id }, orderBy: [{ divisionId: "asc" }, { weightClass: "asc" }] }) : [];
  const ocupPlazas = plazas.length ? ocupacion(plazas, await db.eventRegistration.findMany({ where: { eventId: e.id }, select: { status: true, divisionId: true, weightClass: true } })) : new Map();
  const miInscripcion = user?.fighter ? await db.eventRegistration.findUnique({ where: { eventId_fighterId: { eventId: e.id, fighterId: user.fighter.id } }, select: { status: true } }) : null;
  const [asistentes, asistencia] = await Promise.all([
    db.eventAttendance.count({ where: { eventId: e.id } }),
    user ? db.eventAttendance.findUnique({ where: { userId_eventId: { userId: user.id, eventId: e.id } } }) : null,
  ]);
  const compartir = veladaAbiertaAlPublico(e, todayMadrid());
  // Entradas en Lona: la reserva activa de quien mira y las plazas que quedan (lib/events/entradas.ts).
  const motivo = motivoSinReserva(e, ahora);
  const conEntradas = e.ticketsOpen && !!e.ticketPriceEuros && !!e.bizumPhone && e.status === "SCHEDULED";
  const [miReserva, ocupadas] = conEntradas ? await Promise.all([
    user ? db.ticketReservation.findFirst({ where: { eventId: e.id, userId: user.id, OR: [{ status: { in: ["CONFIRMED", "CHECKED_IN"] } }, { status: "PENDING_DEPOSIT", depositUntil: { gte: ahora } }] }, orderBy: { createdAt: "desc" } }) : null,
    plazasOcupadas(db, e.id, ahora),
  ]) : [null, 0];
  const libres = e.ticketCapacity !== null ? Math.max(0, e.ticketCapacity - ocupadas) : null;
  const cartel = urlCartel(e);
  const hora = e.startMinute !== null ? fmtHora(e.startMinute) : null;
  return (
    <>
      {e.kind === "INTERCLUB" && <span className="tag">Interclub</span>}
      <span className="tag">{DISCIPLINE_LABEL[e.discipline]}</span><span className={`tag ${e.level}`}>{LEVEL_LABEL[e.level]}</span>
      {e.status === "CANCELLED" && <span className="tag">velada cancelada</span>}
      {!e.organizerId && <span className="tag">No oficial</span>}
      <div className={cartel ? "velada-hero" : undefined}>
        {cartel && <figure className="velada-poster"><img src={cartel} alt={`Cartel de ${e.name}`} /></figure>}
        <div className="velada-hero-datos">
          <h1>{e.name}</h1>
          <dl className="datos-velada">
            <div><dt>Fecha</dt><dd>{fmtDate(e.date)}</dd></div>
            {hora && <div><dt>Hora</dt><dd>{hora}</dd></div>}
            <div><dt>Lugar</dt><dd>{e.venue}<br /><span className="mut">{e.city} ({e.province})</span></dd></div>
            {conEntradas && <div><dt>Entrada</dt><dd>{e.ticketPriceEuros} €{e.doorPriceEuros && e.doorPriceEuros !== e.ticketPriceEuros ? <span className="mut"> · en taquilla {e.doorPriceEuros} €</span> : null}</dd></div>}
          </dl>
          {conEntradas && !motivo && <p className="acciones" style={{ margin: 0 }}><a className="btn" href="#entradas">{miReserva ? "Ver mi reserva" : "Reservar entradas"}</a></p>}
        </div>
      </div>
      <p>{asistentes} van a ir</p>
      {e.status === "SCHEDULED" && e.date >= calendarDayStart() && <section className="tarjeta" aria-label="Asistencia y calendario">
        {user ? <form action={setAttendance}><input type="hidden" name="eventId" value={e.id} /><input type="hidden" name="asistir" value={asistencia ? "0" : "1"} /><button>{asistencia ? "Ya no voy a ir" : "Voy a ir"}</button></form> : <Link className="btn secondary" href={`/entrar?next=${encodeURIComponent(`/veladas/${e.slug}`)}`}>Entra para marcar «Voy a ir»</Link>}
        <a className="btn secondary" href={`/veladas/${e.slug}/calendario`}>Añadir a mi calendario</a>
      </section>}
      {!e.organizerId && <p className="mut">Esta velada no la ha publicado un organizador: la indicó un peleador al registrar su combate. Los datos pueden estar incompletos.</p>}
      <p className="mut">
        {oficial && <> · Publicada por <strong>{org?.orgName}</strong> <span className="tag PRO" title="Organizador verificado por un moderador">✓ organizador verificado</span></>}
        {entrenador && <> · Organiza el entrenador <Link href={`/entrenadores/${entrenador.slug}`}>{entrenador.name}</Link></>}
        {e.promoter && <> · Promotor indicado por el organizador: {e.promoter}</>}
      </p>
      {conEntradas && (
        <section id="entradas" className="tarjeta entradas-velada" aria-labelledby="titulo-entradas">
          <div className="titulo-seccion"><h2 id="titulo-entradas">Entradas</h2>{libres !== null && !motivo && <span className="meta-acc">{libres === 0 ? "Agotadas" : libres === 1 ? "Queda 1" : `Quedan ${libres}`}</span>}</div>
          {e.ticketNote && <p style={{ margin: 0 }}>{e.ticketNote}</p>}
          {miReserva ? (
            <div className="mi-reserva">
              <p style={{ margin: 0 }}><span className={`tag estado-${miReserva.status}`}>{ESTADO_ENTRADA[miReserva.status]}</span> {miReserva.quantity === 1 ? "1 entrada" : `${miReserva.quantity} entradas`} · código <strong className="codigo">{miReserva.code}</strong></p>
              {miReserva.status === "PENDING_DEPOSIT" && <p style={{ margin: 0 }}>Envía <strong>{miReserva.depositEuros} €</strong> por Bizum al <strong>{fmtBizum(e.bizumPhone!)}</strong> con el concepto <strong>{miReserva.code}</strong> antes del {miReserva.depositUntil.toLocaleString("es-ES", { timeZone: "Europe/Madrid", dateStyle: "long", timeStyle: "short" })}.</p>}
              <Link className="btn secondary" href="/mis-entradas" style={{ alignSelf: "flex-start" }}>Ver en «Mis entradas»</Link>
            </div>
          ) : motivo === "entradas_cerradas" ? (
            <p className="mut" style={{ margin: 0 }}>Las reservas en Lona se cerraron 3 horas antes del inicio. Pregunta a la promotora por la taquilla.</p>
          ) : user?.id === e.organizerId ? (
            <p style={{ margin: 0 }}>Es tu velada. <Link href={`/organizador/${e.slug}/entradas`}>Ver las reservas</Link></p>
          ) : libres === 0 ? (
            <p className="mut" style={{ margin: 0 }}>No quedan entradas en Lona.{e.doorPriceEuros ? ` Puede que haya en taquilla (${e.doorPriceEuros} €).` : ""}</p>
          ) : !user ? (
            <>
              <p style={{ margin: 0 }}>Reserva aquí y paga la mitad por Bizum a la promotora para confirmarla; el resto, en la puerta.</p>
              <Link className="btn" href={`/entrar?next=${encodeURIComponent(`/veladas/${e.slug}#entradas`)}`} style={{ alignSelf: "flex-start" }}>Entra para reservar</Link>
            </>
          ) : (
            <ReservaEntradas eventId={e.id} precio={e.ticketPriceEuros!} maximo={Math.min(MAX_ENTRADAS, libres ?? MAX_ENTRADAS)} accion={reservarEntradas} />
          )}
          <p className="meta" style={{ margin: 0 }}>Lona no cobra ni guarda dinero: la señal va directa a la promotora. Reservas hasta el {cierreDeReservas(e.date, e.startMinute).toLocaleString("es-ES", { timeZone: "Europe/Madrid", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}.</p>
        </section>
      )}
      {e.ticketUrl && <p className="acciones"><a className="btn" href={e.ticketUrl} target="_blank" rel="noopener noreferrer nofollow">Comprar entradas<span aria-hidden="true"> ↗</span><span className="sr-only"> (se abre en otra página web)</span></a></p>}
      {/* Inscripción de peleadores (propuesta n.º 3 del diseño v3): visible mientras el organizador la tenga abierta. */}
      {/* Cerrada en un evento futuro de un organizador: se dice, para que el peleador no busque un botón que no está (9 de octubre de 2026). */}
      {!inscripcionAbierta(e, todayMadrid()) && e.organizerId && e.status === "SCHEDULED" && e.date.toISOString().slice(0, 10) >= todayMadrid() && (
        <section className="tarjeta" aria-labelledby="titulo-inscripcion" style={{ gap: 8, margin: "12px 0" }}>
          <h2 id="titulo-inscripcion" style={{ margin: 0, font: "800 20px var(--font)" }}>Inscripción de peleadores: cerrada</h2>
          {user?.id === e.organizerId
            ? <><p style={{ margin: 0 }}>Ábrela para que los peleadores de {DISCIPLINE_LABEL[e.discipline]} puedan pedir participar.</p><Link className="btn" href={`/organizador/${e.slug}#inscripcion`}>Abrir la inscripción</Link></>
            : <p className="mut" style={{ margin: 0 }}>El organizador no está buscando peleadores para este evento ahora mismo. Si abre la inscripción, aquí aparecerá el botón «Solicitar participar». <Link href="/veladas?inscripcion=abierta">Ver eventos con inscripción abierta</Link></p>}
        </section>
      )}
      {inscripcionAbierta(e, todayMadrid()) && (
        <section className="tarjeta" aria-labelledby="titulo-inscripcion" style={{ borderColor: "var(--acc)", gap: 10, margin: "12px 0" }}>
          <h2 id="titulo-inscripcion" style={{ margin: 0, font: "800 20px var(--font)" }}>Inscripción abierta</h2>
          <p style={{ margin: 0 }}>Los peleadores de {DISCIPLINE_LABEL[e.discipline]} pueden pedir participar. El organizador elige a quién empareja en el cartel.{e.registrationUntil ? ` Hasta el ${fmtDate(e.registrationUntil)}.` : ""}</p>
          {e.registrationNote && <p className="mut" style={{ margin: 0 }}><strong>Requisitos:</strong> {e.registrationNote}</p>}
          {plazas.length > 0 && (
            <div>
              <strong>Categorías que busca el organizador</strong>
              <ul style={{ margin: "6px 0 0", paddingLeft: 20 }}>
                {plazas.map((pl) => { const o = ocupPlazas.get(claveCategoria(pl.divisionId, pl.weightClass)); return <li key={pl.id}>{categoryLabel(e.discipline, e.level, pl.divisionId || null, pl.weightClass)}: {o?.llena ? "completa (lista de espera)" : o?.libres === 1 ? "queda 1 plaza" : `quedan ${o?.libres ?? pl.places} plazas`}</li>; })}
              </ul>
            </div>
          )}
          {miInscripcion
            ? <p style={{ margin: 0 }}>Tu solicitud: <strong>{REG_STATUS_LABEL[miInscripcion.status]}</strong>. <Link href={`/veladas/${e.slug}/inscribirme`}>Ver mi solicitud</Link></p>
            : <Link className="btn" href={`/veladas/${e.slug}/inscribirme`}>Solicitar participar</Link>}
        </section>
      )}
      <h2>Cartel</h2>
      <div className="table-wrap" tabIndex={0} role="region" aria-label={`Cartel de ${e.name}`}>
      <table className="apilada">
        <caption className="mut" style={{ textAlign: "left" }}>Combates de la velada. La esquina roja aparece primero.</caption>
        <thead><tr><th scope="col">Esquina roja</th><th scope="col"><span className="sr-only">contra</span></th><th scope="col">Esquina azul</th><th scope="col">Categoría</th><th scope="col">Resultado</th><th scope="col">Respaldo</th></tr></thead>
        <tbody>
          {e.bouts.map((b) => {
            const enRevision = b.verification === "DISPUTED"; // un combate rechazado no se muestra como un hecho
            const recordAmateurOculto = !!b.result && e.level === "AMATEUR" && (
              recordHidden(e.level, b.fighterA.recordPublic, false) ||
              recordHidden(e.level, b.fighterB.recordPublic, false)
            );
            // El resultado amateur no revela un récord que alguno de los peleadores mantiene privado.
            const oculto = enRevision || recordAmateurOculto;
            const ganador = oculto ? null : b.result === "A_WIN" ? publicFighterName(b.fighterA) : b.result === "B_WIN" ? publicFighterName(b.fighterB) : null;
            return (
              <tr key={b.id}>
                <td data-label="Esquina roja" className={!oculto && b.result === "A_WIN" ? "W" : ""}><Link href={`/peleadores/${b.fighterA.slug}`}>{publicFighterName(b.fighterA)}</Link></td>
                <td className="mut solo-ancho">contra</td>
                <td data-label="Esquina azul" className={!oculto && b.result === "B_WIN" ? "W" : ""}><Link href={`/peleadores/${b.fighterB.slug}`}>{publicFighterName(b.fighterB)}</Link></td>
                <td data-label="Categoría">{[categoryLabel(e.discipline, e.level, b.divisionId, b.weightClass), b.rounds ? `${b.rounds} asaltos` : null].filter(Boolean).join(" · ")}</td>
                <td data-label="Resultado">
                  {enRevision ? <span className="mut">Resultado en revisión</span>
                    : recordAmateurOculto ? <span className="mut">Resultado oculto por privacidad del récord amateur</span>
                    : !b.result ? <span className="mut">{eventDayReached(e.date) ? "Resultado por anotar" : "Próximo combate"}</span>
                    : b.result === "DRAW" ? "Empate"
                    : b.result === "NO_CONTEST" ? "Sin decisión"
                    : <>Gana {ganador}{b.method ? ` (${METHOD_LABEL[b.method]}${b.endRound ? `, asalto ${b.endRound}` : ""})` : ""}</>}
                </td>
                <td data-label="Respaldo">{b.result || oculto ? <VerificationTag bout={{ result: b.result, event: { date: e.date } }} verification={b.verification} backing={b} now={ahora} recordCreatedAt={b.createdAt} /> : <span className="mut">—</span>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
      {e.bouts.length === 0 && <p className="mut">Cartel por anunciar.</p>}

      <section id="multimedia" aria-labelledby="titulo-multimedia" style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24, scrollMarginTop: 80 }}>
        <h2 id="titulo-multimedia" style={{ margin: 0 }}>Vídeos y fotos del público</h2>
        <p className="mut" style={{ margin: 0 }}>Lo que graba el público en la velada, para que los peleadores tengan las imágenes de sus combates.</p>
        {compartir === "ok" ? <p className="acciones" style={{ margin: 0 }}><Link className="btn" href={user ? `/compartir?velada=${e.slug}` : `/entrar?next=${encodeURIComponent(`/compartir?velada=${e.slug}`)}`}>Subir vídeos o fotos de esta velada</Link></p>
          : compartir === "futura" ? <p className="mut" style={{ margin: 0 }}>El día de la velada podrás compartir aquí lo que grabes.</p> : null}
        {medios.length ? <GaleriaMedios medios={medios} back={`/veladas/${e.slug}#multimedia`} avisar={user?.emailVerifiedAt ? createReport : undefined} bloquear={bloquearUsuario} yo={user?.id} /> : <p className="mut" style={{ margin: 0 }}>Todavía nadie ha compartido vídeos ni fotos de esta velada.</p>}
      </section>
    </>
  );
}
