"use client";
import { useId, useState } from "react";

/**
 * Campo para elegir una foto sin que la persona tenga que pensar en pesos ni medidas (petición del fundador, 8 de octubre de 2026:
 * una foto del móvil fue rechazada por pesar más de 4 MB y «hay que ponérselo fácil a los usuarios»). El navegador reduce la foto
 * antes de enviarla: la gira según su orientación, la deja en 2000 px como máximo y la guarda como JPEG de calidad alta hasta que
 * pese menos de LIMITE. El servidor sigue comprobando todo (`normalizeImage`); esto solo evita rechazos innecesarios.
 */
const LADO_MAXIMO = 2000;
const LIMITE = 3 * 1024 * 1024;
const mb = (b: number) => `${(b / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;

async function reducir(archivo: File): Promise<File> {
  const imagen = await createImageBitmap(archivo, { imageOrientation: "from-image" });
  try {
    const escala = Math.min(1, LADO_MAXIMO / Math.max(imagen.width, imagen.height));
    const lienzo = document.createElement("canvas");
    lienzo.width = Math.max(1, Math.round(imagen.width * escala));
    lienzo.height = Math.max(1, Math.round(imagen.height * escala));
    const contexto = lienzo.getContext("2d");
    if (!contexto) throw new Error("sin lienzo");
    contexto.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
    for (const calidad of [0.88, 0.8, 0.7, 0.55]) {
      const blob = await new Promise<Blob | null>((ok) => lienzo.toBlob(ok, "image/jpeg", calidad));
      if (blob && (blob.size <= LIMITE || calidad === 0.55)) return new File([blob], archivo.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
    }
    throw new Error("sin imagen");
  } finally {
    imagen.close();
  }
}

/** Lado mayor de la foto; si el navegador no puede leerla devuelve 0 y el servidor decidirá. */
async function ladoMayor(archivo: File): Promise<number> {
  try {
    const imagen = await createImageBitmap(archivo);
    const lado = Math.max(imagen.width, imagen.height);
    imagen.close();
    return lado;
  } catch {
    return 0;
  }
}

export default function InputFoto({ name, id, accept = "image/jpeg,image/png,image/webp", alElegir }: { name: string; id?: string; accept?: string; alElegir?: (archivo: File | null) => void }) {
  const propio = useId();
  const [aviso, setAviso] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [elegida, setElegida] = useState<string | null>(null);

  async function elegir(e: React.ChangeEvent<HTMLInputElement>) {
    const campo = e.currentTarget;
    const archivo = campo.files?.[0];
    setElegida(archivo?.name ?? null);
    if (!archivo) { setAviso(null); alElegir?.(null); return; }
    // Una foto ligera, de medidas razonables y ya en un formato válido se envía tal cual: así no se pierde calidad sin necesidad.
    if (archivo.size <= LIMITE && /^image\/(jpeg|png|webp)$/.test(archivo.type) && (await ladoMayor(archivo)) <= 5000) { setAviso(null); alElegir?.(archivo); return; }
    setAviso({ tipo: "ok", texto: "Preparando la foto…" });
    try {
      const reducida = await reducir(archivo);
      const envio = new DataTransfer();
      envio.items.add(reducida);
      campo.files = envio.files;
      setAviso({ tipo: "ok", texto: `Foto lista (${mb(reducida.size)}). Se ha ajustado sola para que se suba rápido.` });
      alElegir?.(reducida);
    } catch {
      campo.value = "";
      setElegida(null);
      setAviso({ tipo: "error", texto: "No hemos podido leer esa foto. Prueba con otra, o haz una captura de pantalla de ella y elige la captura." });
      alElegir?.(null);
    }
  }

  return (
    <>
      {/* Botón propio en español: el del navegador dice «Choose File / No file chosen» en algunos teléfonos. Va dentro de la etiqueta
          del campo (quien usa este componente lo envuelve en <label>), así que pulsar el botón abre el selector de fotos. */}
      <span className="archivo">
        <input id={id} className="archivo-input" type="file" name={name} accept={accept} onChange={elegir} aria-describedby={`${propio}-estado`} />
        <span className="btn secondary archivo-boton" aria-hidden="true">{elegida ? "Cambiar la foto" : "Elegir una foto"}</span>
        <span className="archivo-nombre" aria-hidden="true">{elegida ?? "Ninguna elegida"}</span>
      </span>
      <span id={`${propio}-estado`} className={aviso?.tipo === "error" ? "hint hint-error" : "hint"} role="status" aria-live="polite">{aviso?.texto}</span>
    </>
  );
}
