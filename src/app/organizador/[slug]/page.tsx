import PreparacionVelada from "../../_inicio/PreparacionVelada";
import { preparationAudience } from "../../../lib/events/preparation-data";
import { availableFighters, isAvailable } from "../../../lib/fighters/availability";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getUser } from "../../../lib/accounts/auth";
import { loginPath } from "../../../lib/common/paths";
import { eventDayReached } from "../../../lib/common/dates";
import { db } from "../../../lib/common/db";
import { buscarParaCartel, SUGERENCIAS_CARTEL } from "../../../lib/events/cartel-search";
import { METHOD_LABEL, fmtDate } from "../../../lib/common/labels";
import SelectorCategoria from "../../components/SelectorCategoria";
import { divisionLabel } from "../../../lib/common/competition";
import { DISCIPLINE_LABEL, DISCIPLINE_ORDER, METHODS_BY_DISCIPLINE, weightClassLabel, categoryLabel } from "../../../lib/common/disciplines";
import { LIMITS } from "../../../lib/common/text";
import { publicFighterName } from "../../../lib/common/names";
import { setBoutEvidence } from "../../actions/bouts";
import { addCartelBout, removeCartelBout, setBoutResult, setEventStatus, updateEvent } from "../../actions/events";
import { EVENT_KIND_LABEL, PROVINCES } from "../../../lib/common/labels";
import { removeSlot, setRegistration, setSlot } from "../../actions/registrations";
import { PLAZAS_MAX, REG_NOTE_MAX, claveCategoria, inscripcionAbierta, ocupacion } from "../../../lib/events/registrations";
import { todayMadrid } from "../../../lib/common/dates";
import { HORAS_CIERRE_ANTES, MAX_ENTRADAS, fmtBizum, fmtHora, plazasOcupadas, urlCartel } from "../../../lib/events/entradas";
import { guardarCartelYEntradas } from "../../actions/entradas";
import InputFoto from "../../components/InputFoto";

