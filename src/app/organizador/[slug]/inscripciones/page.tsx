import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getUser } from "../../../../lib/accounts/auth";
import { loginPath } from "../../../../lib/common/paths";
import { db } from "../../../../lib/common/db";
import { flatParams } from "../../../../lib/common/safe";
import { EVENT_KIND_LABEL, PROVINCES, fmtDate } from "../../../../lib/common/labels";
import { DISCIPLINE_LABEL, categoryLabel, weightClassesFor } from "../../../../lib/common/disciplines";
import { divisionsFor } from "../../../../lib/common/competition";
import { todayMadrid } from "../../../../lib/common/dates";
import { ESTADOS_LISTA, ORDENES, REG_REPLY_MAX, REG_STATUS_LABEL, claveCategoria, enListaDeEspera, ocupacion, filtrarYOrdenar, inscripcionAbierta, numeroDeFiltro, parseEstadoLista, parseOrden, type EstadoLista } from "../../../../lib/events/registrations";
import { solicitudesDeEvento } from "../../../../lib/events/registrations-data";
import { answerRegistrations } from "../../../actions/registrations";
import { BotonesFiltro, CampoFiltro, FiltrosActivos, MasFiltros } from "../../../components/Filtros";
import SeleccionLote from "../../../components/SeleccionLote";

