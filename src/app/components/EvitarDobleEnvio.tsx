"use client";

import { useEffect } from "react";

/**
 * Un doble clic en un botón de envío no debe enviar dos veces (dos cuentas, dos combates, un error de «duplicado» tras haberlo hecho bien).
 * Al enviar un formulario, sus botones de envío se desactivan y se marcan como «ocupados» hasta que la acción termina (React vacía el formulario
 * con un evento `reset`; si el error se repite y la pantalla no cambia, ese evento no llega) o pasan 3,5 segundos: de sobra para un doble clic y poco para quien
 * quiere volver a intentarlo. Mientras tanto, un segundo envío del mismo formulario se descarta en el acto (el segundo clic de un doble clic llega antes de que
 * el botón se haya desactivado). Funciona en todos los formularios sin tocarlos.
 */
export default function EvitarDobleEnvio() {
  useEffect(() => {
    const enviando = new WeakSet<HTMLFormElement>();
    const botones = (form: HTMLFormElement) => Array.from(form.querySelectorAll<HTMLButtonElement>("button:not([type=button]):not([type=reset])"));
    const liberar = (form: HTMLFormElement) => botones(form).forEach((b) => { b.disabled = false; b.removeAttribute("aria-busy"); });
    const soltar = (form: HTMLFormElement) => { enviando.delete(form); liberar(form); };
    const alEnviar = (e: Event) => {
      const form = e.target;
      if (!(form instanceof HTMLFormElement) || e.defaultPrevented) return;
      if (enviando.has(form)) { e.preventDefault(); e.stopImmediatePropagation(); return; }
      enviando.add(form);
      // Se desactiva un instante después: así el envío ya ha leído el botón pulsado (su nombre y valor) antes de que deje de estar activo.
      setTimeout(() => {
        botones(form).forEach((b) => { b.disabled = true; b.setAttribute("aria-busy", "true"); });
        const fin = () => { clearTimeout(t); form.removeEventListener("reset", fin); soltar(form); };
        const t = setTimeout(fin, 3500);
        form.addEventListener("reset", fin);
      }, 0);
    };
    const alVolver = (e: PageTransitionEvent) => { if (e.persisted) document.querySelectorAll("form").forEach((f) => soltar(f)); };
    document.addEventListener("submit", alEnviar, true);
    window.addEventListener("pageshow", alVolver);
    return () => { document.removeEventListener("submit", alEnviar, true); window.removeEventListener("pageshow", alVolver); };
  }, []);
  return null;
}
