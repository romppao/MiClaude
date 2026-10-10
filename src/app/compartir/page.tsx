import Link from "next/link";
import type { Metadata } from "next";
import { db } from "../../lib/common/db";
import { requireUser } from "../../lib/accounts/auth";
import { fmtDate, EVENT_KIND_LABEL } from "../../lib/common/labels";
import { DISCIPLINE_LABEL } from "../../lib/common/disciplines";
import { calendarDayStart, todayMadrid } from "../../lib/common/dates";
import { publicFighterName } from "../../lib/common/names";
import { CONSENTIMIENTO, DIAS_PARA_COMPARTIR, PIE_MAX, veladaAbiertaAlPublico } from "../../lib/media/rules";
import { almacenDeVideos } from "../../lib/media/storage";
import InputFoto from "../components/InputFoto";
import { shareMedia } from "../actions/media";
import SubirVideo from "../components/SubirVideo";

export const metadata: Metadata = { title: "Subir vídeos o fotos", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const MOTIVO = { futura: "Esta velada todavía no se ha celebrado: podrás compartir tus vídeos y fotos a partir del mismo día.", cancelada: "Esta velada se canceló, así que no admite vídeos ni fotos.", antigua: "Esta velada es de hace más de cuatro meses y ya no admite vídeos ni fotos nuevos." } as const;

/**
 * Compartir lo grabado en una velada (petición del fundador, 8 de octubre de 2026). Paso 1: elegir la velada. Paso 2: una foto o un vídeo
 * (subido de verdad o, si no se puede, un enlace), el combate si se sabe y la confirmación de que se puede compartir.
 */
export default async function Compartir({ searchParams }: { searchParams: Promise<{ velada?: string; q?: string }> }) {
  const { velada = "", q = "" } = await searchParams;
  const user = await requireUser(`/compartir${velada ? `?velada=${encodeURIComponent(velada)}` : ""}`);
  const e = velada ? await db.event.findUnique({ where: { slug: velada }, include: { bouts: { orderBy: { order: "asc" }, include: { fighterA: true, fighterB: true } } } }) : null;

  if (!e) {
    const desde = new Date(calendarDayStart().getTime() - DIAS_PARA_COMPARTIR * 864e5);
    const texto = q.trim().slice(0, 80);
    const veladas = await db.event.findMany({
      where: { date: { gte: desde, lt: new Date(calendarDayStart().getTime() + 864e5) }, status: { not: "CANCELLED" }, ...(texto && { OR: [{ name: { contains: texto, mode: "insensitive" } }, { city: { contains: texto, mode: "insensitive" } }] }) },
      orderBy: [{ date: "desc" }, { id: "asc" }],
      take: 30,
    });
    return (
      <div className="pantalla pantalla-formulario" style={{ gap: 18 }}>
        <div><h1>Subir vídeos o fotos de una velada</h1><p className="lead" style={{ fontSize: 16 }}>Comparte lo que grabaste para que los peleadores tengan las imágenes de sus combates. Primero, elige la velada.</p></div>
        {velada && <div className="notice notice-bad" role="alert"><span aria-hidden="true">⚠ </span>No encontramos esa velada. Búscala en la lista.</div>}
        <form role="search" aria-label="Buscar la velada" className="search" style={{ alignItems: "flex-end" }}>
          <label className="field" style={{ flex: 1, minWidth: 200 }}><span>Nombre o ciudad de la velada</span><input name="q" defaultValue={texto} maxLength={80} /></label>
          <button className="secondary">Buscar la velada</button>
        </form>
        {veladas.length ? (
          <nav className="lista" aria-label="Veladas de los últimos meses">
            {veladas.map((v) => <Link key={v.id} href={`/compartir?velada=${v.slug}`} className="fila"><span className="cuerpo"><span className="nombre">{v.name}</span><span className="meta">{EVENT_KIND_LABEL[v.kind]} · {fmtDate(v.date)} · {v.city} · {DISCIPLINE_LABEL[v.discipline]}</span></span></Link>)}
          </nav>
        ) : <p className="mut">{texto ? "No hay veladas de los últimos cuatro meses con ese nombre o ciudad." : "No hay veladas celebradas en los últimos cuatro meses."} Si la velada no está en Ring España, su organizador puede publicarla, o puedes buscarla en el <Link href="/veladas">calendario</Link>.</p>}
      </div>
    );
  }

  const estado = veladaAbiertaAlPublico(e, todayMadrid());
  const almacen = almacenDeVideos();
  return (
    <div className="pantalla pantalla-formulario" style={{ gap: 18 }}>
      <p style={{ margin: 0 }}><Link href="/compartir">← Elegir otra velada</Link></p>
      <div><h1>Subir vídeos o fotos</h1><p className="lead" style={{ fontSize: 16 }}>{e.name} · {fmtDate(e.date)} · {e.city}</p></div>
      {estado !== "ok" ? <div className="notice notice-bad" role="alert"><span aria-hidden="true">⚠ </span>{MOTIVO[estado]}</div>
        : !user.emailVerifiedAt ? <div className="notice notice-bad"><span aria-hidden="true">⚠ </span>Para compartir vídeos y fotos, primero <Link href="/verificar">confirma tu correo electrónico</Link>.</div>
        : (
          <form action={shareMedia} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <input type="hidden" name="eventId" value={e.id} />
            {e.bouts.length > 0 && (
              <label className="field"><span>¿De qué combate es? (opcional)</span>
                <select name="boutId" defaultValue=""><option value="">De la velada en general</option>{e.bouts.map((b) => <option key={b.id} value={b.id}>{publicFighterName(b.fighterA)} contra {publicFighterName(b.fighterB)}</option>)}</select>
                <span className="hint">Si eliges el combate, también aparecerá en la ficha de los dos peleadores.</span>
              </label>
            )}
            <fieldset className="tarjeta" style={{ margin: 0 }}>
              <legend className="leyenda">Una foto</legend>
              <label className="field"><span>Elige una foto de tu móvil o de tu ordenador</span><InputFoto name="image" /></label>
            </fieldset>
            <fieldset className="tarjeta" style={{ margin: 0 }}>
              <legend className="leyenda">O un vídeo</legend>
              <SubirVideo disponible={!!almacen} maxBytes={almacen?.maxBytes ?? 0} />
              <label className="field"><span>{almacen ? "Si ya está en internet, pega su enlace en lugar de subirlo" : "Enlace del vídeo (YouTube, Instagram, TikTok…)"}</span><input name="videoUrl" type="url" inputMode="url" maxLength={500} placeholder="https://…" /></label>
              {almacen?.tipo === "disco" && <p className="mut" style={{ margin: 0 }}>Versión de prueba: los vídeos subidos aquí se guardan en el servidor de pruebas y pueden borrarse.</p>}
            </fieldset>
            <label className="field"><span>Descripción (opcional)</span><input name="caption" maxLength={PIE_MAX} placeholder="Por ejemplo: tercer asalto, desde la grada" /></label>
            <label className="field" style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
              <input type="checkbox" name="consentimiento" required style={{ width: 24, height: 24, flex: "none" }} />
              <span>{CONSENTIMIENTO}</span>
            </label>
            <button className="btn-grande">Compartir en la velada</button>
            <p className="mut" style={{ margin: 0 }}>Se verá en la página de la velada{e.bouts.length ? " y, si eliges el combate, en la ficha de los peleadores" : ""}. Puedes borrarlo cuando quieras desde <Link href="/mi-panel#mis-subidas">Mi panel</Link>.</p>
          </form>
        )}
    </div>
  );
}
