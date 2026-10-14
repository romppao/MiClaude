import Link from "next/link";
import type { User } from "@prisma/client";
import { db } from "../../lib/common/db";
import { calendarDayStart } from "../../lib/common/dates";
import { DISCIPLINE_ORDER, DISCIPLINE_SLUG } from "../../lib/common/disciplines";
import { publicFighterName } from "../../lib/common/names";
import { plural } from "../../lib/common/text";
import CercaDeTi from "./CercaDeTi";
import TeToca from "./TeToca";
import CompletaPerfil from "./CompletaPerfil";
import { giveAura, removeAura } from "../actions/aura";
import { toggleFollow } from "../actions/community";
import { AURA_PER_DAY, canGiveAura } from "../../lib/aura/rules";
import { filtrosSiguiendo } from "../../lib/community/siguiendo";
import { boutsQueCuentan } from "../../lib/common/record-eligibility";
import { fmtDate } from "../../lib/common/labels";
import { TarjetaDisciplina } from "../components/Tarjetas";
import { AccionesPrincipales, CombateVS, Saludo, textoResultado } from "./comun";
import { peleadoresConAura, proximasVeladas, CUENTA } from "./datos";

const conRecord = { include: { disciplines: true, boutsAsA: { where: CUENTA, include: { event: true } }, boutsAsB: { where: CUENTA, include: { event: true } } } } as const;

/**
 * Inicio del aficionado (diseño v3, «homeFan»): el próximo combate de quien sigue en formato «VS», sus auras, los últimos resultados
 * de sus peleadores con el botón de aura y sus disciplinas. También lo usan moderación y las entidades pendientes de aprobar.
 */
