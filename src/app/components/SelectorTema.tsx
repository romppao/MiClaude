"use client";

import { useEffect, useState } from "react";

/**
 * Tema claro u oscuro (petición del fundador, 13 de octubre de 2026). Por defecto se sigue el del sistema;
 * si la persona elige uno, se guarda solo en este navegador (es una comodidad, no un dato de la cuenta) y se marca
 * en <html data-tema>. El guion de layout.tsx (TEMA_INICIAL) lo aplica antes de pintar para que no haya parpadeo.
 */
export const CLAVE_TEMA = "lona:tema";
type Tema = "sistema" | "claro" | "oscuro";
const OPCIONES: { valor: Tema; texto: string }[] = [
  { valor: "sistema", texto: "Automático" },
  { valor: "claro", texto: "Claro" },
  { valor: "oscuro", texto: "Oscuro" },
];

export default function SelectorTema() {
  const [tema, setTema] = useState<Tema>("sistema");
  useEffect(() => {
    try {
      const guardado = localStorage.getItem(CLAVE_TEMA);
      if (guardado === "claro" || guardado === "oscuro") setTema(guardado);
    } catch {}
  }, []);
  const elegir = (t: Tema) => {
    setTema(t);
    const html = document.documentElement;
    try {
      if (t === "sistema") localStorage.removeItem(CLAVE_TEMA);
      else localStorage.setItem(CLAVE_TEMA, t);
    } catch {}
    if (t === "sistema") delete html.dataset.tema;
    else html.dataset.tema = t;
    const oscuro = t === "oscuro" || (t === "sistema" && !matchMedia("(prefers-color-scheme: light)").matches);
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", oscuro ? "#0A0A0C" : "#F4F2EC"));
  };
  return (
    <fieldset className="selector-tema">
      <legend>Tema</legend>
      <div className="segmentos">
        {OPCIONES.map((o) => (
          <label key={o.valor}>
            <input type="radio" name="tema" value={o.valor} checked={tema === o.valor} onChange={() => elegir(o.valor)} />
            {o.texto}
          </label>
        ))}
      </div>
      <p className="hint" style={{ margin: "6px 0 0", paddingLeft: 0 }}>«Automático» usa el mismo tema que tu teléfono u ordenador.</p>
    </fieldset>
  );
}
