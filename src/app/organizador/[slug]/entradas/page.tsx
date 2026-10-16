import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getUser } from "../../../../lib/accounts/auth";
import { loginPath } from "../../../../lib/common/paths";
import { db } from "../../../../lib/common/db";
import { flatParams } from "../../../../lib/common/safe";
import { fmtDate } from "../../../../lib/common/labels";
import { ESTADO_ENTRADA, FILTROS_RESERVAS, fmtHora, parseFiltroReservas, plazasOcupadas, reservasDeVelada } from "../../../../lib/events/entradas";
import { gestionarReserva } from "../../../actions/entradas";
import { BotonesFiltro, CampoFiltro } from "../../../components/Filtros";

export const metadata: Metadata = { title: "Reservas de entradas", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const fechaHora = (d: Date) => d.toLocaleString("es-ES", { timeZone: "Europe/Madrid", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/**
 * Reservas de entradas de una velada, para su promotora (fase 1, 15-10-2026). Sirve antes (confirmar las señales que llegan por Bizum,
 * buscando por el código del concepto) y en la puerta (buscar el código, ver lo que falta por cobrar y validar). Todo se puede deshacer
 * o cancelar, y la lista se descarga en CSV con los mismos filtros.
 */
export default async function ReservasDeEntradas({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [{ slug }, user, sp] = await Promise.all([params, getUser(), searchParams]);
  const ruta = `/organizador/${slug}/entradas`;
  if (!user) redirect(loginPath(ruta));
  const event = await db.event.findUnique({ where: { slug } });
  if (!event) notFound();
  if (event.organizerId !== user.id && user.role !== "ADMIN") redirect("/organizador?problema=sin_permiso");
  const { estado: estadoCrudo, q } = flatParams(sp);
  const filtro = parseFiltroReservas(estadoCrudo);
  const [reservas, ocupadas, resumen] = await Promise.all([
    reservasDeVelada(event.id, filtro, q),
    plazasOcupadas(db, event.id),
    db.ticketReservation.groupBy({ by: ["status"], where: { eventId: event.id }, _sum: { quantity: true, depositEuros: true, totalEuros: true } }),
  ]);
  const suma = (s: string, k: "quantity" | "depositEuros" | "totalEuros") => resumen.find((x) => x.status === s)?._sum[k] ?? 0;
  const senalesRecibidas = suma("CONFIRMED", "depositEuros") + suma("CHECKED_IN", "depositEuros");
  const porCobrarPuerta = suma("CONFIRMED", "totalEuros") - suma("CONFIRMED", "depositEuros");
  const consulta = new URLSearchParams({ ...(filtro !== "activas" && { estado: filtro }), ...(q && { q }) }).toString();
  return (
    <div className="pantalla" style={{ gap: 16 }}>
      <div>
        <p style={{ margin: "0 0 8px" }}><Link href={`/organizador/${event.slug}#entradas`}>← Volver a la velada</Link></p>
        <h1 style={{ margin: 0 }}>Reservas de entradas</h1>
        <p className="lead" style={{ fontSize: 16 }}>{event.name} · {fmtDate(event.date)}{event.startMinute !== null ? ` · ${fmtHora(event.startMinute)}` : ""}</p>
      </div>
      <dl className="datos-velada">
        <div><dt>Reservadas</dt><dd>{ocupadas}{event.ticketCapacity !== null ? ` de ${event.ticketCapacity}` : ""}</dd></div>
        <div><dt>Validadas en la puerta</dt><dd>{suma("CHECKED_IN", "quantity")}</dd></div>
        <div><dt>Señales recibidas</dt><dd>{senalesRecibidas} €</dd></div>
        <div><dt>Por cobrar en la puerta</dt><dd>{porCobrarPuerta} €</dd></div>
      </dl>
      <form className="search" role="search" aria-label="Buscar reservas">
        <CampoFiltro etiqueta="Código, nombre o correo"><input name="q" defaultValue={q} maxLength={80} autoComplete="off" autoCapitalize="characters" placeholder="LONA-…" /></CampoFiltro>
        <CampoFiltro etiqueta="Estado"><select name="estado" defaultValue={filtro}>{Object.entries(FILTROS_RESERVAS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></CampoFiltro>
        <BotonesFiltro ruta={ruta} hayFiltros={!!(q || filtro !== "activas")} />
      </form>
      <p className="meta" style={{ margin: 0 }}>Cuando te llegue un Bizum, busca el código del concepto y pulsa «Señal recibida». En la puerta, busca el código, cobra el resto y pulsa «Validar». <a href={`${ruta}/csv${consulta ? `?${consulta}` : ""}`}>Descargar esta lista (CSV)</a></p>
      {reservas.length === 0 && <p className="mut">{q || filtro !== "activas" ? "No hay reservas con esos filtros." : "No hay reservas por atender."}</p>}
      {reservas.map((r) => {
        const resto = r.totalEuros - r.depositEuros;
        const boton = (paso: string, texto: string, clase?: string) => (
          <form action={gestionarReserva}>
            <input type="hidden" name="reservaId" value={r.id} />
            <input type="hidden" name="paso" value={paso} />
            {filtro !== "activas" && <input type="hidden" name="filtro" value={filtro} />}
            <button className={clase} aria-label={`${texto}: ${r.code}`}>{texto}</button>
          </form>
        );
        return (
          <section key={r.id} className="tarjeta" aria-label={`Reserva ${r.code}: ${ESTADO_ENTRADA[r.status]}`} style={{ gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
              <strong className="codigo" style={{ fontSize: 22 }}>{r.code}</strong>
              <span className={`tag estado-${r.status}`}>{ESTADO_ENTRADA[r.status]}</span>
            </div>
            <div>{r.user.name} · <a href={`mailto:${r.user.email}`}>{r.user.email}</a></div>
            <div className="meta">{r.quantity === 1 ? "1 entrada" : `${r.quantity} entradas`} · total {r.totalEuros} € · señal {r.depositEuros} € · en la puerta {resto} € · reservada el {fechaHora(r.createdAt)}{r.status === "PENDING_DEPOSIT" ? ` · señal hasta el ${fechaHora(r.depositUntil)}` : ""}{r.cancelledBy ? ` · cancelada por ${r.cancelledBy === "comprador" ? "quien reservó" : "ti"}` : ""}</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {(r.status === "PENDING_DEPOSIT" || r.status === "EXPIRED") && boton("senal", r.status === "EXPIRED" ? "Señal recibida (tarde)" : "Señal recibida")}
              {r.status === "CONFIRMED" && boton("puerta", `Validar en la puerta (cobrar ${resto} €)`)}
              {r.status === "CHECKED_IN" && boton("deshacer", "Deshacer la validación", "secondary")}
              {(r.status === "PENDING_DEPOSIT" || r.status === "CONFIRMED") && (
                <details>
                  <summary style={{ minHeight: 44, display: "flex", alignItems: "center" }}>Cancelar la reserva</summary>
                  <p className="meta" style={{ margin: "6px 0" }}>Se avisa a quien reservó y no se puede deshacer.{r.status === "CONFIRMED" ? " Si ya te envió la señal, devuélvesela." : ""}</p>
                  {boton("cancelar", "Sí, cancelarla", "secondary")}
                </details>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
