import Link from "next/link";
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "../../../lib/common/db";
import { DISCIPLINE_LABEL, DISCIPLINE_ORDER, DISCIPLINE_SLUG, disciplineFromSlug } from "../../../lib/common/disciplines";
import { COLOR_DISCIPLINA, tinteDe } from "../../../lib/common/apariencia";
import { ultimasNoticias } from "../../../lib/news/feed";
import { actualizarSiToca } from "../../../lib/news/refresh";
import { ListaNoticias, SinNoticias } from "../../components/Noticias";
import { MiniPeleador, TarjetaCartel } from "../../components/Tarjetas";
import { CUENTA, proximasVeladas } from "../../_inicio/datos";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const d = disciplineFromSlug((await params).slug);
  return { title: d ? DISCIPLINE_LABEL[d] : "Disciplina no encontrada" };
}

/**
 * Portada de una disciplina (petición del fundador, 8 de octubre de 2026: «una subpantalla de inicio específica de cada disciplina»):
 * su actualidad, sus próximas veladas, sus peleadores con más aura y quién la enseña. Mismo trato y mismo orden para todas.
 */
export default async function Disciplina({ params }: { params: Promise<{ slug: string }> }) {
  actualizarSiToca();
  const d = disciplineFromSlug((await params).slug);
  if (!d) notFound();
  const nombre = DISCIPLINE_LABEL[d];
  const [noticias, veladas, grupos, entrenadores] = await Promise.all([
    ultimasNoticias({ disciplina: d, max: 8 }),
    proximasVeladas(6, d),
    db.aura.groupBy({ by: ["fighterId"], where: { bout: { ...CUENTA, event: { ...CUENTA.event, discipline: d } }, fighter: { listed: true, hiddenAt: null } }, _count: { _all: true }, orderBy: { _count: { fighterId: "desc" } }, take: 6 }),
    db.trainer.findMany({ where: { disciplines: { has: d } }, orderBy: [{ name: "asc" }, { id: "asc" }], take: 6, include: { gym: { select: { name: true } } } }),
  ]);
  const fichas = grupos.length ? await db.fighter.findMany({ where: { id: { in: grupos.map((g) => g.fighterId) } }, select: { id: true, slug: true, firstName: true, lastName: true } }) : [];
  const conAura = grupos.flatMap((g, i) => {
    const f = fichas.find((x) => x.id === g.fighterId);
    return f ? [{ id: f.id, slug: f.slug, name: `${f.firstName} ${f.lastName}`, discipline: d, aura: g._count._all, pos: i + 1 }] : [];
  });
  return (
    <div className="pantalla" style={{ gap: 26 }}>
      <section className="tarjeta-foto" style={{ minHeight: 170, padding: 22, gap: 8, "--tinte": tinteDe(d) } as CSSProperties} aria-labelledby="titulo-disciplina">
        <span className="raya" aria-hidden="true" style={{ display: "block", width: 46, height: 6, borderRadius: 3, background: COLOR_DISCIPLINA[d] }} />
        <h1 id="titulo-disciplina" style={{ margin: 0 }}>{nombre}</h1>
        <p className="meta" style={{ margin: 0, color: "rgba(255,255,255,.85)" }}>Actualidad, veladas, peleadores y entrenadores de {nombre}.</p>
      </section>

      <nav className="filtros-disciplina" aria-label="Otras disciplinas">
        {DISCIPLINE_ORDER.map((x) => <Link key={x} href={`/disciplinas/${DISCIPLINE_SLUG[x]}`} aria-current={x === d ? "page" : undefined}>{DISCIPLINE_LABEL[x]}</Link>)}
      </nav>

      <section aria-labelledby="titulo-noticias-disciplina" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="titulo-seccion"><h2 id="titulo-noticias-disciplina">Actualidad</h2><Link href={`/noticias?disciplina=${DISCIPLINE_SLUG[d]}`}>Más noticias</Link></div>
        {noticias.length ? <ListaNoticias noticias={noticias} /> : <SinNoticias disciplina={nombre} />}
      </section>

      <section aria-labelledby="titulo-veladas-disciplina" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="titulo-seccion"><h2 id="titulo-veladas-disciplina">Próximas veladas</h2><Link href={`/veladas?disciplina=${d}`}>Calendario</Link></div>
        {veladas.length ? <div className="desliza veladas-portada" role="region" tabIndex={0} aria-label={`Próximas veladas de ${nombre} (desliza para ver más)`}>{veladas.map((e) => <TarjetaCartel key={e.id} e={e} />)}</div>
          : <p className="mut" style={{ margin: 0 }}>No hay veladas de {nombre} programadas.</p>}
      </section>

      <section aria-labelledby="titulo-aura-disciplina" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="titulo-seccion"><h2 id="titulo-aura-disciplina">Peleadores con aura</h2><Link href={`/ranking?disciplina=${d}`}>Ránking</Link></div>
        {conAura.length ? <div className="desliza" role="region" tabIndex={0} aria-label={`Peleadores de ${nombre} con aura (desliza para ver más)`}>{conAura.map((f) => <MiniPeleador key={f.id} f={f} />)}</div>
          : <p className="mut" style={{ margin: 0 }}>Todavía no hay aura en combates de {nombre}. <Link href={`/peleadores?disciplina=${d}`}>Ver peleadores</Link></p>}
      </section>

      <section aria-labelledby="titulo-entrenadores-disciplina" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="titulo-seccion"><h2 id="titulo-entrenadores-disciplina">Dónde entrenar</h2><Link href="/entrenadores">Entrenadores</Link></div>
        {entrenadores.length ? <div className="lista">{entrenadores.map((t) => (
          <Link key={t.id} href={`/entrenadores/${t.slug}`} className="fila"><span className="cuerpo"><span className="nombre">{t.name}</span><span className="meta">{[t.gym?.name, t.city, t.province].filter(Boolean).join(" · ") || "Entrenador independiente"}</span></span></Link>
        ))}</div> : <p className="mut" style={{ margin: 0 }}>Todavía no hay entrenadores de {nombre} con perfil. <Link href="/gimnasios">Buscar gimnasios</Link></p>}
      </section>
    </div>
  );
}
