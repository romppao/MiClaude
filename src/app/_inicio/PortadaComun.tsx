import Link from "next/link";
import type { Discipline, User } from "@prisma/client";
import { db } from "../../lib/common/db";
import { DISCIPLINE_LABEL, DISCIPLINE_ORDER, DISCIPLINE_SLUG } from "../../lib/common/disciplines";
import { papelDe, type Papel } from "../../lib/accounts/landing";
import { ultimasNoticias } from "../../lib/news/feed";
import Icono from "../components/Icono";
import { ListaNoticias, SinNoticias } from "../components/Noticias";
import { TarjetaCartel, TarjetaDisciplina } from "../components/Tarjetas";
import { Saludo } from "./comun";
import { proximasVeladas } from "./datos";

const QUE_HAY_EN_MI_PANEL: Record<Papel, string> = {
  visitante: "",
  usuario: "Los peleadores que sigues, tus auras y tus vídeos y fotos.",
  peleador: "Tu próximo combate, tu récord, tu aura y lo que falta por confirmar.",
  entrenador: "Tus clases, tus veladas e interclubs y tu perfil.",
  entidad: "Tus veladas, los resultados pendientes y tu próxima cita.",
};

/** Disciplinas propias: las elegidas al registrarse, las de su ficha de peleador y las que enseña como entrenador. */
async function disciplinasDe(user: User & { fighter: { disciplines: { discipline: Discipline }[] } | null }): Promise<Discipline[]> {
  const trainer = user.role === "TRAINER" ? await db.trainer.findUnique({ where: { userId: user.id }, select: { disciplines: true } }) : null;
  const todas = [...user.interests, ...(user.fighter?.disciplines.map((d) => d.discipline) ?? []), ...(trainer?.disciplines ?? [])];
  return DISCIPLINE_ORDER.filter((d) => todas.includes(d));
}

/**
 * Portada común (decisión del fundador, 8 de octubre de 2026): «después de iniciar sesión a todos los usuarios les aparece la misma
 * pantalla de inicio», con la actualidad de los deportes de contacto de fuentes variadas, y desde ahí la portada de cada disciplina
 * elegida. Lo propio de cada tipo de cuenta está en «Mi panel».
 */
export default async function InicioComun({ user }: { user: User & { fighter: { disciplines: { discipline: Discipline }[] } | null } }) {
  const [mias, noticias, veladas] = await Promise.all([disciplinasDe(user), ultimasNoticias({ max: 10 }), proximasVeladas(6)]);
  const otras = DISCIPLINE_ORDER.filter((d) => !mias.includes(d));
  const papel = papelDe(user);
  return (
    <div className="pantalla" style={{ gap: 26 }}>
      <Saludo nombre={user.name} sub="Lo último de los deportes de contacto" />

      <Link href="/mi-panel" className="fila" style={{ padding: 16, borderRadius: 26 }}>
        <span className="avatar avatar-relleno" aria-hidden="true" style={{ width: 48, height: 48, borderRadius: 16 }}><Icono nombre="capas" /></span>
        <span className="cuerpo"><span style={{ font: "700 17px var(--font)" }}>Mi panel</span><span className="meta">{QUE_HAY_EN_MI_PANEL[papel]}</span></span>
        <Icono nombre="siguiente" tam={18} />
      </Link>

      <section aria-labelledby="titulo-mis-disciplinas" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div><h2 id="titulo-mis-disciplinas" style={{ fontSize: 24 }}>{mias.length ? "Tus disciplinas" : "Elige una disciplina"}</h2><p className="lead" style={{ fontSize: 16 }}>Noticias, veladas, peleadores y gimnasios de cada una.</p></div>
        {mias.length > 0 && <div className="desliza" role="region" tabIndex={0} aria-label="Tus disciplinas (desliza para ver más)">{mias.map((d) => <TarjetaDisciplina key={d} d={d} href={`/disciplinas/${DISCIPLINE_SLUG[d]}`} pequena />)}</div>}
        <nav className="filtros-disciplina" aria-label={mias.length ? "Otras disciplinas" : "Disciplinas"}>
          {(mias.length ? otras : DISCIPLINE_ORDER).map((d) => <Link key={d} href={`/disciplinas/${DISCIPLINE_SLUG[d]}`}>{DISCIPLINE_LABEL[d]}</Link>)}
        </nav>
      </section>

      <section aria-labelledby="titulo-actualidad" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="titulo-seccion"><h2 id="titulo-actualidad">Actualidad</h2><Link href="/noticias">Todas las noticias</Link></div>
        {noticias.length ? <ListaNoticias noticias={noticias} /> : <SinNoticias />}
      </section>

      <section aria-labelledby="titulo-veladas-comun" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="titulo-seccion"><h2 id="titulo-veladas-comun">Próximas veladas</h2><Link href="/veladas">Calendario</Link></div>
        {veladas.length ? <div className="desliza veladas-portada" role="region" tabIndex={0} aria-label="Próximas veladas (desliza para ver más)">{veladas.map((e) => <TarjetaCartel key={e.id} e={e} />)}</div>
          : <p className="mut" style={{ margin: 0 }}>No hay veladas programadas. <Link href="/veladas">Ver todo el calendario</Link></p>}
      </section>
    </div>
  );
}
