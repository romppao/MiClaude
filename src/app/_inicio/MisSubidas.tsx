import Link from "next/link";
import { db } from "../../lib/common/db";
import { haceTiempo } from "../../lib/common/dates";
import { deleteMyMedia } from "../actions/media";

/** «Mis vídeos y fotos» en Mi panel: lo que la persona ha compartido de las veladas, con el enlace a cada una y el botón para borrarlo. */
export default async function MisSubidas({ userId, siempre }: { userId: string; siempre: boolean }) {
  const medios = await db.mediaItem.findMany({ where: { uploaderId: userId }, orderBy: [{ createdAt: "desc" }, { id: "asc" }], take: 50, select: { id: true, kind: true, caption: true, hiddenAt: true, createdAt: true, event: { select: { name: true, slug: true } } } });
  if (!medios.length && !siempre) return null;
  const ahora = new Date();
  return (
    <section id="mis-subidas" aria-labelledby="titulo-mis-subidas" className="pantalla" style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 26 }}>
      <div className="titulo-seccion"><h2 id="titulo-mis-subidas">Mis vídeos y fotos</h2><Link href="/compartir">Subir</Link></div>
      {medios.length ? (
        <ul className="lista" style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {medios.map((m) => {
            const titulo = m.caption ?? (m.kind === "PHOTO" ? "Foto" : "Vídeo");
            return (
              <li key={m.id} className="fila" style={{ flexWrap: "wrap" }}>
                <span className="cuerpo"><Link href={`/veladas/${m.event.slug}#medio-${m.id}`} className="nombre">{titulo}</Link><span className="meta">{m.kind === "PHOTO" ? "Foto" : "Vídeo"} · {m.event.name} · {haceTiempo(m.createdAt, ahora)}{m.hiddenAt ? " · Retirado por moderación" : ""}</span></span>
                <details>
                  <summary className="btn secondary">Borrar<span className="sr-only">: {titulo}</span></summary>
                  <form action={deleteMyMedia} style={{ marginTop: 8 }}><input type="hidden" name="mediaId" value={m.id} /><p className="mut" style={{ margin: "0 0 6px" }}>No se puede deshacer.</p><button>Sí, borrar definitivamente<span className="sr-only">: {titulo}</span></button></form>
                </details>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="tarjeta"><p className="mut" style={{ margin: 0 }}>¿Has grabado un combate? Compártelo para que los peleadores tengan sus imágenes.</p><Link href="/compartir" className="btn secondary" style={{ alignSelf: "flex-start" }}>Subir vídeos o fotos de una velada</Link></div>
      )}
    </section>
  );
}
