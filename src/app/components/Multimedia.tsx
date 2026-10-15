import { REASONS_BY_ENTITY, REPORT_REASONS } from "../../lib/community/reports";
import { publicFighterName, publicUserName } from "../../lib/common/names";
import { haceTiempo } from "../../lib/common/dates";
import { BotonBloquear } from "./Bloquear";

/** Lo que hace falta de cada peleador para escribir su nombre público (ficha provisional: solo la inicial; oculta: anónimo). */
type FighterDeMedio = { firstName: string; lastName: string; listed: boolean; hiddenAt: Date | null };

/** Un vídeo o una foto del público, con lo necesario para mostrarlo (sin los bytes). */
export type MedioPublico = {
  id: string;
  kind: "PHOTO" | "VIDEO";
  caption: string | null;
  videoKey: string | null;
  videoUrl: string | null;
  createdAt: Date;
  uploaderId: string;
  uploader: { name: string };
  bout: { fighterA: FighterDeMedio; fighterB: FighterDeMedio } | null;
  event?: { name: string; slug: string };
};
const NOMBRE_PUBLICO = { firstName: true, lastName: true, listed: true, hiddenAt: true } as const;

/** Lo que hay que pedir a la base de datos para pintar la galería. */
export const SELECT_MEDIO = {
  id: true, kind: true, caption: true, videoKey: true, videoUrl: true, createdAt: true, uploaderId: true,
  uploader: { select: { name: true } },
  bout: { select: { fighterA: { select: NOMBRE_PUBLICO }, fighterB: { select: NOMBRE_PUBLICO } } },
  event: { select: { name: true, slug: true } },
} as const;

const combate = (m: MedioPublico) => (m.bout ? `${publicFighterName(m.bout.fighterA)} contra ${publicFighterName(m.bout.fighterB)}` /* T-016, C3-02 */ : null);

/**
 * Galería de vídeos y fotos del público (petición del fundador, 8 de octubre de 2026): en la velada, en la ficha de cada peleador y en su
 * panel. Los vídeos y fotos subidos a la aplicación se pueden descargar, para que el peleador tenga las imágenes de su combate.
 * `avisar` es la acción de los avisos (los componentes no importan acciones); sin ella no se muestra el formulario. Con `bloquear` y `yo` (quien
 * mira), cada vídeo o foto ajeno ofrece bloquear a quien lo compartió; lo de personas ya bloqueadas se filtra antes, en la consulta.
 */
export function GaleriaMedios({ medios, avisar, bloquear, yo, back, conVelada = false, ahora = new Date() }: { medios: MedioPublico[]; avisar?: (f: FormData) => Promise<void>; bloquear?: (f: FormData) => Promise<void>; yo?: string; back: string; conVelada?: boolean; ahora?: Date }) {
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
                {m.kind === "VIDEO" && m.videoUrl && <a className="btn secondary" href={m.videoUrl} target="_blank" rel="noopener noreferrer">Ver el vídeo<span className="sr-only">: {titulo}</span> (se abre en otra página web)</a>}
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
              {bloquear && yo && m.uploaderId !== yo && <BotonBloquear accion={bloquear} origen="medio" id={m.id} back={back} nombre={publicUserName(m.uploader.name)} />}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
