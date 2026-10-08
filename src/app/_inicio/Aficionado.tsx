import Link from "next/link";
import type { User } from "@prisma/client";
import { db } from "../../lib/common/db";
import { calendarDayStart } from "../../lib/common/dates";
import { DISCIPLINE_ORDER } from "../../lib/common/disciplines";
import { iniciales } from "../../lib/common/apariencia";
import { publicFighterName } from "../../lib/common/names";
import { plural } from "../../lib/common/text";
import Icono from "../components/Icono";
import { TarjetaDisciplina } from "../components/Tarjetas";
import { CombateVS, Saludo, textoResultado } from "./comun";
import { CUENTA } from "./datos";

const conRecord = { include: { disciplines: true, boutsAsA: { where: CUENTA, include: { event: true } }, boutsAsB: { where: CUENTA, include: { event: true } } } } as const;

/**
 * Inicio del aficionado (diseño v3, «homeFan»): el próximo combate de quien sigue en formato «VS», sus auras, los últimos resultados
 * de sus peleadores con el botón de aura y sus disciplinas. También lo usan moderación y las entidades pendientes de aprobar.
 */
export default async function InicioAficionado({ user }: { user: User }) {
  const seguidos = (await db.follow.findMany({ where: { userId: user.id }, select: { fighterId: true } })).map((x) => x.fighterId);
  const deSeguidos = { OR: [{ fighterAId: { in: seguidos } }, { fighterBId: { in: seguidos } }] };
  const [proximo, auras, enDirecto, resultados, solicitud] = await Promise.all([
    seguidos.length ? db.bout.findFirst({ where: { ...deSeguidos, event: { date: { gte: calendarDayStart() }, status: "SCHEDULED" } }, include: { event: true, fighterA: conRecord, fighterB: conRecord }, orderBy: [{ event: { date: "asc" } }, { order: "asc" }] }) : null,
    db.aura.count({ where: { userId: user.id } }),
    db.aura.count({ where: { userId: user.id, attended: true } }),
    seguidos.length ? db.bout.findMany({ where: { ...deSeguidos, result: { not: null }, ...CUENTA }, include: { event: true, fighterA: true, fighterB: true }, orderBy: [{ event: { date: "desc" } }, { id: "asc" }], take: 5 }) : [],
    db.organizerRequest.findUnique({ where: { userId: user.id } }),
  ]);
  const misAuras = resultados.length ? await db.aura.findMany({ where: { userId: user.id, boutId: { in: resultados.map((b) => b.id) } }, select: { boutId: true, fighterId: true } }) : [];
  const disciplinas = [...user.interests, ...DISCIPLINE_ORDER.filter((d) => !user.interests.includes(d))];
  return (
    <div className="pantalla" style={{ gap: 26 }}>
      <Saludo nombre={user.name} sub={seguidos.length ? `Sigues a ${plural(seguidos.length, "peleador", "peleadores")}` : "Todavía no sigues a ningún peleador"} />

      {solicitud?.status === "PENDING" && (
        <div className="tarjeta tarjeta-discontinua">
          <h2 style={{ font: "800 19px var(--font)" }}>Solicitud de «{solicitud.orgName}» en revisión</h2>
          <p className="mut" style={{ margin: 0 }}>Un moderador revisa tu solicitud. Hasta entonces tu cuenta funciona como la de un aficionado: puedes seguir peleadores y dar aura.</p>
          <Link href="/organizador" className="btn secondary" style={{ alignSelf: "flex-start" }}>Ver el estado de mi solicitud</Link>
        </div>
      )}

      <section aria-labelledby="titulo-proximo" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="titulo-seccion"><h2 id="titulo-proximo">Próximo combate</h2></div>
        {proximo ? <CombateVS b={proximo} />
          : <div className="tarjeta"><p className="mut" style={{ margin: 0 }}>{seguidos.length ? "Ninguno de los peleadores que sigues tiene un combate programado." : "Sigue a peleadores y aquí verás su próximo combate."}</p><Link href={seguidos.length ? "/veladas" : "/peleadores"} className="btn secondary" style={{ alignSelf: "flex-start" }}>{seguidos.length ? "Ver el calendario" : "Buscar peleadores"}</Link></div>}
      </section>

      <div className="rejilla-2">
        <div className="dato"><span className="clave">Auras dadas</span><span className="valor-grande acc">{auras}</span></div>
        <div className="dato"><span className="clave">Vistas en directo</span><span className="valor-grande">{enDirecto}</span></div>
      </div>

      <div className="rejilla-2">
        <Link href="/peleadores" className="accion-grande tarjeta tarjeta-acc"><Icono nombre="buscar" tam={26} grosor={1.9} />Descubrir peleadores</Link>
        <Link href="/entrenadores" className="accion-grande tarjeta"><Icono nombre="capas" tam={26} grosor={1.9} />Clases con entrenadores</Link>
      </div>

      <section aria-labelledby="titulo-resultados" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="titulo-seccion"><h2 id="titulo-resultados">Últimos resultados</h2>{seguidos.length > 0 && <Link href="/siguiendo">Siguiendo</Link>}</div>
        {resultados.map((b) => {
          const ganador = b.result === "B_WIN" ? b.fighterB : b.fighterA;
          const dada = misAuras.some((x) => x.boutId === b.id);
          return (
            <div key={b.id} className="fila">
              <Link href={`/peleadores/${ganador.slug}`} className="avatar" style={{ textDecoration: "none" }} aria-label={`Ficha de ${publicFighterName(ganador)}`}>{iniciales(publicFighterName(ganador))}</Link>
              <span className="cuerpo"><span className="nombre" style={{ fontSize: 15 }}>{textoResultado(b)}</span><span className="meta">{b.event.name} · {b.event.date.toLocaleDateString("es-ES", { day: "numeric", month: "short", timeZone: "Europe/Madrid" })}</span></span>
              {dada ? <span className="pildora" style={{ border: "1px solid var(--acc)", background: "transparent", color: "var(--acc)" }}><Icono nombre="aura" tam={14} grosor={2.2} />Hecho</span>
                : <Link href={`/peleadores/${ganador.slug}#combates`} className="btn" style={{ minHeight: 44, padding: "0 14px", fontSize: 14 }} aria-label={`Dar aura por ${textoResultado(b)}`}><Icono nombre="aura" tam={14} grosor={2.2} />Aura</Link>}
            </div>
          );
        })}
        {resultados.length === 0 && <p className="mut" style={{ margin: 0 }}>{seguidos.length ? "Todavía no hay resultados de los peleadores que sigues." : "Cuando sigas a peleadores, aquí verás sus últimos resultados para darles aura."}</p>}
      </section>

      <section aria-labelledby="titulo-tus-disciplinas" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div><h2 id="titulo-tus-disciplinas" style={{ fontSize: 24 }}>Tus disciplinas</h2><p className="lead">{user.interests.length ? "Primero las que elegiste." : "Elige una para ver sus peleadores."}</p></div>
        <div className="desliza" role="region" tabIndex={0} aria-label="Tus disciplinas (desliza para ver más)">{disciplinas.map((d) => <TarjetaDisciplina key={d} d={d} href={`/peleadores?disciplina=${d}`} pequena />)}</div>
      </section>
    </div>
  );
}
