"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const CLAVE = "ringespana:formulario-enviado";
type Guardado = { ruta: string; indice: number; valores: Record<string, string> };
type Campo = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

const esCampo = (el: Element): el is Campo => el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement;
const formularios = () => Array.from(document.querySelectorAll<HTMLFormElement>("main form"));

/**
 * Para no perder lo escrito: al enviar un formulario se guardan sus campos de texto (en esta pestaña, sin contraseñas, campos ocultos ni casillas) y,
 * si la acción termina con un problema y la persona vuelve a la misma pantalla, se devuelven a su sitio. Con cualquier otro
 * resultado (éxito, otra pantalla) se descartan. Un campo que la persona ya ha vuelto a escribir no se pisa.
 */
export default function RecordarCampos() {
  const ruta = usePathname();
  const params = useSearchParams();

  useEffect(() => {
    const guardar = (e: Event) => {
      const form = e.target;
      if (!(form instanceof HTMLFormElement)) return;
      const indice = formularios().indexOf(form);
      if (indice < 0) return;
      const valores: Record<string, string> = {};
      for (const el of Array.from(form.elements)) {
        if (!esCampo(el) || !el.name || el.name.startsWith("$ACTION")) continue;
        if (el instanceof HTMLInputElement) {
          // Las casillas no se recuerdan: casi todas son confirmaciones («entiendo que no se puede deshacer») y la persona debe volver a marcarlas a propósito.
          if (["password", "hidden", "file", "submit", "button", "radio", "checkbox"].includes(el.type)) continue;
          valores[el.name] = el.value;
        } else valores[el.name] = el.value;
      }
      try { sessionStorage.setItem(CLAVE, JSON.stringify({ ruta: location.pathname, indice, valores } satisfies Guardado)); } catch { /* sin almacenamiento: simplemente no se recuerda */ }
    };
    document.addEventListener("submit", guardar, true);
    return () => document.removeEventListener("submit", guardar, true);
  }, []);

  useEffect(() => {
    let guardado: Guardado | null = null;
    try { guardado = JSON.parse(sessionStorage.getItem(CLAVE) ?? "null"); } catch { /* ignorar */ }
    if (!guardado) return;
    try { sessionStorage.removeItem(CLAVE); } catch { /* ignorar */ }
    if (!params.get("problema") || guardado.ruta !== ruta) return;
    const { indice, valores } = guardado;
    const restaurar = () => {
      const form = formularios()[indice];
      if (!form) return;
      for (const [nombre, valor] of Object.entries(valores)) {
        const el = form.elements.namedItem(nombre);
        if (!(el instanceof Element) || !esCampo(el)) continue;
        if (el instanceof HTMLSelectElement) { const inicial = Array.from(el.options).find((o) => o.defaultSelected)?.value ?? el.options[0]?.value; if (el.value === inicial) el.value = valor; }
        else if (el.value === el.defaultValue) el.value = valor;
      }
    };
    // React vacía los campos de un formulario cuando termina su acción (emite «reset»): se vuelven a rellenar justo después.
    const alReiniciar = () => queueMicrotask(restaurar);
    document.addEventListener("reset", alReiniciar, true);
    restaurar();
    const t1 = setTimeout(restaurar, 150); // por si la pantalla nueva termina de pintarse un instante después
    const t2 = setTimeout(() => document.removeEventListener("reset", alReiniciar, true), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); document.removeEventListener("reset", alReiniciar, true); };
  }, [ruta, params]);

  return null;
}
