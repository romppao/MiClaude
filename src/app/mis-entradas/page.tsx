import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "../../lib/accounts/auth";
import { db } from "../../lib/common/db";
import { calendarDayStart } from "../../lib/common/dates";
import { fmtDate } from "../../lib/common/labels";
import { ESTADO_ENTRADA, fmtBizum, fmtHora, urlCartel } from "../../lib/events/entradas";
import { cancelarMiReserva } from "../actions/entradas";

export const metadata: Metadata = { title: "Mis entradas", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const fechaHora = (d: Date) => d.toLocaleString("es-ES", { timeZone: "Europe/Madrid", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

/**
 * Las entradas que ha reservado la persona (fase 1 de entradas, 15-10-2026). Arriba, las de las veladas que vienen, con el código grande
 * para la puerta y, si falta la señal, el Bizum, el importe y el plazo. Debajo, el historial.
 */
export default async function MisEntradas() {
  const user = await requireUser("/mis-entradas");
  const ahora = new Date();
  const reservas = await db.ticketReservation.findMany({
    where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 60,
    include: { event: { select: { slug: true, name: true, date: true, startMinute: true, venue: true, city: true, bizumPhone: true, status: true, posterAt: true } } },
  });
  // Una pendiente con el plazo vencido ya está caducada, aunque nadie la haya marcado todavía.
  const estado = (r: (typeof reservas)[number]) => (r.status === "PENDING_DEPOSIT" && r.depositUntil < ahora ? "EXPIRED" : r.status);
  const hoy = calendarDayStart();
  const proximas = reservas.filter((r) => r.event.date >= hoy && ["PENDING_DEPOSIT", "CONFIRMED", "CHECKED_IN"].includes(estado(r)));
  const resto = reservas.filter((r) => !proximas.includes(r));
  return (
    <div className="pantalla" style={{ gap: 14 }}>
      <div><h1>Mis entradas</h1><p className="lead" style={{ fontSize: 16 }}>Tus reservas para las veladas. En la puerta, di tu código o enséñalo desde aquí.</p></div>
      {reservas.length === 0 && (
        <div className="tarjeta"><p style={{ margin: 0 }}>Todavía no has reservado entradas. Las veladas con entradas en Lona llevan el botón «Reservar entradas».</p><Link className="btn" href="/veladas" style={{ alignSelf: "flex-start" }}>Ver veladas</Link></div>
      )}
      {proximas.map((r) => {
        const s = estado(r), cartel = urlCartel(r.event);
        return (
          <section key={r.id} className="tarjeta entrada" aria-label={`${r.event.name}: ${ESTADO_ENTRADA[s]}`}>
            <div className="entrada-cabecera">
              {cartel && <img className="entrada-mini" src={cartel} alt="" loading="lazy" />}
              <div style={{ minWidth: 0 }}>
                <span className={`tag estado-${s}`}>{ESTADO_ENTRADA[s]}</span>
                <h2 style={{ margin: "6px 0 2px", font: "800 20px/1.15 var(--font)", letterSpacing: "-.02em" }}><Link href={`/veladas/${r.event.slug}`}>{r.event.name}</Link></h2>
                <div className="meta">{fmtDate(r.event.date)}{r.event.startMinute !== null ? ` · ${fmtHora(r.event.startMinute)}` : ""} · {r.event.venue}, {r.event.city}</div>
              </div>
            </div>
            <div className="entrada-codigo" aria-label={`Código de la reserva: ${r.code.split("").join(" ")}`}>
              <span className="kicker">Código para la puerta</span>
              <strong className="codigo" aria-hidden="true">{r.code}</strong>
              <span className="meta">{r.quantity === 1 ? "1 entrada" : `${r.quantity} entradas`} · {r.totalEuros} € en total</span>
            </div>
            {s === "PENDING_DEPOSIT" && (
              <div className="entrada-pasos">
                <p style={{ margin: 0 }}><strong>Falta la señal para confirmarla.</strong> Envía por Bizum:</p>
                <dl className="desglose">
                  <div className="desglose-senal"><dt>Importe</dt><dd>{r.depositEuros} €</dd></div>
                  <div><dt>Al número</dt><dd style={{ fontSize: 20 }}>{r.event.bizumPhone ? fmtBizum(r.event.bizumPhone) : "—"}</dd></div>
                  <div><dt>Concepto</dt><dd className="codigo" style={{ fontSize: 18 }}>{r.code}</dd></div>
                </dl>
                <p className="meta" style={{ margin: 0 }}>Antes del {fechaHora(r.depositUntil)}. Si no llega a tiempo, la reserva caduca y se liberan las plazas. En la puerta pagarás el resto: {r.totalEuros - r.depositEuros} €.</p>
              </div>
            )}
            {s === "CONFIRMED" && <p style={{ margin: 0 }}>La promotora recibió tu señal ({r.depositEuros} €). En la puerta paga el resto: <strong>{r.totalEuros - r.depositEuros} €</strong>.</p>}
            {s === "CHECKED_IN" && <p style={{ margin: 0 }}>Entrada validada en la puerta. ¡Que disfrutes la velada!</p>}
            {r.event.status === "CANCELLED" && <p className="notice notice-bad" role="note" style={{ margin: 0 }}>La velada se ha cancelado. Pide a la promotora la devolución de la señal.</p>}
            {(s === "PENDING_DEPOSIT" || s === "CONFIRMED") && (
              <form action={cancelarMiReserva} style={{ paddingTop: 10, borderTop: "1px solid var(--line)" }}>
                <input type="hidden" name="reservaId" value={r.id} />
                <button className="secondary" aria-label={`Cancelar la reserva para ${r.event.name}`}>Cancelar la reserva</button>
                {s === "CONFIRMED" && <p className="meta" style={{ margin: "8px 0 0" }}>Si ya enviaste la señal, la devolución la decide la promotora.</p>}
              </form>
            )}
          </section>
        );
      })}
      {resto.length > 0 && (
        <section aria-labelledby="titulo-historial" style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
          <h2 id="titulo-historial" style={{ margin: 0 }}>Historial</h2>
          {resto.map((r) => {
            const s = estado(r);
            return (
              <div key={r.id} className="fila" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
                <div style={{ minWidth: 0 }}><Link href={`/veladas/${r.event.slug}`}><strong>{r.event.name}</strong></Link><div className="meta">{fmtDate(r.event.date)} · {r.quantity === 1 ? "1 entrada" : `${r.quantity} entradas`} · <span className="codigo">{r.code}</span></div></div>
                <span className={`tag estado-${s}`}>{ESTADO_ENTRADA[s]}</span>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