export default async function InicioAficionado({ user }: { user: User }) {
  const seguidos = (await db.follow.findMany({ where: { userId: user.id, fighter: { hiddenAt: null } }, select: { fighterId: true } })).map((x) => x.fighterId);
  const deSeguidos = { OR: [{ fighterAId: { in: seguidos } }, { fighterBId: { in: seguidos } }] };
  // Solicitudes de clase abiertas (esperando respuesta o ya aceptadas): acceso directo a «Mis reservas».
  const reservas = await db.classRequest.count({ where: { userId: user.id, status: { in: ["PENDING", "ACCEPTED"] } } });
  const [proximo, auras, enDirecto, resultados, solicitud] = await Promise.all([
    seguidos.length ? db.bout.findFirst({ where: { ...deSeguidos, event: { date: { gte: calendarDayStart() }, status: "SCHEDULED" } }, include: { event: true, fighterA: conRecord, fighterB: conRecord }, orderBy: [{ event: { date: "asc" } }, { order: "asc" }] }) : null,
    db.aura.count({ where: { userId: user.id } }),
    db.aura.count({ where: { userId: user.id, attended: true } }),
    seguidos.length ? db.bout.findMany({ where: { AND: [deSeguidos, { result: { not: null } }, boutsQueCuentan()] }, include: { event: true, fighterA: true, fighterB: true }, orderBy: [{ event: { date: "desc" } }, { id: "asc" }], take: 5 }) : [],
    db.organizerRequest.findUnique({ where: { userId: user.id } }),
  ]);
  const [recientes, respuestas, sinAura, destacados, veladas, propiaFicha] = await Promise.all([
    db.aura.count({ where: { userId: user.id, updatedAt: { gte: new Date(Date.now() - 864e5) } } }),
    db.classRequest.count({ where: { userId: user.id, status: { in: ["ACCEPTED", "DECLINED"] } } }),
    db.bout.count({ where: { AND: [filtrosSiguiendo(seguidos).resultados, { auras: { none: { userId: user.id } } }] } }),
    seguidos.length ? [] : peleadoresConAura(6, undefined, user.interests),
    seguidos.length ? [] : proximasVeladas(6, undefined, user.interests),
    db.fighter.findUnique({ where: { userId: user.id }, select: { id: true } }),
  ]);
  const misAuras = resultados.length ? await db.aura.findMany({ where: { userId: user.id, boutId: { in: resultados.map((b) => b.id) } }, select: { boutId: true, fighterId: true } }) : [];
  const agenda = await db.eventAttendance.findMany({ where: { userId: user.id, event: { status: "SCHEDULED", date: { gte: calendarDayStart() } } }, include: { event: true }, orderBy: [{ event: { date: "asc" } }, { eventId: "asc" }], take: 20 });
  const disciplinas = [...user.interests, ...DISCIPLINE_ORDER.filter((d) => !user.interests.includes(d))];
  return (
    <div className="pantalla inicio-adaptable" style={{ gap: 26 }}>
      <Saludo kicker="Mi panel" nombre={user.name} sub={seguidos.length ? `Sigues a ${plural(seguidos.length, "peleador", "peleadores")}` : "Todavía no sigues a ningún peleador"} />
      <TeToca pendientes={[
        { texto: "Confirmar el correo", href: "/verificar", cantidad: user.emailVerifiedAt ? 0 : 1 },
        { texto: "Combates sin tu aura", href: "/mi-panel#resultados", cantidad: sinAura },
        { texto: "Respuestas a tus solicitudes de clase", href: "/mis-reservas", cantidad: respuestas },
      ]} />
      <CompletaPerfil campos={[{ texto: "Elegir disciplinas", completo: user.interests.length > 0, href: "/registro/intereses" }, { texto: "Elegir provincia", completo: !!user.province, href: "/mi-cuenta" }]} />
      <AccionesPrincipales acciones={[
        { href: user.province ? `/clases?provincia=${encodeURIComponent(user.province)}` : "/clases", titulo: "Buscar clases", detalle: "Clases con entrenadores cerca de ti", icono: "calendario" },
        ...(reservas ? [{ href: "/mis-reservas", titulo: "Mis reservas", detalle: "Tus clases solicitadas", icono: "bandeja" as const, aviso: reservas }] : []),
        { href: "/compartir", titulo: "Subir vídeos o fotos", detalle: "De una velada a la que fuiste", icono: "camara" },
        { href: "/siguiendo", titulo: "Peleadores que sigo", detalle: "Sus próximos combates", icono: "personas" },
      ]} />

      {solicitud?.status === "PENDING" && (
        <div className="tarjeta tarjeta-discontinua">
          <h2 style={{ font: "800 19px var(--font)" }}>Solicitud de «{solicitud.orgName}» en revisión</h2>
          <p className="mut" style={{ margin: 0 }}>Un moderador revisa tu solicitud. Hasta entonces tu cuenta funciona como la de un aficionado: puedes seguir peleadores y dar aura.</p>
          <Link href="/organizador" className="btn secondary" style={{ alignSelf: "flex-start" }}>Ver el estado de mi solicitud</Link>
        </div>
      )}

      {seguidos.length > 0 && <section aria-labelledby="titulo-proximo" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="titulo-seccion"><h2 id="titulo-proximo">Próximo combate</h2></div>
        {proximo ? <CombateVS b={proximo} />
          : <div className="tarjeta"><p className="mut" style={{ margin: 0 }}>{seguidos.length ? "Ninguno de los peleadores que sigues tiene un combate programado." : "Sigue a peleadores y aquí verás su próximo combate."}</p><Link href={seguidos.length ? "/veladas" : "/peleadores"} className="btn secondary" style={{ alignSelf: "flex-start" }}>{seguidos.length ? "Ver el calendario" : "Buscar peleadores"}</Link></div>}
      </section>}

      <div className="rejilla-2">
        <div className="dato"><span className="clave">Auras dadas</span><span className="valor-grande acc">{auras}</span></div>
        <div className="dato"><span className="clave">Vistas en directo</span><span className="valor-grande">{enDirecto}</span></div>
      </div>



      {seguidos.length === 0 && <>
        <section className="tarjeta" aria-label="Peleadores destacados de tus disciplinas"><h2>Peleadores destacados de tus disciplinas</h2>
          {destacados.map((f) => <div key={f.id} className="fila"><Link className="cuerpo" href={`/peleadores/${f.slug}`}>{f.name}</Link><form action={toggleFollow}><input type="hidden" name="fighterId" value={f.id} /><input type="hidden" name="back" value="/mi-panel" /><button aria-label={`Seguir a ${f.name}`}>Seguir</button></form></div>)}
          {!destacados.length && <Link href="/peleadores">Explorar peleadores de la comunidad</Link>}
        </section>
        <section className="tarjeta" aria-label="Próximas veladas de tus disciplinas"><h2>Próximas veladas de tus disciplinas</h2>
          {veladas.map((v) => <Link className="fila" key={v.id} href={`/veladas/${v.slug}`}>{v.name} · {fmtDate(v.date)} · {v.city}</Link>)}
          {!veladas.length && <Link href="/veladas">Consultar el calendario de veladas</Link>}
        </section>
      </>}
      {seguidos.length > 0 && <section id="resultados" aria-labelledby="titulo-resultados" className="tarjeta">
        <div className="titulo-seccion"><h2 id="titulo-resultados">Últimos resultados</h2><Link href="/siguiendo">Siguiendo</Link></div>
        {resultados.map((b) => <article key={b.id} aria-label={textoResultado(b)}>
          <h3>{textoResultado(b)}</h3><p className="meta">{b.event.name} · {fmtDate(b.event.date)}</p>
          {[b.fighterA, b.fighterB].map((f) => {
            const dada = misAuras.some((x) => x.boutId === b.id && x.fighterId === f.id);
            const permite = canGiveAura({ bout: b, fighterId: f.id, viewerFighterId: propiaFicha?.id }).ok;
            return <div className="fila" key={f.id}>
              <Link className="cuerpo" href={`/peleadores/${f.slug}`}>{publicFighterName(f)}</Link>
              {dada ? <><span className="pildora">Hecho</span><form action={removeAura}><input type="hidden" name="boutId" value={b.id} /><input type="hidden" name="fighterId" value={f.id} /><input type="hidden" name="back" value="/mi-panel" /><button className="secondary" aria-label={`Quitar aura a ${publicFighterName(f)}`}>Quitar aura</button></form></>
                : !user.emailVerifiedAt ? <Link href="/verificar">Confirma el correo para dar aura</Link>
                : permite && recientes < AURA_PER_DAY ? <form action={giveAura}><input type="hidden" name="boutId" value={b.id} /><input type="hidden" name="fighterId" value={f.id} /><input type="hidden" name="back" value="/mi-panel" /><button aria-label={`Dar aura a ${publicFighterName(f)}`}>Dar aura</button></form>
                : <span className="meta">{recientes >= AURA_PER_DAY ? "Has alcanzado el límite diario de aura" : "No puedes dar aura en este combate"}</span>}
            </div>;
          })}
        </article>)}
        {!resultados.length && <p>No hay resultados recientes de los peleadores que sigues.</p>}
      </section>}

      <section className="tarjeta" aria-label="Mi agenda"><h2>Mi agenda</h2>
        {agenda.map(({ event: v }) => <Link key={v.id} className="fila" href={`/veladas/${v.slug}`}>{v.name} · {fmtDate(v.date)}</Link>)}
        {proximo && <Link className="fila" href={`/veladas/${proximo.event.slug}`}>Próximo combate de tus peleadores: {proximo.event.name} · {fmtDate(proximo.event.date)}</Link>}
        {!agenda.length && !proximo && <p>Marca «Voy a ir» en una velada para verla aquí.</p>}
      </section>
      {user.province && <CercaDeTi province={user.province} />}
      <section aria-labelledby="titulo-tus-disciplinas" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div><h2 id="titulo-tus-disciplinas" style={{ fontSize: 24 }}>Tus disciplinas</h2><p className="lead">{user.interests.length ? "Primero las que elegiste." : "Elige una para ver su actualidad, sus veladas y sus peleadores."}</p></div>
        <div className="desliza" role="region" tabIndex={0} aria-label="Tus disciplinas (desliza para ver más)">{disciplinas.map((d) => <TarjetaDisciplina key={d} d={d} href={`/disciplinas/${DISCIPLINE_SLUG[d]}`} pequena />)}</div>
      </section>
    </div>
  );
}
