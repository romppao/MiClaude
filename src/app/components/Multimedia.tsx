import { REASONS_BY_ENTITY, REPORT_REASONS } from "../../lib/community/reports";
import { publicUserName } from "../../lib/common/names";
import { haceTiempo } from "../../lib/common/dates";

/** Un vídeo o una foto del público, con lo necesario para mostrarlo (sin los bytes). */
export type MedioPublico = {
  id: string;
  kind: "PHOTO" | "VIDEO";
  caption: string | null;
  videoKey: string | null;
  videoUrl: string | null;
  createdAt: Date;
  uploader: { name: string };
  bout: { fighterA: { firstName: string; lastName: string }; fighterB: { firstName: string; lastName: string } } | null;
  event?: { name: string; slug: string };
};

/** Lo que hay que pedir a la base de datos para pintar la galería. */
export const SELECT_MEDIO = {
  id: true, kind: true, caption: true, videoKey: true, videoUrl: true, createdAt: true,
  uploader: { select: { name: true } },
  bout: { select: { fighterA: { select: { firstName: true, lastName: true } }, fighterB: { select: { firstName: true, lastName: true } } } },
  event: { select: { name: true, slug: true } },
} as const;

const combate = (m: MedioPublico) => (m.bout ? `${m.bout.fighterA.firstName} ${m.bout.fighterA.lastName} contra ${m.bout.fighterB.firstName} ${m.bout.fighterB.lastName}` : null);

/**
 * Galería de vídeos y fotos del público (petición del fundador, 8 de octubre de 2026): en la velada, en la ficha de cada peleador y en su
 * panel. Los vídeos y fotos subidos a la aplicación se pueden descargar, para que el peleador tenga las imágenes de su combate.
 * `avisar` es la acción de los avisos (los componentes no importan acciones); sin ella no se muestra el formulario.
 */
export function GaleriaMedios({ medios, avisar, back, conVelada = false, ahora = new Date() }: { medios: MedioPublico[]; avisar?: (f: FormData) => Promise<void>; back: string; conVelada?: boolean; ahora?: Date }) {
  return (
    <ul className="galeria">
      {medios.map((m) => {
        const titulo = m.caption ?? (m.kind === "PHOTO" ? "Foto del público" : "Vídeo del público");
        const deQue = [conVelada && m.event ? m.event.name : null, combate(m)].filter(Boolean).join(" · ");
        return (
          <li key={m.id} id={`medio-${m.id}`} className="tarjeta medio">
            {m.kind === "PHOTO" ? <img src={`/medios/${m.id}/imagen`} alt={`${titulo}${deQue ? `. ${deQue}` : ""}`} loading="lazy" />
              : m.videoKey ? <video controls preload="metadata" playsInline src={`/medios/${m.id}/video`} aria-label={`${titulo}${deQue ? `. ${deQue}` : ""}`} />
              : null}
            <div className="cuerpo">
              <strong>{titulo}</strong>
              {deQue && <span className="meta">{deQue}</span>}
              <span className="meta">Compartido por {publicUserName(m.uploader.name)} · {haceTiempo(m.createdAt, ahora)}</span>
              <span className="acciones" style={{ margin: 0 }}>
                {m.kind === "PHOTO" && <a className="btn secondary" href={`/medios/${m.id}/imagen?descargar=1`} download>Descargar la foto<span className="sr-only">: {titulo}</span></a>}
                {m.kind === "VIDEO" && m.videoKey && <a className="btn secondary" href={`/medios/${m.id}/video?descargar=1`} download>Descargar el vídeo<span className="sr-only">: {titulo}</span></a>}
                {m.kind === "VIDEO" && m.videoUrl && <a className="btn secondary" href={m.videoUrl} target="_blank" rel="noopener noreferrer">Ver el vídeo<span className="sr-only">: {titulo} (se abre en otra pestaña)</span></a>}
              </span>
              {avisar && (
                <details>
                  <summary className="mut">¿Apareces tú o no debería estar? Avísanos</summary>
                  <form action={avisar} style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                    <input type="hidden" name="entity" value="MEDIA" /><input type="hidden" name="entityId" value={m.id} /><input type="hidden" name="back" value={back} />
                    <select name="reason" aria-label="Motivo del aviso" defaultValue="" required>
                      <option value="" disabled>Motivo…</option>
                      {REASONS_BY_ENTITY.MEDIA.map((k) => <option key={k} value={k}>{REPORT_REASONS[k]}</option>)}
                    </select>
                    <input name="message" aria-label="Detalles (opcional)" placeholder="Detalles (opcional)" maxLength={500} />
                    <button className="secondary">Enviar aviso<span className="sr-only"> sobre {titulo}</span></button>
                  </form>
                </details>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
