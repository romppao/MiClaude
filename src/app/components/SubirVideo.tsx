"use client";

import { useEffect, useRef, useState } from "react";

type Estado = { fase: "nada" } | { fase: "subiendo"; pct: number; nombre: string } | { fase: "listo"; nombre: string; clave: string } | { fase: "error"; mensaje: string };

const TIPOS = ["video/mp4", "video/quicktime", "video/webm"];
const mb = (b: number) => `${(b / 1024 / 1024).toFixed(b < 10 * 1024 * 1024 ? 1 : 0)} MB`;

/**
 * Saca un fotograma del vídeo (hacia el primer tercio, como mucho en el segundo 1) para usarlo de portada. Devuelve null si el navegador
 * no puede decodificar el vídeo: entonces la ficha enseña un fotograma del propio vídeo al mostrarlo.
 */
async function fotograma(archivo: File): Promise<File | null> {
  const url = URL.createObjectURL(archivo);
  const video = document.createElement("video");
  const esperar = (evento: string, ms: number) => new Promise<void>((ok, mal) => {
    const t = setTimeout(() => mal(new Error(evento)), ms);
    video.addEventListener(evento, () => { clearTimeout(t); ok(); }, { once: true });
    video.addEventListener("error", () => { clearTimeout(t); mal(new Error("error")); }, { once: true });
  });
  try {
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.src = url;
    const datos = esperar("loadeddata", 10000);
    video.load();
    // Safari en iPhone no decodifica nada hasta que el vídeo empieza a reproducirse (en silencio está permitido).
    video.play().then(() => video.pause(), () => {});
    await datos;
    const momento = Math.min(1, (Number.isFinite(video.duration) ? video.duration : 3) / 3);
    const buscado = esperar("seeked", 6000);
    video.currentTime = momento;
    await buscado;
    if (!video.videoWidth || !video.videoHeight) return null;
    const escala = Math.min(1, 1280 / Math.max(video.videoWidth, video.videoHeight));
    const lienzo = document.createElement("canvas");
    lienzo.width = Math.round(video.videoWidth * escala);
    lienzo.height = Math.round(video.videoHeight * escala);
    lienzo.getContext("2d")?.drawImage(video, 0, 0, lienzo.width, lienzo.height);
    const blob = await new Promise<Blob | null>((ok) => lienzo.toBlob(ok, "image/jpeg", 0.85));
    return blob ? new File([blob], "portada.jpg", { type: "image/jpeg" }) : null;
  } catch {
    return null;
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}

/**
 * Sube un vídeo de verdad a la aplicación (petición del fundador): pide una dirección de subida a /subidas, envía el archivo con su barra de
 * progreso y deja su clave en un campo oculto («videoKey») para que el formulario lo publique. Mientras sube, el formulario no se envía.
 * Si las subidas no están disponibles, lo dice y deja el campo de enlace como alternativa.
 * Con `portada` (el nombre del campo de foto del mismo formulario), pone un fotograma del vídeo como portada si la persona no ha elegido
 * otra foto (petición del fundador, 8 de octubre de 2026: «los highlights carecen de portada»).
 */
export default function SubirVideo({ disponible, maxBytes, id = "video-archivo", portada }: { disponible: boolean; maxBytes: number; id?: string; portada?: string }) {
  const [estado, setEstado] = useState<Estado>({ fase: "nada" });
  const [miniatura, setMiniatura] = useState<string | null>(null);
  const [listoParaUsar, setListo] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const xhr = useRef<XMLHttpRequest | null>(null);
  useEffect(() => setListo(true), []);

  // No dejar enviar el formulario a medio subir: se perdería el vídeo.
  useEffect(() => {
    const form = raiz.current?.closest("form");
    if (!form) return;
    const frenar = (e: Event) => {
      if (form.dataset.subiendo === "1") {
        e.preventDefault();
        e.stopImmediatePropagation();
        raiz.current?.querySelector<HTMLElement>("[data-aviso-subida]")?.focus();
      }
    };
    form.addEventListener("submit", frenar, true);
    return () => form.removeEventListener("submit", frenar, true);
  }, []);
  useEffect(() => {
    const form = raiz.current?.closest("form");
    if (form) form.dataset.subiendo = estado.fase === "subiendo" ? "1" : "";
  }, [estado.fase]);

  /** Pone el fotograma en el campo de foto, salvo que la persona haya elegido una foto suya. */
  // Cada vídeo elegido tiene su número: si la persona cambia de vídeo mientras se saca el fotograma del anterior, ese resultado se descarta.
  const peticion = useRef(0);
  const campoPortada = () => (portada ? raiz.current?.closest("form")?.querySelector<HTMLInputElement>(`input[type=file][name="${portada}"]`) ?? null : null);
  const esFotoPropia = (c: HTMLInputElement) => !!c.files?.length && c.dataset.automatica !== "1";
  const quitarMiniatura = () => setMiniatura((anterior) => { if (anterior) URL.revokeObjectURL(anterior); return null; });
  useEffect(() => () => { setMiniatura((anterior) => { if (anterior) URL.revokeObjectURL(anterior); return null; }); }, []);

  /** Quita la portada automática (si la había) del campo de foto: al quitar el vídeo no debe publicarse un fotograma suyo. */
  function quitarPortadaAutomatica() {
    const campo = campoPortada();
    if (campo?.dataset.automatica === "1") { campo.value = ""; campo.dataset.automatica = ""; }
    quitarMiniatura();
  }

  async function ponerPortada(archivo: File) {
    const n = ++peticion.current;
    const campo = campoPortada();
    if (!campo || esFotoPropia(campo)) return;
    const imagen = await fotograma(archivo);
    // Se vuelve a comprobar tras la espera: la persona pudo elegir su propia foto, u otro vídeo, mientras tanto.
    if (!imagen || n !== peticion.current || esFotoPropia(campo)) return;
    const lista = new DataTransfer();
    lista.items.add(imagen);
    campo.files = lista.files;
    campo.dataset.automatica = "1";
    // Si después la persona elige otra foto, deja de ser la automática.
    campo.addEventListener("change", () => { campo.dataset.automatica = ""; quitarMiniatura(); }, { once: true });
    setMiniatura((anterior) => { if (anterior) URL.revokeObjectURL(anterior); return URL.createObjectURL(imagen); });
  }

  async function elegir(archivo: File | undefined) {
    xhr.current?.abort();
    peticion.current++;
    if (!archivo) { quitarPortadaAutomatica(); return setEstado({ fase: "nada" }); }
    if (!TIPOS.includes(archivo.type)) return setEstado({ fase: "error", mensaje: "Formato no admitido: elige un vídeo MP4, MOV o WebM." });
    if (archivo.size > maxBytes) return setEstado({ fase: "error", mensaje: `Este vídeo pesa ${mb(archivo.size)} y el máximo es ${mb(maxBytes)}. Recórtalo en el móvil o pega un enlace.` });
    void ponerPortada(archivo);
    setEstado({ fase: "subiendo", pct: 0, nombre: archivo.name });
    try {
      const r = await fetch("/subidas", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ tipo: archivo.type, bytes: archivo.size }) });
      const datos = (await r.json().catch(() => ({}))) as { error?: string; clave?: string; url?: string; cabeceras?: Record<string, string> };
      if (!r.ok || !datos.clave || !datos.url) return setEstado({ fase: "error", mensaje: datos.error ?? "No se ha podido preparar la subida. Inténtalo de nuevo." });
      const peticion = new XMLHttpRequest();
      xhr.current = peticion;
      peticion.open("PUT", datos.url);
      for (const [k, v] of Object.entries(datos.cabeceras ?? {})) peticion.setRequestHeader(k, v);
      peticion.upload.onprogress = (e) => e.lengthComputable && setEstado({ fase: "subiendo", pct: Math.round((e.loaded / e.total) * 100), nombre: archivo.name });
      peticion.onload = () => setEstado(peticion.status >= 200 && peticion.status < 300 ? { fase: "listo", nombre: archivo.name, clave: datos.clave! } : { fase: "error", mensaje: "La subida no se ha completado. Comprueba tu conexión e inténtalo de nuevo." });
      peticion.onerror = () => setEstado({ fase: "error", mensaje: "Se ha cortado la conexión mientras subía el vídeo. Inténtalo de nuevo." });
      peticion.send(archivo);
    } catch {
      setEstado({ fase: "error", mensaje: "No se ha podido subir el vídeo. Comprueba tu conexión e inténtalo de nuevo." });
    }
  }

  if (!disponible) return <p className="mut" style={{ margin: 0 }}>Ahora mismo no se pueden subir vídeos a la aplicación: pega abajo un enlace de YouTube, Instagram o TikTok.</p>;
  return (
    <div ref={raiz} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label className="field" htmlFor={id}><span>Vídeo desde tu móvil u ordenador</span>
        <span className="archivo">
          <input id={id} className="archivo-input" type="file" accept="video/mp4,video/quicktime,video/webm" disabled={!listoParaUsar} onChange={(e) => elegir(e.currentTarget.files?.[0])} aria-describedby={`${id}-ayuda`} />
          <span className="btn secondary archivo-boton" aria-hidden="true">{estado.fase === "nada" || estado.fase === "error" ? "Elegir un vídeo" : "Cambiar el vídeo"}</span>
          <span className="archivo-nombre" aria-hidden="true">{estado.fase === "subiendo" || estado.fase === "listo" ? estado.nombre : "Ninguno elegido"}</span>
        </span>
      </label>
      <span id={`${id}-ayuda`} className="hint">MP4, MOV o WebM, hasta {mb(maxBytes)}. Se sube mientras rellenas el resto.</span>
      <input type="hidden" name="videoKey" value={estado.fase === "listo" ? estado.clave : ""} />
      <div role="status" aria-live="polite" data-aviso-subida tabIndex={-1}>
        {estado.fase === "subiendo" && <><progress max={100} value={estado.pct} style={{ width: "100%" }} aria-label="Progreso de la subida" /> Subiendo «{estado.nombre}»: {estado.pct} %. Espera a que termine para publicarlo.</>}
        {estado.fase === "listo" && <><span aria-hidden="true">✓ </span>Vídeo subido: «{estado.nombre}». Ya puedes publicarlo.</>}
      </div>
      {miniatura && <div className="portada-elegida"><img src={miniatura} alt="Portada sacada del vídeo" /><span className="hint">Esta será la portada en tu ficha. Si prefieres otra, elige una foto abajo.</span></div>}
      {estado.fase === "error" && <p role="alert" className="notice notice-bad" style={{ margin: 0 }}><span aria-hidden="true">⚠ </span>{estado.mensaje}</p>}
    </div>
  );
}
