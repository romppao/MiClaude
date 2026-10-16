"use client";
import { useEffect, useRef, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { intervaloDe, rutaConRefresco, tocaRefrescar } from "../../lib/common/refresco";

/**
 * Vuelve a pedir al servidor los datos de la pantalla que se está leyendo: al volver a la pestaña, al recuperar la conexión y cada
 * pocos minutos mientras está a la vista. No toca lo que la persona esté escribiendo ni las pantallas con formularios. No pinta nada.
 */
export default function RefrescoVivo() {
  const ruta = usePathname();
  const router = useRouter();
  const [, empezar] = useTransition();
  const ultimo = useRef(Date.now());

  useEffect(() => {
    ultimo.current = Date.now();
    if (!ruta || !rutaConRefresco(ruta)) return;
    const refrescar = () => {
      const activo = document.activeElement;
      if (!tocaRefrescar({
        ahora: Date.now(), ultimo: ultimo.current, visible: document.visibilityState === "visible",
        escribiendo: !!activo && activo.matches("input:not([type=checkbox]):not([type=radio]), textarea, select, [contenteditable=true]"),
        ventanaAbierta: !!document.querySelector("dialog[open]"),
      })) return;
      ultimo.current = Date.now();
      empezar(() => router.refresh());
    };
    const alVolver = () => { if (document.visibilityState === "visible") refrescar(); };
    document.addEventListener("visibilitychange", alVolver);
    window.addEventListener("online", refrescar);
    // Un poco de variación por persona para que miles de pestañas no pidan a la vez.
    const reloj = setInterval(refrescar, intervaloDe(ruta) + Math.round(Math.random() * 10_000));
    return () => { document.removeEventListener("visibilitychange", alVolver); window.removeEventListener("online", refrescar); clearInterval(reloj); };
  }, [ruta, router]);

  return null;
}
