import Link from "next/link";
import TeToca from "./TeToca";
import CompletaPerfil from "./CompletaPerfil";
import type { CSSProperties } from "react";
import type { User } from "@prisma/client";
import { db } from "../../lib/common/db";
import { calendarDayStart, daysUntil, whenLabel } from "../../lib/common/dates";
import { DISCIPLINE_LABEL } from "../../lib/common/disciplines";
import { LEVEL_LABEL, fmtDate } from "../../lib/common/labels";
import { tinteDe } from "../../lib/common/apariencia";
import { TIPO_DE_ENTIDAD_ETIQUETA, parseTipoDeEntidad } from "../../lib/accounts/landing";
import { plural } from "../../lib/common/text";
import { resumenResultadosPendientes, veladasConResultadosPendientes } from "../../lib/events/resultados-pendientes";
import Icono from "../components/Icono";
import { AccionesPrincipales, Saludo } from "./comun";

/**
 * Panel de la promotora, federación o club aprobado (diseño v3, «homeOrg»): cifras, resultados pendientes de veladas ya celebradas,
 * la próxima velada con su cartel y el botón para crear otra. Las inscripciones y la plantilla del club llegarán en la siguiente fase.
 */
export default async function InicioEntidad({ user }: { user: User }) {
  const hoy = calendarDayStart();
  const [solicitud, veladas, pendientes, proxima] = await Promise.all([
    db.organizerRequest.findUnique({ where: { userId: user.id } }),
    db.event.count({ where: { organizerId: user.id } }),
    db.event.findMany({ where: veladasConResultadosPendientes(user.id, hoy), include: { _count: { select: { bouts: { where: { result: null } } } } }, orderBy: [{ date: "desc" }, { id: "asc" }] }),
    db.event.findFirst({ where: { organizerId: user.id, date: { gte: hoy }, status: "SCHEDULED" }, include: { _count: { select: { bouts: true } } }, orderBy: [{ date: "asc" }, { id: "asc" }] }),
  ]);
  const combates = await db.bout.count({ where: { event: { organizerId: user.id } } });
  const inscripciones = veladas ? await db.eventRegistration.count({ where: { status: "PENDING", event: { organizerId: user.id } } }) : 0;
  const kind = parseTipoDeEntidad(solicitud?.kind ?? "") ?? "PROMOTORA";
  const nombre = solicitud?.status === "APPROVED" ? solicitud.orgName : user.name;
  const porResultado = resumenResultadosPendientes(pendientes);
  const perfil = await db.profile.findUnique({ where: { kind_entityId: { kind: "promotor", entityId: user.id } }, select: { hasAvatar: true, bio: true, website: true } });
  return (
    <div className="pantalla inicio-adaptable" style={{ gap: 22 }}>
      <Saludo kicker="Mi panel" nombre={nombre} cuadrado sub={<span style={{ display: "inline-flex", gap: 5, alignItems: "center", color: "var(--acc-text)" }}><Icono nombre="check" tam={14} grosor={2.4} />{TIPO_DE_ENTIDAD_ETIQUETA[kind]} · organizador aprobado</span>} />
      <TeToca pendientes={[
        { texto: "Resultados por poner", href: "/organizador#mis-eventos", cantidad: porResultado.total },
        { texto: "Solicitudes para participar", href: "/organizador", cantidad: inscripciones },
      ]} />
      <CompletaPerfil campos={[
        { texto: "Añadir logotipo", completo: !!perfil?.hasAvatar, href: `/perfiles/promotor/${user.id}/editar` },
        { texto: "Añadir presentación", completo: !!perfil?.bio, href: `/perfiles/promotor/${user.id}/editar` },
        { texto: "Añadir web", completo: !!perfil?.website, href: `/perfiles/promotor/${user.id}/editar` },
      ]} />
      <AccionesPrincipales acciones={[
        { href: "/organizador#crear", titulo: "Crear una velada o interclub", detalle: "Cartel abierto al público", icono: "trofeo" },
        { href: "/organizador", titulo: "Mis veladas", detalle: "Cartel y resultados", icono: "calendario" },
        { href: "/peleadores", titulo: "Buscar peleadores", detalle: "Para tus carteles", icono: "buscar" },
        { href: `/promotores/${user.id}`, titulo: "Mi perfil público", detalle: "Cómo te ve la gente", icono: "escudo" },
      ]} />
      <div className="rejilla-3">
        <div className="dato"><span className="clave">Veladas</span><span className="valor" style={{ fontSize: 34 }}>{veladas}</span></div>
        <div className="dato"><span className="clave">Combates</span><span className="valor" style={{ fontSize: 34 }}>{combates}</span></div>
        <div className="dato"><span className="clave">Por resultado</span><span className="valor acc" style={{ fontSize: 34 }}>{porResultado.total}</span></div>
      </div>
      {porResultado.visibles.map((v) => (
        <Link key={v.id} href={`/organizador/${v.slug}`} className="fila tarjeta-violeta" style={{ padding: 16, borderRadius: 28 }}>
          <span className="avatar btn-negro" style={{ width: 52, height: 52, borderRadius: 18, font: "800 22px var(--font)" }} aria-hidden="true">{v._count.bouts}</span>
          <span className="cuerpo"><span style={{ font: "800 17px/1.2 var(--font)" }}>{plural(v._count.bouts, "resultado por poner", "resultados por poner")}</span><span style={{ font: "500 14px var(--font)" }}>{v.name} se celebró el {fmtDate(v.date)}</span></span>
          <Icono nombre="siguiente" />
        </Link>
      ))}
      {porResultado.resto > 0 && <Link href="/organizador#mis-eventos" style={{ alignSelf: "flex-start" }}>{porResultado.resto === 1 ? "Ver otra velada" : `Ver otras ${porResultado.resto} veladas`} con resultados por poner</Link>}
      <section aria-labelledby="titulo-proxima-velada" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="titulo-seccion"><h2 id="titulo-proxima-velada">Próxima velada</h2><Link href="/organizador">Todas</Link></div>
        {proxima ? (
          <div className="tarjeta" style={{ padding: 0, overflow: "hidden", gap: 0 }}>
            <div className="tarjeta-foto" style={{ height: 170, borderRadius: 0, "--tinte": tinteDe(proxima.discipline) } as CSSProperties}>
              <span className="arriba"><span className="pildora pildora-acc">{proxima._count.bouts ? "Publicada" : "Cartel vacío"}</span></span>
            </div>
            <div style={{ padding: "4px 18px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div><h3 style={{ margin: 0, font: "800 24px/1.05 var(--font)", letterSpacing: "-.03em" }}>{proxima.name}</h3><div className="meta" style={{ fontSize: 15 }}>{fmtDate(proxima.date)} · {proxima.venue}, {proxima.city} · {DISCIPLINE_LABEL[proxima.discipline]} {LEVEL_LABEL[proxima.level].toLowerCase()}</div></div>
              <div style={{ display: "flex", justifyContent: "space-between" }} className="meta"><span>{plural(proxima._count.bouts, "combate", "combates")} en el cartel</span><span>{whenLabel(daysUntil(proxima.date))}</span></div>
              <Link href={`/organizador/${proxima.slug}`} className="btn secondary">Gestionar el cartel</Link>
            </div>
          </div>
        ) : <p className="mut" style={{ margin: 0 }}>No tienes veladas programadas.</p>}
      </section>
    </div>
  );
}
