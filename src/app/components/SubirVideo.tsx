"use client";

import { useEffect, useRef, useState } from "react";

type Estado = { fase: "nada" } | { fase: "subiendo"; pct: number; nombre: string } | { fase: "listo"; nombre: string; clave: string } | { fase: "error"; mensaje: string };

const TIPOS = ["video/mp4", "video/quicktime", "video/webm"];
const mb = (b: number) => `${(b / 1024 / 1024).toFixed(b < 10 * 1024 * 1024 ? 1 : 0)} MB`;

/**
 * Sube un vídeo de verdad a la aplicación (petición del fundador): pide una dirección de subida a /subidas, envía el archivo con su barra de
 * progreso y deja su clave en un campo oculto («videoKey») para que el formulario lo publique. Mientras sube, el formulario no se envía.
 * Si las subidas no están disponibles, lo dice y deja el campo de enlace como alternativa.
 */
export default function SubirVideo({ disponible, maxBytes, id = "video-archivo" }: { disponible: boolean; maxBytes: number; id?: string }) {
  const [estado, setEstado] = useState<Estado>({ fase: "nada" });
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

  async function elegir(archivo: File | undefined) {
    xhr.current?.abort();
    if (!archivo) return setEstado({ fase: "nada" });
    if (!TIPOS.includes(archivo.type)) return setEstado({ fase: "error", mensaje: "Formato no admitido: elige un vídeo MP4, MOV o WebM." });
    if (archivo.size > maxBytes) return setEstado({ fase: "error", mensaje: `Este vídeo pesa ${mb(archivo.size)} y el máximo es ${mb(maxBytes)}. Recórtalo en el móvil o pega un enlace.` });
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
      <label className="field" htmlFor={id}><span>Vídeo desde tu móvil u ordenador</span></label>
      <input id={id} type="file" accept="video/mp4,video/quicktime,video/webm" disabled={!listoParaUsar} onChange={(e) => elegir(e.currentTarget.files?.[0])} aria-describedby={`${id}-ayuda`} />
      <span id={`${id}-ayuda`} className="hint">MP4, MOV o WebM, hasta {mb(maxBytes)}. Se sube mientras rellenas el resto.</span>
      <input type="hidden" name="videoKey" value={estado.fase === "listo" ? estado.clave : ""} />
      <div role="status" aria-live="polite" data-aviso-subida tabIndex={-1}>
        {estado.fase === "subiendo" && <><progress max={100} value={estado.pct} style={{ width: "100%" }} aria-label="Progreso de la subida" /> Subiendo «{estado.nombre}»: {estado.pct} %. Espera a que termine para publicarlo.</>}
        {estado.fase === "listo" && <><span aria-hidden="true">✓ </span>Vídeo subido: «{estado.nombre}». Ya puedes publicarlo.</>}
      </div>
      {estado.fase === "error" && <p role="alert" className="notice notice-bad" style={{ margin: 0 }}><span aria-hidden="true">⚠ </span>{estado.mensaje}</p>}
    </div>
  );
}
