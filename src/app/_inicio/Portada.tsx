import Link from "next/link";
import type { Discipline } from "@prisma/client";
import { db } from "../../lib/common/db";
import { DISCIPLINE_LABEL, DISCIPLINE_ORDER, DISCIPLINE_SLUG } from "../../lib/common/disciplines";
import { ultimasNoticias } from "../../lib/news/feed";
import { FilaNoticias, NoticiaDestacada, SinNoticias } from "../components/Noticias";
import { MiniPeleador, TarjetaCartel } from "../components/Tarjetas";
import Icono from "../components/Icono";
import IconoDisciplina from "../components/IconoDisciplina";
import CentrarActivo from "../components/CentrarActivo";
import { peleadoresConAura, proximasVeladas } from "./datos";

/**
 * Portada de actualidad (petición del fundador, 8 de octubre de 2026): la pantalla inicial reúne las noticias de todos los deportes
 * («todo generalizado») y, al elegir un deporte, se abre «otra pantalla como la inicial, pero exclusivamente de esa disciplina».
 * Por eso las dos son este mismo componente: sin `disciplina` es la portada común (/), con ella la de cada disciplina (/disciplinas/…).
 * Mismo orden y mismo trato para todas las disciplinas.
 */
export default async function Portada({ disciplina, cabecera, despuesDeNoticias, primero = [] }: { disciplina?: Discipline; cabecera: React.ReactNode; despuesDeNoticias?: React.ReactNode; primero?: Discipline[] }) {
  // Las disciplinas que eligió la persona van primero en el selector; el resto, en el orden de siempre.
  const orden = [...DISCIPLINE_ORDER.filter((d) => primero.includes(d)), ...DISCIPLINE_ORDER.filter((d) => !primero.includes(d))];
  const nombre = disciplina ? DISCIPLINE_LABEL[disciplina] : null;
  const [noticias, veladas, conAura, entrenadores] = await Promise.all([
    ultimasNoticias({ disciplina, max: 13 }),
    proximasVeladas(6, disciplina),
    peleadoresConAura(6, disciplina),
    disciplina ? db.trainer.findMany({ where: { disciplines: { has: disciplina } }, orderBy: [{ name: "asc" }, { id: "asc" }], take: 6, include: { gym: { select: { name: true } } } }) : Promise.resolve([]),
  ]);
  const [destacada, ...resto] = noticias;
  const de = nombre ? ` de ${nombre}` : "";
  const masNoticias = disciplina ? `/noticias?disciplina=${DISCIPLINE_SLUG[disciplina]}` : "/noticias";
  return (
    <div className="pantalla inicio-adaptable" style={{ gap: 26 }}>
      {cabecera}

      <nav className="filtros-disciplina desliza-fila con-dibujo" aria-label="Elige un deporte">
        <Link href="/" aria-current={!disciplina ? "page" : undefined}><Icono nombre="capas" tam={28} grosor={1.6} />Todos</Link>
        {orden.map((d) => <Link key={d} href={`/disciplinas/${DISCIPLINE_SLUG[d]}`} aria-current={d === disciplina ? "page" : undefined}><IconoDisciplina d={d} tam={30} grosor={1.6} />{DISCIPLINE_LABEL[d]}</Link>)}
      </nav>
      {disciplina && <CentrarActivo fila="Elige un deporte" />}

      <section aria-labelledby="titulo-actualidad" className="portada-actualidad" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="titulo-seccion"><h2 id="titulo-actualidad">{nombre ? `Actualidad${de}` : "Actualidad"}</h2><Link href={masNoticias}>Todas las noticias</Link></div>
        {destacada ? <><NoticiaDestacada n={destacada} />{resto.length > 0 && <FilaNoticias noticias={resto} etiqueta={`Más noticias${de}`} />}</> : <SinNoticias disciplina={nombre ?? undefined} />}
      </section>

      {despuesDeNoticias}

      <section aria-labelledby="titulo-veladas-portada" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="titulo-seccion"><h2 id="titulo-veladas-portada">Próximas veladas</h2><Link href={disciplina ? `/veladas?disciplina=${disciplina}` : "/veladas"}>Calendario</Link></div>
        {veladas.length ? <div className="desliza veladas-portada" role="region" tabIndex={0} aria-label={`Próximas veladas${de} (desliza para ver más)`}>{veladas.map((e) => <TarjetaCartel key={e.id} e={e} />)}</div>
          : <p className="mut" style={{ margin: 0 }}>No hay veladas{de} programadas. <Link href="/veladas">Ver todo el calendario</Link></p>}
      </section>

      <section aria-labelledby="titulo-aura-portada" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="titulo-seccion"><h2 id="titulo-aura-portada">Peleadores con aura</h2><Link href={disciplina ? `/ranking?disciplina=${disciplina}` : "/ranking"}>Ránking</Link></div>
        {conAura.length ? <div className="desliza" role="region" tabIndex={0} aria-label={`Peleadores${de} con aura (desliza para ver más)`}>{conAura.map((f) => <MiniPeleador key={f.id} f={f} />)}</div>
          : <p className="mut" style={{ margin: 0 }}>Todavía no hay aura en combates{de}. <Link href={disciplina ? `/peleadores?disciplina=${disciplina}` : "/peleadores"}>Ver peleadores</Link></p>}
      </section>

      {disciplina && (
        <section aria-labelledby="titulo-entrenadores-portada" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="titulo-seccion"><h2 id="titulo-entrenadores-portada">Dónde entrenar</h2><Link href="/entrenadores">Entrenadores</Link></div>
          {entrenadores.length ? <div className="lista">{entrenadores.map((t) => (
            <Link key={t.id} href={`/entrenadores/${t.slug}`} className="fila"><span className="cuerpo"><span className="nombre">{t.name}</span><span className="meta">{[t.gym?.name, t.city, t.province].filter(Boolean).join(" · ") || "Entrenador independiente"}</span></span></Link>
          ))}</div> : <p className="mut" style={{ margin: 0 }}>Todavía no hay entrenadores de {nombre} con perfil. <Link href="/gimnasios">Buscar gimnasios</Link></p>}
        </section>
      )}
    </div>
  );
}
