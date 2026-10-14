"use client";

import { useEffect } from "react";
import { CLAVE_TEMA } from "./SelectorTema";

/**
 * Mantiene el tema elegido en <html data-tema> (14 de octubre de 2026). El guion TEMA_INICIAL de layout.tsx lo pone antes de pintar,
 * pero si React vuelve a pintar <html> al cargar (por ejemplo, tras un error de hidratación), el atributo desaparece y la página
 * vuelve al tema del sistema. Aquí se vuelve a aplicar al montar y cada vez que alguien lo quite, mientras siga guardado.
 * Fallo encontrado en el CI: «la elección se recuerda al volver» y servicios.mjs fallaban a ratos en la máquina lenta.
 */
export default function TemaPersistente() {
  useEffect(() => {
    const html = document.documentElement;
    const aplicar = () => {
      let guardado: string | null = null;
      try { guardado = localStorage.getItem(CLAVE_TEMA); } catch {}
      if ((guardado === "claro" || guardado === "oscuro") && html.dataset.tema !== guardado) html.dataset.tema = guardado;
    };
    aplicar();
    const vigia = new MutationObserver(aplicar);
    vigia.observe(html, { attributes: true, attributeFilter: ["data-tema"] });
    return () => vigia.disconnect();
  }, []);
  return null;
}