export const metadata: Metadata = { title: "Solicitudes para participar", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const NOMBRE_ESTADO: Record<EstadoLista, string> = { pendientes: "Pendientes", aceptadas: "Aceptadas", rechazadas: "Rechazadas", retiradas: "Retiradas", todas: "Todas" };
const PILDORA = { PENDING: "pildora-violeta", ACCEPTED: "pildora-acc", DECLINED: "", WITHDRAWN: "" } as const;
const kilos = (n: number) => `${String(n).replace(".", ",")} kg`;

/**
 * Las solicitudes para participar en un evento, para el organizador (petición del fundador, 9 de octubre de 2026: «que puedan tener
 * facilidad para gestionar todas esas solicitudes, pudiendo filtrar las listas con x parámetros, listarlo por un orden…, todo para
 * facilitar la selección de los peleadores»).
 *
 * Filtros: estado, nombre o gimnasio, categoría, división, provincia, combates, edad y peso; siete órdenes. Cada tarjeta enseña lo que
 * hace falta para elegir (récord en la disciplina y el nivel del evento, aura, edad, peso y mensaje) y se responde una a una o marcando
 * varias. La misma lista se descarga en CSV con los filtros aplicados.
 */
export default async function Inscripciones({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [{ slug }, user, sp] = await Promise.all([params, getUser(), searchParams]);
  const ruta = `/organizador/${slug}/inscripciones`;
  if (!user) redirect(loginPath(ruta));
  const event = await db.event.findUnique({ where: { slug } });
  if (!event) notFound();
  if (event.organizerId !== user.id && user.role !== "ADMIN") redirect("/organizador?problema=sin_permiso");

  const { q, estado: estadoCrudo, peso, division, provincia, mincomb, maxcomb, minedad, maxedad, minpeso, maxpeso, orden: ordenCruda } = flatParams(sp);
  const estado = parseEstadoLista(estadoCrudo);
  const orden = parseOrden(ordenCruda);
  const categorias = weightClassesFor(event.discipline, event.level, division);
  const divisiones = divisionsFor(event.discipline, event.level);
  const filtros = {
    texto: q?.slice(0, 80) || undefined, weightClass: categorias.some((c) => c.valor === peso) ? peso : undefined, divisionId: divisiones.some((d) => d.id === division) ? division : undefined,
    provincia: provincia && (PROVINCES as readonly string[]).includes(provincia) ? provincia : undefined,
    minCombates: numeroDeFiltro(mincomb), maxCombates: numeroDeFiltro(maxcomb), minEdad: numeroDeFiltro(minedad), maxEdad: numeroDeFiltro(maxedad), minPeso: numeroDeFiltro(minpeso), maxPeso: numeroDeFiltro(maxpeso),
  };
  const todas = await solicitudesDeEvento(event);
  const lista = filtrarYOrdenar(todas, { ...filtros, estado: ESTADOS_LISTA[estado], orden });
  // Recuentos por estado con los demás filtros aplicados, para saber cuántas quedan en cada pestaña.
  const conFiltros = filtrarYOrdenar(todas, { ...filtros, estado: "TODAS" });
  const cuenta = (e: EstadoLista) => (e === "todas" ? conFiltros.length : conFiltros.filter((r) => r.status === ESTADOS_LISTA[e]).length);
  const aceptadas = todas.filter((r) => r.status === "ACCEPTED").length;
  const plazas = await db.eventSlot.findMany({ where: { eventId: event.id }, orderBy: [{ divisionId: "asc" }, { weightClass: "asc" }] });
  const ocup = ocupacion(plazas, todas);

  // Los parámetros tal y como están, para volver a la misma lista después de responder y para quitar filtros sueltos.
  const p: Record<string, string | undefined> = { q: filtros.texto, estado: estado === "pendientes" ? undefined : estado, peso: filtros.weightClass, division: filtros.divisionId, provincia: filtros.provincia, mincomb: filtros.minCombates?.toString(), maxcomb: filtros.maxCombates?.toString(), minedad: filtros.minEdad?.toString(), maxedad: filtros.maxEdad?.toString(), minpeso: filtros.minPeso?.toString(), maxpeso: filtros.maxPeso?.toString(), orden: orden === "fecha" ? undefined : orden };
  const con = (cambios: Record<string, string | undefined>, destino = ruta) => {
    const s = new URLSearchParams(Object.entries({ ...p, ...cambios }).filter((e): e is [string, string] => !!e[1])).toString();
    return s ? `${destino}?${s}` : destino;
  };
  const back = con({});
  const secundarios = [filtros.weightClass, filtros.divisionId, filtros.provincia, filtros.minCombates !== undefined, filtros.maxCombates !== undefined, filtros.minEdad !== undefined, filtros.maxEdad !== undefined, filtros.minPeso !== undefined, filtros.maxPeso !== undefined].filter(Boolean).length;
  const hayFiltros = !!(filtros.texto || secundarios || orden !== "fecha");
  const rango = (a: number | undefined, b: number | undefined, unidad: string) => (a !== undefined && b !== undefined ? `de ${a} a ${b} ${unidad}` : a !== undefined ? `${a} ${unidad} o más` : `hasta ${b} ${unidad}`);
  const abierta = inscripcionAbierta(event, todayMadrid());

  return (
    <div className="pantalla" style={{ gap: 14 }}>
      <p style={{ margin: 0 }}><Link href={`/organizador/${event.slug}#inscripcion`}>← Volver a «{event.name}»</Link></p>
      <div>
        <h1>Solicitudes para participar</h1>
        <p className="lead" style={{ fontSize: 16, margin: 0 }}>{event.name} · {EVENT_KIND_LABEL[event.kind]} de {DISCIPLINE_LABEL[event.discipline]} · {fmtDate(event.date)}</p>
        <p className="meta" style={{ margin: "6px 0 0" }}>{abierta ? "La inscripción está abierta." : "La inscripción está cerrada: no llegan solicitudes nuevas, pero puedes responder las que tienes."} Aceptar a un peleador no lo pone en el cartel: después lo emparejas tú.</p>
      </div>
      {aceptadas > 0 && <Link className="btn" href={`/organizador/${event.slug}/emparejar`} style={{ alignSelf: "flex-start" }}>Emparejar a los aceptados ({aceptadas})</Link>}

      {plazas.length > 0 && (
        <section className="tarjeta" aria-labelledby="titulo-plazas-lista" style={{ gap: 8 }}>
          <h2 id="titulo-plazas-lista" style={{ margin: 0, font: "700 18px var(--font)" }}>Plazas por categoría</h2>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 4 }}>
            {plazas.map((pl) => {
              const o = ocup.get(claveCategoria(pl.divisionId, pl.weightClass));
              return (
                <li key={pl.id}>
                  <Link href={con({ peso: pl.weightClass, division: pl.divisionId || undefined, estado: "todas" })}>{categoryLabel(event.discipline, event.level, pl.divisionId || null, pl.weightClass)}</Link>
                  <span className="meta"> · {o?.aceptadas ?? 0} de {pl.places} cubiertas{o?.llena ? " (completa)" : ""}{o?.pendientes ? ` · ${o.pendientes} ${o.llena ? "en lista de espera" : o.pendientes === 1 ? "pendiente" : "pendientes"}` : ""}</span>
                </li>
              );
            })}
          </ul>
          <Link href={`/organizador/${event.slug}#plazas`}>Cambiar las plazas</Link>
        </section>
      )}

      <nav aria-label="Estado de las solicitudes" className="estados-lista">
        {(Object.keys(NOMBRE_ESTADO) as EstadoLista[]).map((e) => (
          <Link key={e} href={con({ estado: e === "pendientes" ? undefined : e })} className="chip" aria-current={e === estado ? "page" : undefined}>{NOMBRE_ESTADO[e]} ({cuenta(e)})</Link>
        ))}
      </nav>

      <form className="search" role="search" aria-label="Filtrar las solicitudes">
        {estado !== "pendientes" && <input type="hidden" name="estado" value={estado} />}
        <CampoFiltro etiqueta="Nombre o gimnasio"><input name="q" defaultValue={filtros.texto} maxLength={80} /></CampoFiltro>
        <CampoFiltro etiqueta="Ordenar por"><select name="orden" defaultValue={orden}>{Object.entries(ORDENES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></CampoFiltro>
        <MasFiltros activos={secundarios}>
          {categorias.length > 0 && <CampoFiltro etiqueta="Categoría de peso"><select name="peso" defaultValue={filtros.weightClass ?? ""}><option value="">Todas las categorías</option>{categorias.map((c) => <option key={c.valor} value={c.valor}>{c.etiqueta}</option>)}</select></CampoFiltro>}
          {divisiones.length > 0 && <CampoFiltro etiqueta="Edad y categoría deportiva"><select name="division" defaultValue={filtros.divisionId ?? ""}><option value="">Todas</option>{divisiones.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}</select></CampoFiltro>}
          <CampoFiltro etiqueta="Provincia"><select name="provincia" defaultValue={filtros.provincia ?? ""}><option value="">Toda España</option>{PROVINCES.map((x) => <option key={x}>{x}</option>)}</select></CampoFiltro>
          <CampoFiltro etiqueta="Combates, como mínimo"><input name="mincomb" type="number" inputMode="numeric" min={0} max={999} defaultValue={filtros.minCombates} /></CampoFiltro>
          <CampoFiltro etiqueta="Combates, como máximo"><input name="maxcomb" type="number" inputMode="numeric" min={0} max={999} defaultValue={filtros.maxCombates} /></CampoFiltro>
          <CampoFiltro etiqueta="Edad mínima" ayuda="Edad el día del evento."><input name="minedad" type="number" inputMode="numeric" min={0} max={99} defaultValue={filtros.minEdad} /></CampoFiltro>
          <CampoFiltro etiqueta="Edad máxima"><input name="maxedad" type="number" inputMode="numeric" min={0} max={99} defaultValue={filtros.maxEdad} /></CampoFiltro>
          <CampoFiltro etiqueta="Peso mínimo (kg)" ayuda="El que ha declarado el peleador."><input name="minpeso" type="number" inputMode="decimal" step="0.1" min={0} max={300} defaultValue={filtros.minPeso} /></CampoFiltro>
          <CampoFiltro etiqueta="Peso máximo (kg)"><input name="maxpeso" type="number" inputMode="decimal" step="0.1" min={0} max={300} defaultValue={filtros.maxPeso} /></CampoFiltro>
        </MasFiltros>
        <BotonesFiltro ruta={estado === "pendientes" ? ruta : `${ruta}?estado=${estado}`} hayFiltros={hayFiltros} />
      </form>
      <FiltrosActivos ruta={ruta} params={p} activos={[
        ...(filtros.texto ? [{ texto: `Búsqueda: ${filtros.texto}`, claves: ["q"] }] : []),
        ...(filtros.weightClass ? [{ texto: categorias.find((c) => c.valor === filtros.weightClass)?.etiqueta ?? filtros.weightClass, claves: ["peso"] }] : []),
        ...(filtros.divisionId ? [{ texto: divisiones.find((d) => d.id === filtros.divisionId)?.label ?? "División", claves: ["division"] }] : []),
        ...(filtros.provincia ? [{ texto: filtros.provincia, claves: ["provincia"] }] : []),
        ...(filtros.minCombates !== undefined || filtros.maxCombates !== undefined ? [{ texto: rango(filtros.minCombates, filtros.maxCombates, "combates"), claves: ["mincomb", "maxcomb"] }] : []),
        ...(filtros.minEdad !== undefined || filtros.maxEdad !== undefined ? [{ texto: `Edad: ${rango(filtros.minEdad, filtros.maxEdad, "años")}`, claves: ["minedad", "maxedad"] }] : []),
        ...(filtros.minPeso !== undefined || filtros.maxPeso !== undefined ? [{ texto: `Peso: ${rango(filtros.minPeso, filtros.maxPeso, "kg")}`, claves: ["minpeso", "maxpeso"] }] : []),
        ...(orden !== "fecha" ? [{ texto: `Orden: ${ORDENES[orden]}`, claves: ["orden"] }] : []),
      ]} />

      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <span className="meta">{lista.length === 1 ? "1 solicitud" : `${lista.length} solicitudes`}{todas.length >= 500 ? " (se muestran las 500 primeras)" : ""}</span>
        {lista.length > 0 && <a href={con({}, `${ruta}/csv`)} className="btn secondary" download>Descargar esta lista (CSV)</a>}
      </div>

      {lista.some((r) => r.status !== "WITHDRAWN") && (
        <form id="lote" action={answerRegistrations} className="lote-inscripciones" aria-label="Responder a las solicitudes marcadas">
          <input type="hidden" name="eventId" value={event.id} />
          <input type="hidden" name="back" value={back} />
          <strong>Responder a varias a la vez</strong>
          <SeleccionLote formulario="lote" />
          <label className="field"><span>Mensaje para los peleadores marcados (opcional)</span><textarea name="reply" rows={2} maxLength={REG_REPLY_MAX} placeholder="Pesaje, hora de llegada, qué traer…" /></label>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button name="decision" value="aceptar" style={{ flex: 1 }}>Aceptar las marcadas</button>
            <button name="decision" value="rechazar" className="secondary" style={{ flex: 1 }}>Rechazar las marcadas</button>
          </div>
        </form>
      )}

      {lista.length === 0 && (
        <p className="mut" style={{ margin: 0 }}>
          {todas.length === 0 ? (abierta ? "Todavía no ha llegado ninguna solicitud. Te llegará un correo con cada una." : "No hay solicitudes. Abre la inscripción en la página de gestión del evento para recibirlas.") : hayFiltros ? "Ninguna solicitud coincide con estos filtros. Quita alguno en «Estás viendo»." : `No hay solicitudes ${NOMBRE_ESTADO[estado].toLowerCase()}.`}
        </p>
      )}
      {lista.map((r) => (
        <article key={r.id} className="tarjeta" style={r.status === "PENDING" ? { borderColor: "var(--acc)" } : undefined} aria-label={`Solicitud de ${r.nombre}: ${REG_STATUS_LABEL[r.status]}`}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            {r.status !== "WITHDRAWN" ? (
              <label className="marcar"><input type="checkbox" name="ids" value={r.id} form="lote" aria-label={`Marcar a ${r.nombre}`} /><strong>{r.nombre}</strong></label>
            ) : <strong>{r.nombre}</strong>}
            <span className={`pildora ${PILDORA[r.status]}`}>{enListaDeEspera(r, ocup) ? "En lista de espera" : REG_STATUS_LABEL[r.status]}</span>
          </div>
          <div className="meta">{[r.gimnasio, r.provincia].filter(Boolean).join(" · ") || "Sin gimnasio ni provincia indicados"} · <Link href={`/peleadores/${r.slug}`}>Ver su ficha</Link></div>
          <dl className="datos-solicitud">
            <div><dt>Récord:</dt><dd>{r.victorias}-{r.derrotas}-{r.empates}</dd></div>
            <div><dt>Combates:</dt><dd>{r.combates}</dd></div>
            <div><dt>Aura:</dt><dd>{r.aura}</dd></div>
            <div><dt>Edad:</dt><dd>{r.edad ?? "sin indicar"}</dd></div>
            <div><dt>Peso:</dt><dd>{r.weightKg ? kilos(r.weightKg) : "sin indicar"}</dd></div>
          </dl>
          <div className="meta">Categoría: {categoryLabel(event.discipline, event.level, r.divisionId, r.weightClass)} · Pedida el {fmtDate(r.createdAt)}</div>
          {r.message && <p style={{ margin: 0 }}>«{r.message}»</p>}
          {r.reply && <div className="meta">Tu respuesta: {r.reply}</div>}
          {r.correo && <div className="meta">Contacto: <a href={`mailto:${r.correo}`}>{r.correo}</a></div>}
          {r.status !== "WITHDRAWN" && (
            <form action={answerRegistrations} style={{ display: "flex", gap: 10, flexWrap: "wrap", paddingTop: 10, borderTop: "1px solid var(--line)" }}>
              <input type="hidden" name="eventId" value={event.id} />
              <input type="hidden" name="back" value={back} />
              {r.status !== "ACCEPTED" && <button name="solo" value={`${r.id}:aceptar`} style={{ flex: 1 }} aria-label={`Aceptar a ${r.nombre}`}>Aceptar</button>}
              {r.status !== "DECLINED" && <button name="solo" value={`${r.id}:rechazar`} className="secondary" style={{ flex: 1 }} aria-label={`Rechazar a ${r.nombre}`}>Rechazar</button>}
            </form>
          )}
        </article>
      ))}
    </div>
  );
}
