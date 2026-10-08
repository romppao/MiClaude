import Link from "next/link";
import type { CSSProperties } from "react";
import type { User } from "@prisma/client";
import { db } from "../../lib/common/db";
import { calendarDayStart, madridDayStart, monthlySeries } from "../../lib/common/dates";
import { DISCIPLINE_LABEL, weightClassLabel } from "../../lib/common/disciplines";
import { fmtDate } from "../../lib/common/labels";
import { iniciales, tinteDe } from "../../lib/common/apariencia";
import { publicFighterName } from "../../lib/common/names";
import { combinedRecord, computeRecords, emptyTally } from "../../lib/fighters/record";
import CuentaAtras from "../components/CuentaAtras";
import Foto from "../components/Foto";
import Icono from "../components/Icono";
import { GraficoAura } from "../components/Tarjetas";
import { Saludo } from "./comun";
import { CUENTA } from "./datos";

/**
 * Inicio del peleador (diseño v3, «homeFighter»): su foto a sangre con récord y aura, la cuenta atrás de su próximo combate,
 * los combates que otros declaran con él, su gráfico de aura y los accesos a registrar combates y a sus títulos.
 */
export default async function InicioPeleador({ user }: { user: User & { fighter: { id: string } | null } }) {
  if (!user.fighter) {
    return (
      <div className="pantalla">
        <Saludo kicker="Mi panel" nombre={user.name} sub="Peleador" />
        <div className="tarjeta tarjeta-acc anillo" style={{ padding: 22 }}>
          <h2 style={{ font: "800 24px/1.1 var(--font)" }}>Crea tu ficha</h2>
          <p style={{ margin: 0, fontWeight: 500 }}>{user.emailVerifiedAt ? "Revisa los datos que elegiste al registrarte y publica tu ficha para registrar tus combates." : "Primero confirma tu correo electrónico con el enlace que te enviamos; después podrás publicar tu ficha."}</p>
          <Link href={user.emailVerifiedAt ? "/mi-ficha" : "/verificar"} className="btn btn-negro" style={{ alignSelf: "flex-start" }}>{user.emailVerifiedAt ? "Crear mi ficha" : "Confirmar mi correo"}</Link>
        </div>
      </div>
    );
  }
  const me = await db.fighter.findUniqueOrThrow({ where: { id: user.fighter.id }, include: { disciplines: true, gym: true } });
  const deMi = { OR: [{ fighterAId: me.id }, { fighterBId: me.id }] };
  const [bouts, proximo, porConfirmar, auras] = await Promise.all([
    db.bout.findMany({ where: deMi, include: { event: true } }),
    db.bout.findFirst({ where: { ...deMi, event: { date: { gte: calendarDayStart() }, status: "SCHEDULED" } }, include: { event: true, fighterA: true, fighterB: true }, orderBy: [{ event: { date: "asc" } }, { order: "asc" }] }),
    db.bout.findMany({ where: { fighterBId: me.id, verification: "SELF_REPORTED", result: { not: null } }, include: { event: true, fighterA: true }, orderBy: { event: { date: "desc" } }, take: 3 }),
    db.aura.findMany({ where: { fighterId: me.id, bout: CUENTA }, select: { createdAt: true } }),
  ]);
  const principal = me.disciplines[0];
  const tally = principal ? computeRecords(me.id, bouts)[principal.discipline]?.[principal.level] ?? emptyTally() : emptyTally();
  const rec = combinedRecord(tally, principal ? { total: principal.priorTotal, wins: principal.priorWins, losses: principal.priorLosses, draws: principal.priorDraws } : null);
  const serie = monthlySeries(auras.map((a) => a.createdAt), 7);
  const esteMes = serie[serie.length - 1]?.total ?? 0;
  const nombre = `${me.firstName} ${me.lastName}`;
  const rival = proximo ? (proximo.fighterAId === me.id ? proximo.fighterB : proximo.fighterA) : null;
  return (
    <div className="pantalla" style={{ gap: 20 }}>
      <section className="portada a-sangre" style={{ marginTop: -20, minHeight: 470, "--tinte": tinteDe(principal?.discipline) } as CSSProperties} aria-labelledby="mi-nombre">
        <span className="iniciales" aria-hidden="true">{iniciales(nombre)}</span>
        <Foto className="fondo" src={`/imagenes/peleador/${me.id}/banner`} />
        <div className="barra-superior">
          <Link href="/mi-cuenta" className="avatar avatar-acc boton-cristal" style={{ width: 46, height: 46, textDecoration: "none", position: "relative", overflow: "hidden" }} aria-label="Mi cuenta">{iniciales(nombre)}<Foto className="avatar-foto" src={`/imagenes/peleador/${me.id}/avatar`} /></Link>
          <Link href={`/peleadores/${me.slug}`} className="btn boton-cristal" style={{ minHeight: 44, fontSize: 14 }}>Ver mi ficha pública</Link>
        </div>
        <div>
          <div className="apodo">{[me.alias && `«${me.alias}»`, principal && DISCIPLINE_LABEL[principal.discipline], principal?.weightClass && weightClassLabel(principal.discipline, principal.level, principal.weightClass, principal.divisionId)].filter(Boolean).join(" · ")}</div>
          <h1 id="mi-nombre" className="nombre" style={{ fontSize: 44 }}>{nombre}</h1>
        </div>
        <div className="cifras">
          <span className="sr-only">Récord: {rec.w} victorias, {rec.l} derrotas y {rec.d} empates. {auras.length} de aura.</span>
          <span className="cifra acc" aria-hidden="true">{rec.w}<small>V</small></span>
          <span className="cifra" aria-hidden="true">{rec.l}<small>D</small></span>
          <span className="cifra" aria-hidden="true">{rec.d}<small>E</small></span>
          <span style={{ marginLeft: "auto", textAlign: "right" }} aria-hidden="true"><span style={{ font: "800 30px/1 var(--font)", color: "var(--acc2)" }}>{auras.length}</span><span className="meta" style={{ display: "block", color: "rgba(255,255,255,.75)" }}>de aura</span></span>
        </div>
      </section>
      {principal?.level === "AMATEUR" && !me.recordPublic && <p className="mut" style={{ margin: 0 }}>Tu récord amateur es privado: el público solo ve cuántos combates llevas. <Link href="/mi-ficha#privacidad">Cambiarlo</Link></p>}

      <section className="tarjeta" aria-labelledby="titulo-mi-proximo" style={{ gap: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}><h2 id="titulo-mi-proximo" className="kicker">Tu próximo combate</h2>{proximo && <span className="pildora pildora-acc">En el cartel</span>}</div>
        {proximo && rival ? <>
          <div><div style={{ font: "800 22px/1.05 var(--font)", letterSpacing: "-.03em" }}>contra {publicFighterName(rival)}</div><div className="meta" style={{ fontSize: 15 }}>{proximo.event.name} · {fmtDate(proximo.event.date)}{proximo.weightClass ? ` · ${weightClassLabel(proximo.event.discipline, proximo.event.level, proximo.weightClass, proximo.divisionId)}` : ""}</div></div>
          <CuentaAtras hasta={madridDayStart(proximo.event.date).toISOString()} inicio={Date.now()} />
          <span className="meta">Hasta el día de la velada.</span>
          <Link href={`/veladas/${proximo.event.slug}`} className="btn secondary">Ver el cartel</Link>
        </> : <>
          <p className="mut" style={{ margin: 0 }}>No tienes ningún combate programado. Cuando un organizador te ponga en un cartel, o registres uno futuro, verás aquí la cuenta atrás.</p>
          <Link href="/veladas" className="btn secondary">Ver el calendario de veladas</Link>
        </>}
      </section>

      {porConfirmar.map((b) => (
        <section key={b.id} className="tarjeta tarjeta-acc" aria-label={`Combate por confirmar contra ${publicFighterName(b.fighterA)}`}>
          <span className="kicker">Por confirmar</span>
          <div style={{ font: "800 21px/1.15 var(--font)", letterSpacing: "-.03em" }}>{publicFighterName(b.fighterA)} declara un combate contigo</div>
          <p style={{ margin: 0, fontWeight: 500 }}>{b.event.name} · {fmtDate(b.event.date)}. Confirmarlo es opcional; si no es correcto, puedes pedir que se revise.</p>
          <Link href="/mi-ficha#por-confirmar" className="btn btn-negro">Revisar el combate</Link>
        </section>
      ))}

      <section className="tarjeta" aria-labelledby="titulo-mi-aura" style={{ gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <div><h2 id="titulo-mi-aura" style={{ font: "800 24px var(--font)", letterSpacing: "-.03em" }}>Tu aura</h2><div className="meta">Reconocimiento del público</div></div>
          <span className="pildora pildora-violeta">+{esteMes} este mes</span>
        </div>
        <GraficoAura serie={serie} etiqueta={`Aura recibida en los últimos 7 meses: ${serie.map((x) => `${x.mes} ${x.total}`).join(", ")}`} />
      </section>

      <div className="rejilla-2">
        <Link href="/mi-ficha#registrar-combate" className="accion-grande tarjeta tarjeta-acc"><Icono nombre="mas" tam={26} grosor={2.2} />Registrar un combate</Link>
        <Link href="/mi-ficha/trayectoria" className="accion-grande tarjeta"><Icono nombre="trofeo" tam={26} grosor={1.8} />Mis títulos y mi aura</Link>
      </div>
    </div>
  );
}
