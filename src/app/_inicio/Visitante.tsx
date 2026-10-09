import Link from "next/link";
import { AccionesPrincipales } from "./comun";
import { DISCIPLINE_ORDER, DISCIPLINE_SLUG } from "../../lib/common/disciplines";
import { ultimasNoticias } from "../../lib/news/feed";
import { FilaNoticias, NoticiaDestacada, SinNoticias } from "../components/Noticias";
import Icono from "../components/Icono";
import { MiniPeleador, TarjetaCartel, TarjetaDisciplina } from "../components/Tarjetas";
import { peleadoresConAura, proximasVeladas } from "./datos";

/** Inicio del visitante sin cuenta (diseño v3, «homeVisit»): portada pública, actualidad de todos los deportes, disciplinas, veladas y una invitación por tipo de cuenta. */
export default async function InicioVisitante() {
  const [veladas, conAura, noticias] = await Promise.all([proximasVeladas(6), peleadoresConAura(6), ultimasNoticias({ max: 5 })]);
  return (
    <div className="pantalla" style={{ gap: 30 }}>
      <section className="portada-visita a-sangre" aria-labelledby="titulo-portada" style={{ marginTop: -20 }}>
        <div className="solo-movil" style={{ position: "absolute", top: 18, right: 24 }}>
          <Link href="/entrar" className="btn" style={{ minHeight: 44 }}>Entrar</Link>
        </div>
        <h1 id="titulo-portada">Tu deporte.<br /><span className="acc">Tu gente.</span></h1>
        {/* Debajo del lema, una sola frase (petición del fundador, 9 de octubre de 2026: el texto de debajo se veía «muy cargado»). */}
        <p className="lema-portada">Tu comunidad de deportes de contacto en toda España.</p>
        <p className="sr-only">Imagen ilustrativa con personas ficticias.</p>
        <form action="/buscar" role="search" aria-label="Buscar en Ring España" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label htmlFor="buscar-portada" className="etiqueta-portada">Busca peleadores, gimnasios o veladas</label>
          <span className="buscador-cristal">
            <Icono nombre="buscar" tam={20} grosor={1.8} />
            <input id="buscar-portada" name="q" maxLength={80} placeholder="Nombre o ciudad" />
            <button className="secondary">Buscar</button>
          </span>
        </form>
      </section>

      {/* Lo que se puede hacer, nada más entrar (petición del fundador, 8 de octubre de 2026: los servicios estaban muy abajo). */}
      <section aria-labelledby="empezar" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 id="empezar" style={{ fontSize: 24 }}>¿Qué quieres hacer?</h2>
        <AccionesPrincipales acciones={[
          { href: "/clases", titulo: "Buscar clases", detalle: "Con entrenadores de toda España", icono: "calendario" },
          { href: "/peleadores", titulo: "Encontrar un peleador", detalle: "Récord y combates", icono: "buscar" },
          { href: "/veladas", titulo: "Veladas y resultados", detalle: "Cartel de cada evento", icono: "trofeo" },
          { href: "/gimnasios", titulo: "Dónde entrenar", detalle: "Gimnasios y clubes", icono: "gimnasio" },
          { href: "/mi-ficha", titulo: "Crear mi ficha de peleador", detalle: "Lleva tu trayectoria", icono: "mas" },
          { href: "/organizador", titulo: "Organizar una velada", detalle: "Promotoras y clubes", icono: "personas" },
        ]} />
      </section>

      <div className="acciones" style={{ margin: 0 }}>
        <Link href="/registro" className="btn btn-grande" style={{ flex: "1 1 180px", width: "auto" }}>Crear mi cuenta</Link>
        <Link href="/ayuda" className="btn secondary" style={{ flex: "1 1 180px", minHeight: 58 }}>Ver cómo funciona</Link>
      </div>

      <section aria-labelledby="titulo-actualidad-visita" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="titulo-seccion"><h2 id="titulo-actualidad-visita">Actualidad</h2><Link href="/noticias">Todas las noticias</Link></div>
        {noticias.length ? <><NoticiaDestacada n={noticias[0]} />{noticias.length > 1 && <FilaNoticias noticias={noticias.slice(1)} etiqueta="Más noticias" />}</> : <SinNoticias />}
      </section>

      <section aria-labelledby="titulo-disciplinas" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div><h2 id="titulo-disciplinas" style={{ fontSize: 24 }}>Elige tu disciplina</h2><p className="lead" style={{ fontSize: 16 }}>Actualidad, peleadores, veladas y gimnasios de cada disciplina, con el mismo trato para todas.</p></div>
        {/* En una fila que se desliza (revisión del 8 de octubre de 2026: seis tarjetas grandes alargaban mucho la portada en el móvil). */}
        <div className="desliza disciplinas-portada" role="region" tabIndex={0} aria-label="Disciplinas (desliza para ver más)">{DISCIPLINE_ORDER.map((d) => <TarjetaDisciplina key={d} d={d} href={`/disciplinas/${DISCIPLINE_SLUG[d]}`} pequena />)}</div>
      </section>

      <section aria-labelledby="titulo-veladas" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="titulo-seccion"><h2 id="titulo-veladas">Próximas veladas</h2><Link href="/veladas">Calendario</Link></div>
        {veladas.length ? <div className="desliza veladas-portada" role="region" tabIndex={0} aria-label="Próximas veladas (desliza para ver más)">{veladas.map((e) => <TarjetaCartel key={e.id} e={e} />)}</div>
          : <p className="mut">No hay veladas programadas. <Link href="/veladas">Ver todo el calendario</Link></p>}
      </section>

      <section aria-labelledby="titulo-aura" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="titulo-seccion"><h2 id="titulo-aura">Peleadores con aura</h2><Link href="/ranking">Ránking</Link></div>
        {conAura.length ? <div className="desliza" role="region" tabIndex={0} aria-label="Peleadores con aura (desliza para ver más)">{conAura.map((f) => <MiniPeleador key={f.id} f={f} />)}</div>
          : <p className="mut">Todavía no hay aura. Si has visto un combate, puedes ser la primera persona en reconocerlo.</p>}
        <p className="mut" style={{ margin: 0 }}>El aura es el reconocimiento del público: <Link href="/ayuda#aura">cómo funciona</Link>.</p>
      </section>


      <section className="tarjeta tarjeta-violeta anillo" aria-labelledby="titulo-compites" style={{ padding: 22, gap: 12 }}>
        <h2 id="titulo-compites" style={{ font: "800 26px/1.05 var(--font)", letterSpacing: "-.03em" }}>¿Compites?<br />Lleva tu trayectoria.</h2>
        <p style={{ margin: 0, font: "500 16px/1.45 var(--font)", maxWidth: 280 }}>Crea tu ficha, registra tus combates y recibe el aura del público.</p>
        <Link href="/registro?tipo=peleador" className="btn btn-negro" style={{ alignSelf: "flex-start" }}>Crear mi ficha</Link>
      </section>

      <Link href="/entrenadores" className="tarjeta-foto" style={{ minHeight: 210, padding: 20, gap: 6, alignItems: "flex-start", ["--tinte" as string]: "rgba(134,200,255,.35)" }}>
        <span className="pildora pildora-acc">Clases privadas</span>
        <strong style={{ font: "800 24px/1.08 var(--font)", letterSpacing: "-.03em" }}>Entrena con quien sabe</strong>
        <span className="meta" style={{ color: "rgba(255,255,255,.8)" }}>Entrenadores de todas las disciplinas, cerca de ti.</span>
      </Link>

      <Link href="/registro?tipo=entrenador" className="fila" style={{ padding: 18, borderRadius: 26 }}>
        <span className="cuerpo"><span style={{ font: "700 17px var(--font)" }}>¿Das clases?</span><span className="meta">Promociónate y publica tus clases privadas.</span></span>
        <span className="avatar avatar-relleno" aria-hidden="true" style={{ width: 48, height: 48 }}><Icono nombre="flecha" /></span>
      </Link>
      <Link href="/registro?tipo=entidad" className="fila" style={{ padding: 18, borderRadius: 26 }}>
        <span className="cuerpo"><span style={{ font: "700 17px var(--font)" }}>¿Organizas veladas?</span><span className="meta">Promotoras, federaciones y clubes: carteles y resultados.</span></span>
        <span className="avatar avatar-relleno" aria-hidden="true" style={{ width: 48, height: 48 }}><Icono nombre="flecha" /></span>
      </Link>
    </div>
  );
}