export const metadata = { title: "Gestionar velada", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const MAX_LISTA = SUGERENCIAS_CARTEL;

export default async function ManageEvent({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ roja?: string; azul?: string; disponibles?: string }> }) {
  const [{ slug }, user] = await Promise.all([params, getUser()]);
  if (!user) redirect(loginPath(`/organizador/${slug}`));
  const event = await db.event.findUnique({ where: { slug }, include: { bouts: { orderBy: { order: "asc" }, include: { fighterA: true, fighterB: true } } } });
  if (!event) notFound();
  if (event.organizerId !== user.id && user.role !== "ADMIN") redirect("/organizador?problema=sin_permiso");
  const paramsBusqueda = await searchParams;
  const roja = (typeof paramsBusqueda.roja === "string" ? paramsBusqueda.roja : "").slice(0, 80);
  const azul = (typeof paramsBusqueda.azul === "string" ? paramsBusqueda.azul : "").slice(0, 80);
  const disponibles = paramsBusqueda.disponibles === "1";
  const audiencia = await preparationAudience(event.id);
  const [fighters, fightersAzul] = await Promise.all([buscarParaCartel(event.discipline, roja, disponibles), buscarParaCartel(event.discipline, azul, disponibles)]);
  const past = eventDayReached(event.date);
  // Inscripción: cuántas solicitudes esperan respuesta y quiénes están aceptados (salen primero al formar el cartel).
  const [porEstado, aceptados, plazas, filasCategoria] = await Promise.all([
    db.eventRegistration.groupBy({ by: ["status"], where: { eventId: event.id }, _count: { _all: true } }),
    db.eventRegistration.findMany({ where: { eventId: event.id, status: "ACCEPTED" }, select: { fighterId: true } }),
    db.eventSlot.findMany({ where: { eventId: event.id }, orderBy: [{ divisionId: "asc" }, { weightClass: "asc" }] }),
    db.eventRegistration.findMany({ where: { eventId: event.id }, select: { status: true, divisionId: true, weightClass: true } }),
  ]);
  const ocup = ocupacion(plazas, filasCategoria);
  // Cartel y entradas (fase 1, 15-10-2026): resumen de reservas para el enlace a la lista.
  const [reservasPorEstado, ocupadas] = await Promise.all([
    db.ticketReservation.groupBy({ by: ["status"], where: { eventId: event.id }, _count: { _all: true }, _sum: { quantity: true } }),
    plazasOcupadas(db, event.id),
  ]);
  const nReservas = reservasPorEstado.reduce((n, x) => n + x._count._all, 0);
  const pendientesSenal = reservasPorEstado.find((x) => x.status === "PENDING_DEPOSIT")?._count._all ?? 0;
  const cartel = urlCartel(event);
  const nEstado = (s: string) => porEstado.find((x) => x.status === s)?._count._all ?? 0;
  const idsAceptados = new Set(aceptados.map((a) => a.fighterId));
  const hoy = todayMadrid();
  const abierta = inscripcionAbierta(event, hoy);
  const diaEvento = event.date.toISOString().slice(0, 10);
  // Los aceptados en la inscripción siempre se pueden elegir, coincidan o no con la búsqueda, y salen primero.
  const fichasAceptadas = idsAceptados.size ? await db.fighter.findMany({ where: { id: { in: [...idsAceptados] }, hiddenAt: null, ...(disponibles ? availableFighters() : {}) }, include: { gym: true }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }, { id: "asc" }] }) : [];
  const opciones = (lista: typeof fighters, busqueda: string) => {
    const op = (b: (typeof fighters)[number]) => <option key={b.id} value={b.id}>{etiqueta(b)}</option>;
    const resto = lista.slice(0, MAX_LISTA).filter((b) => !idsAceptados.has(b.id));
    const titulo = busqueda ? "Resultados de la búsqueda" : "Peleadores de la disciplina";
    return fichasAceptadas.length ? <><optgroup label="Aceptados en la inscripción">{fichasAceptadas.map(op)}</optgroup>{resto.length > 0 && <optgroup label={titulo}>{resto.map(op)}</optgroup>}</> : resto.map(op);
  };
  const resumen = (lista: typeof fighters, busqueda: string, esquina: string) =>
    lista.length > MAX_LISTA ? (busqueda ? `Esquina ${esquina}: hay más de ${MAX_LISTA} coincidencias; concreta la búsqueda.` : `Esquina ${esquina}: se muestran los primeros ${MAX_LISTA} de la disciplina; busca para encontrar al resto.`)
      : `Esquina ${esquina}: ${lista.length} ${busqueda ? "coincidencias" : "peleadores de la disciplina"}.`;
  const nombre = (b: { firstName: string; lastName: string; listed?: boolean; hiddenAt?: Date | null }) => publicFighterName(b); // como lo ve el público: una ficha provisional solo enseña la inicial del apellido
  // En la lista se distinguen los homónimos con el alias, la ciudad y el gimnasio.
  const etiqueta = (b: (typeof fighters)[number]) => [nombre(b), b.alias && `«${b.alias}»`, isAvailable(b) && `Disponible${b.currentWeightKg !== null ? ` · ${b.currentWeightKg} kg` : ""}`, [b.city, b.gym?.name].filter(Boolean).join(" · ")].filter(Boolean).join(" — ");
  return (
    <>
      <h1>{event.name}</h1>
      {event.status === "PENDING_AUTHORIZATION" && <p className="notice notice-info" role="status">Pendiente de autorización. La velada no es pública y sus combates todavía no cuentan.</p>}
      {event.status === "REJECTED" && <p className="notice notice-bad" role="status">La publicación fue rechazada. Corrige la fecha o los datos para solicitar una nueva revisión.</p>}
      <p className="mut"><span className="tag">{DISCIPLINE_LABEL[event.discipline]}</span> {fmtDate(event.date)} · {event.venue}, {event.city} · <Link href={`/veladas/${event.slug}`}>Ver la página pública</Link></p>
      {event.status === "CANCELLED" && <p className="notice notice-bad" role="note">Esta velada está cancelada. Sigue visible con esa etiqueta y sus combates no cuentan. Puedes volver a activarla abajo.</p>}
      <p><Link href="/organizador">← Volver a mis veladas</Link></p>

      <PreparacionVelada event={event} asistentes={audiencia.asistentes} seguidores={audiencia.seguidores} />
      <h2 id="datos">Datos de la velada</h2>
      <details>
        <summary>Corregir los datos de la velada — nombre, fecha, lugar, promotor y entradas</summary>
        <form className="search" action={updateEvent} style={{ marginTop: 8 }}>
          <input type="hidden" name="eventId" value={event.id} />
          <label className="field"><span>Nombre de la velada</span><input name="name" defaultValue={event.name} required maxLength={LIMITS.eventName} /></label>
          <label className="field"><span>Tipo</span><select name="kind" defaultValue={event.kind}>{(["VELADA", "INTERCLUB"] as const).map((k) => <option key={k} value={k}>{EVENT_KIND_LABEL[k]}</option>)}</select></label>
          <label className="field"><span>Fecha</span><input name="date" type="date" defaultValue={event.date.toISOString().slice(0, 10)} required min="1980-01-01" /></label>
          <label className="field"><span>Hora de inicio (opcional)</span><input name="hora" type="time" defaultValue={event.startMinute !== null ? fmtHora(event.startMinute) : ""} /><span className="hint">Sale en el calendario. Las reservas de entradas se cierran {HORAS_CIERRE_ANTES} horas antes; sin hora se cuenta desde las 20:00.</span></label>
          <label className="field"><span>Disciplina</span>
            <select name="discipline" defaultValue={event.discipline}>{DISCIPLINE_ORDER.map(d => <option key={d} value={d}>{DISCIPLINE_LABEL[d]}</option>)}</select>
            <span className="hint">Solo se puede cambiar mientras el cartel está vacío.</span>
          </label>
          <label className="field"><span>Recinto</span><input name="venue" defaultValue={event.venue} maxLength={LIMITS.venue} /></label>
          <label className="field"><span>Ciudad</span><input name="city" defaultValue={event.city} maxLength={LIMITS.city} /></label>
          <label className="field"><span>Provincia</span><select name="province" defaultValue={event.province}>{PROVINCES.map((p) => <option key={p}>{p}</option>)}</select></label>
          <label className="field"><span>Promotor (opcional)</span><input name="promoter" defaultValue={event.promoter ?? ""} maxLength={LIMITS.promoter} /></label>
          <label className="field" style={{ flex: 1, minWidth: 240 }}><span>Enlace para comprar entradas (opcional)</span><input name="ticketUrl" defaultValue={event.ticketUrl ?? ""} maxLength={LIMITS.url} placeholder="https://…" /></label>
          <p className="hint">Cambiar el nombre o la fecha retira los respaldos específicos de sus resultados; deberán comprobarse de nuevo.</p><button>Guardar los datos de la velada</button>
        </form>
      </details>
      <details style={{ marginTop: 8 }}>
        <summary>{event.status === "CANCELLED" ? "Volver a activar la velada" : "Cancelar la velada"}</summary>
        <form action={setEventStatus} style={{ marginTop: 8 }}>
          <input type="hidden" name="eventId" value={event.id} />
          <p className="mut">{event.status === "CANCELLED" ? "La velada volverá a aparecer como activa y sus combates volverán a contar." : "La velada seguirá visible con la etiqueta «cancelada» y sus combates dejarán de contar. Podrás volver a activarla."}</p>
          <button name="decision" value={event.status === "CANCELLED" ? "reopen" : "cancel"} className={event.status === "CANCELLED" ? undefined : "secondary"}>{event.status === "CANCELLED" ? "Volver a activar la velada" : "Sí, cancelar la velada"}</button>
        </form>
      </details>

      {/* Cartel y entradas (fase 1, 15-10-2026). La promotora cobra la señal por Bizum; Lona solo lleva la cuenta (lib/events/entradas.ts). */}
      <section id="entradas" aria-labelledby="titulo-entradas" className="tarjeta" style={{ marginTop: 16, scrollMarginTop: 80 }}>
        <h2 id="titulo-entradas" style={{ margin: 0 }}>Cartel y entradas</h2>
        <p style={{ margin: 0 }}><span className={`pildora ${event.ticketsOpen ? "pildora-acc" : ""}`}>{event.ticketsOpen ? "Venta abierta en Lona" : "Venta cerrada"}</span> {event.ticketsOpen ? `${ocupadas}${event.ticketCapacity !== null ? ` de ${event.ticketCapacity}` : ""} entradas reservadas.` : "Pon precio y Bizum y abre la venta para que el público reserve desde la página de la velada."}</p>
        {nReservas > 0 && <Link className="btn" href={`/organizador/${event.slug}/entradas`} style={{ alignSelf: "flex-start" }}>Ver las reservas{pendientesSenal ? ` (${pendientesSenal} ${pendientesSenal === 1 ? "pendiente de señal" : "pendientes de señal"})` : ""}</Link>}
        <form action={guardarCartelYEntradas} encType="multipart/form-data" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input type="hidden" name="eventId" value={event.id} />
          <div className="cartel-editor">
            {cartel ? <img src={cartel} alt="Cartel actual" className="entrada-mini" style={{ width: 96, height: 144 }} /> : <span className="entrada-mini" aria-hidden="true" style={{ width: 96, height: 144, display: "grid", placeItems: "center", color: "var(--mut)", fontSize: 13, textAlign: "center", padding: 8 }}>Sin cartel</span>}
            <div className="field" style={{ flex: 1, minWidth: 220 }}>
              <label className="field"><span>{cartel ? "Cambiar el cartel" : "Cartel (opcional)"}</span><InputFoto name="cartel" /></label>
              <span className="hint">JPG, PNG o WebP de hasta 4 MB. Mejor vertical: es lo primero que ve el público en el calendario.</span>
              {cartel && <label style={{ display: "flex", gap: 10, alignItems: "center", minHeight: 44 }}><input type="checkbox" name="quitarCartel" value="1" style={{ width: 22, height: 22 }} /> Quitar el cartel</label>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <label className="field" style={{ flex: 1, minWidth: 140 }}><span>Precio de la entrada (€)</span><input name="precio" inputMode="numeric" pattern="[0-9]*" maxLength={5} defaultValue={event.ticketPriceEuros ?? ""} /></label>
            <label className="field" style={{ flex: 1, minWidth: 140 }}><span>Precio en taquilla (€, opcional)</span><input name="puerta" inputMode="numeric" pattern="[0-9]*" maxLength={5} defaultValue={event.doorPriceEuros ?? ""} /><span className="hint">Si es distinto, se avisa al público.</span></label>
            <label className="field" style={{ flex: 1, minWidth: 140 }}><span>Aforo en Lona (opcional)</span><input name="aforo" inputMode="numeric" pattern="[0-9]*" maxLength={6} defaultValue={event.ticketCapacity ?? ""} /><span className="hint">Sin aforo no hay límite.</span></label>
          </div>
          <label className="field"><span>Tu número de Bizum</span><input name="bizum" type="tel" autoComplete="tel" maxLength={20} defaultValue={event.bizumPhone ? fmtBizum(event.bizumPhone) : ""} placeholder="600 000 000" /><span className="hint">Solo lo ve quien reserva, para enviarte la señal: la mitad del precio, con su código como concepto. El resto lo cobras en la puerta.</span></label>
          <label className="field"><span>Nota para el público (opcional)</span><textarea name="nota" rows={2} maxLength={300} defaultValue={event.ticketNote ?? ""} placeholder="Apertura de puertas, edad mínima, si hay entrada infantil…" /></label>
          <p className="meta" style={{ margin: 0 }}>{event.startMinute === null && <>Pon la hora de inicio en «Datos de la velada»: las reservas se cierran {HORAS_CIERRE_ANTES} horas antes. </>}Cada persona puede reservar de 1 a {MAX_ENTRADAS} entradas. Tiene 24 horas para enviar la señal; si no llega, la reserva caduca sola y libera las plazas.</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {event.ticketsOpen ? <>
              <button name="abrir" value="1">Guardar</button>
              <button name="abrir" value="0" className="secondary">Cerrar la venta</button>
            </> : <>
              <button name="abrir" value="1">Guardar y abrir la venta</button>
              <button name="abrir" value="0" className="secondary">Guardar sin abrir</button>
            </>}
          </div>
        </form>
      </section>

      <section id="inscripcion" aria-labelledby="titulo-inscripcion" className="tarjeta" style={{ marginTop: 16, scrollMarginTop: 80 }}>
        <h2 id="titulo-inscripcion" style={{ margin: 0 }}>Inscripción de peleadores</h2>
        <p style={{ margin: 0 }}><span className={`pildora ${abierta ? "pildora-acc" : ""}`}>{abierta ? "Abierta" : "Cerrada"}</span> {abierta ? "Los peleadores de la disciplina pueden pedir participar desde la página pública." : "Ábrela para que los peleadores pidan participar desde la página pública. Tú eliges a quién aceptas."}</p>
        {(nEstado("PENDING") + nEstado("ACCEPTED") + nEstado("DECLINED") + nEstado("WITHDRAWN")) > 0 && (
          <Link className="btn" href={`/organizador/${event.slug}/inscripciones`} style={{ alignSelf: "flex-start" }}>
            Gestionar las solicitudes{nEstado("PENDING") ? ` (${nEstado("PENDING")} ${nEstado("PENDING") === 1 ? "pendiente" : "pendientes"})` : ""}
          </Link>
        )}
        {nEstado("ACCEPTED") > 0 && <>
          <p className="meta" style={{ margin: 0 }}>{nEstado("ACCEPTED") === 1 ? "1 peleador aceptado" : `${nEstado("ACCEPTED")} peleadores aceptados`}: salen primero en las listas de «Añadir un combate al cartel».</p>
          <Link className="btn secondary" href={`/organizador/${event.slug}/emparejar`} style={{ alignSelf: "flex-start" }}>Ayuda para emparejar a los aceptados</Link>
        </>}
        {event.status === "SCHEDULED" && diaEvento >= hoy ? (
          <form action={setRegistration} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input type="hidden" name="eventId" value={event.id} />
            <label className="field"><span>Requisitos para participar (opcional)</span><textarea name="note" rows={2} maxLength={REG_NOTE_MAX} defaultValue={event.registrationNote ?? ""} placeholder="Experiencia mínima, licencia federativa, pesaje, revisión médica…" /><span className="hint">Los ve el peleador antes de pedir participar.</span></label>
            <label className="field"><span>Fecha límite para pedir participar (opcional)</span><input name="until" type="date" min={hoy} max={diaEvento} defaultValue={event.registrationUntil?.toISOString().slice(0, 10) ?? ""} /><span className="hint">Si la dejas vacía, se puede pedir hasta el día del evento.</span></label>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {event.registrationOpen ? <>
                <button name="abrir" value="1">Guardar los requisitos</button>
                <button name="abrir" value="0" className="secondary">Cerrar la inscripción</button>
              </> : <button name="abrir" value="1">Abrir la inscripción</button>}
            </div>
          </form>
        ) : <p className="mut" style={{ margin: 0 }}>{event.status === "CANCELLED" ? "La velada está cancelada: no se puede abrir la inscripción." : "La fecha del evento ya ha pasado: no se puede abrir la inscripción."}</p>}
      </section>

      {/* Plazas por categoría (decisión del fundador, 9 de octubre de 2026). Opcionales: sin ellas, cualquier categoría vale. */}
      <section id="plazas" aria-labelledby="titulo-plazas" className="tarjeta" style={{ marginTop: 16, scrollMarginTop: 80 }}>
        <h2 id="titulo-plazas" style={{ margin: 0 }}>Plazas por categoría (opcional)</h2>
        <p className="mut" style={{ margin: 0 }}>{plazas.length ? "Los peleadores solo pueden pedir estas categorías. Cuando una se llena, las solicitudes nuevas quedan en lista de espera y no puedes aceptar más de las plazas que indicas." : "Si indicas las categorías de peso que buscas y cuántas plazas tiene cada una, los peleadores solo podrán pedir esas y verán cuántas plazas quedan. Si no indicas ninguna, se admite cualquier categoría."}</p>
        {plazas.length > 0 && (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            {plazas.map((pl) => {
              const o = ocup.get(claveCategoria(pl.divisionId, pl.weightClass));
              const nombreCat = categoryLabel(event.discipline, event.level, pl.divisionId || null, pl.weightClass);
              return (
                <li key={pl.id} style={{ display: "flex", flexDirection: "column", gap: 6, paddingTop: 10, borderTop: "1px solid var(--line)" }}>
                  <strong>{nombreCat}</strong>
                  <span className="meta">{o?.aceptadas ?? 0} de {pl.places} plazas cubiertas{o?.llena ? " · completa" : ""}{o?.pendientes ? ` · ${o.pendientes} ${o.llena ? "en lista de espera" : o.pendientes === 1 ? "pendiente" : "pendientes"}` : ""}</span>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
                    <form action={setSlot} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
                      <input type="hidden" name="eventId" value={event.id} /><input type="hidden" name="divisionId" value={pl.divisionId} /><input type="hidden" name="weightClass" value={pl.weightClass} />
                      <label className="field"><span>Plazas</span><input name="places" type="number" inputMode="numeric" min={1} max={PLAZAS_MAX} defaultValue={pl.places} required style={{ width: 96 }} aria-label={`Plazas en ${nombreCat}`} /></label>
                      <button className="secondary" aria-label={`Guardar las plazas de ${nombreCat}`}>Guardar las plazas</button>
                    </form>
                    <form action={removeSlot}>
                      <input type="hidden" name="eventId" value={event.id} /><input type="hidden" name="slotId" value={pl.id} />
                      <button className="secondary" aria-label={`Dejar de ofrecer ${nombreCat}`}>Quitar esta categoría</button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <form action={setSlot} className="search" aria-label="Ofrecer plazas en una categoría" style={{ paddingTop: 10, borderTop: "1px solid var(--line)" }}>
          <input type="hidden" name="eventId" value={event.id} />
          <SelectorCategoria modo="combate" fijas={{ discipline: event.discipline, level: event.level }} />
          <label className="field"><span>Número de plazas</span><input name="places" type="number" inputMode="numeric" min={1} max={PLAZAS_MAX} required style={{ width: 120 }} /><span className="hint">Peleadores que puedes aceptar en esta categoría.</span></label>
          <button>Ofrecer plazas en esta categoría</button>
        </form>
      </section>

      <h2 id="anadir-combate" style={{ scrollMarginTop: 80 }}>Añadir un combate al cartel</h2>
      <form method="get" action={`/organizador/${event.slug}#anadir-combate`} className="search" aria-label="Buscar peleadores para el cartel">
        <label className="field"><span>Buscar esquina roja</span><input name="roja" type="search" maxLength={80} defaultValue={roja} aria-describedby="ayuda-buscar-cartel" /></label>
        <label className="field"><span>Buscar esquina azul</span><input name="azul" type="search" maxLength={80} defaultValue={azul} aria-describedby="ayuda-buscar-cartel" /></label>
        <label className="chip"><input type="checkbox" name="disponibles" value="1" defaultChecked={disponibles} />Solo disponibles para pelear</label>
        <button>Buscar peleadores</button>
        <p id="ayuda-buscar-cartel" className="hint">Busca por nombre, alias, gimnasio o ciudad. Solo aparecen peleadores de la disciplina de esta velada. Elige una sugerencia para cada esquina.</p>
      </form>
      <p role="status">{resumen(fighters, roja, "roja")} {resumen(fightersAzul, azul, "azul")}{fichasAceptadas.length > 0 && " Los aceptados en la inscripción aparecen siempre primero."}</p>
      <form className="search" action={addCartelBout}>
        <input type="hidden" name="eventId" value={event.id} />
        <label className="field" style={{ flex: 1, minWidth: 240 }}><span>Esquina roja</span>
          <select name="fighterA" required defaultValue=""><option value="" disabled>Elige a un peleador…</option>{opciones(fighters, roja)}</select>
        </label>
        <label className="field" style={{ flex: 1, minWidth: 240 }}><span>Esquina azul</span>
          <select name="fighterB" required defaultValue=""><option value="" disabled>Elige a un peleador…</option>{opciones(fightersAzul, azul)}</select>
        </label>
        <SelectorCategoria modo="combate" fijas={{ discipline: event.discipline, level: event.level }} />
        <label className="field"><span>Número de asaltos (opcional)</span><input name="rounds" type="number" min={1} max={12} /></label>
        <label className="field" style={{ flex: 1, minWidth: 240 }}><span>Enlace del acta o del cartel (opcional)</span><input name="evidenceUrl" type="url" maxLength={LIMITS.url} placeholder="https://…" /></label>
        <button>Añadir al cartel</button>
      </form>

      <h2 id="cartel">Cartel</h2>
      {event.bouts.length === 0 ? <p className="mut">El cartel está vacío. Añade el primer combate con el formulario de arriba.</p> : (
        <div className="table-wrap">
          <table>
            <caption className="sr-only">Combates del cartel</caption>
            <thead><tr><th scope="col">Combate</th><th scope="col">Categoría</th><th scope="col">Enlace del acta o del cartel</th><th scope="col">Resultado</th><th scope="col">Quitar</th></tr></thead>
            <tbody>
              {event.bouts.map((b) => {
                const cual = `${nombre(b.fighterA)} contra ${nombre(b.fighterB)}`;
                return (
                  <tr key={b.id}>
                    <th scope="row" style={{ color: "var(--text)" }}>{nombre(b.fighterA)} <span className="mut">contra</span> {nombre(b.fighterB)}</th>
                    <td className="mut">{categoryLabel(event.discipline, event.level, b.divisionId, b.weightClass)}</td>
                    <td>
                      <form action={setBoutEvidence} style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <input type="hidden" name="boutId" value={b.id} /><input type="hidden" name="back" value={`/organizador/${event.slug}`} />
                        <input name="evidenceUrl" type="url" defaultValue={b.evidenceUrl ?? ""} maxLength={LIMITS.url} aria-label={`Enlace del acta o del cartel de ${cual}`} placeholder="https://…" />
                        <button className="secondary" aria-label={`Guardar el enlace de ${cual}`}>Guardar enlace</button>
                      </form>
                    </td>
                    <td>
                      {past ? (
                        <form action={setBoutResult} style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <p className="hint">Cambiar el resultado retira su bonificación de respaldo hasta que se compruebe de nuevo.</p>

                          <input type="hidden" name="boutId" value={b.id} />
                          <select name="outcome" aria-label={`Resultado de ${cual}`} defaultValue={b.result === "A_WIN" ? "WIN" : b.result === "B_WIN" ? "LOSS" : b.result === "DRAW" ? "DRAW" : b.result === "NO_CONTEST" ? "NC" : ""}>
                            <option value="">Elige el resultado…</option><option value="WIN">Gana {b.fighterA.firstName} (esquina roja)</option><option value="LOSS">Gana {b.fighterB.firstName} (esquina azul)</option><option value="DRAW">Empate</option><option value="NC">Sin decisión</option>
                          </select>
                          <select name="method" aria-label={`Cómo terminó ${cual}`} defaultValue={b.method ?? ""}><option value="">Cómo terminó…</option>{METHODS_BY_DISCIPLINE[event.discipline].filter((m) => m !== "DRAW" && m !== "NC").map((m) => <option key={m} value={m}>{METHOD_LABEL[m]}</option>)}</select>
                          <input name="endRound" type="number" min={1} max={12} aria-label={`Asalto en que terminó ${cual}`} placeholder="Asalto" defaultValue={b.endRound ?? ""} style={{ width: 96 }} />
                          <button aria-label={`${b.result ? "Actualizar" : "Guardar"} resultado de ${cual}`}>{b.result ? "Actualizar resultado" : "Guardar resultado"}</button>
                        </form>
                      ) : <span className="mut">Se podrá indicar cuando se celebre la velada.</span>}
                    </td>
                    <td>
                      <details>
                        <summary className="mut" aria-label={`Quitar del cartel: ${cual}`}>Quitar del cartel</summary>
                        <form action={removeCartelBout} style={{ marginTop: 6 }}>
                          <input type="hidden" name="boutId" value={b.id} />
                          <p className="mut">El combate desaparece del cartel y de la página pública. Si ya tiene aura del público no se podrá quitar.</p>
                          <button className="secondary" aria-label={`Sí, quitar del cartel: ${cual}`}>Sí, quitar del cartel</button>
                        </form>
                      </details>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
