"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/** Bloquea envíos repetidos hasta reset, respuesta/navegación o error. El límite de
 * seguridad de 30 s permite reintentar si la conexión se pierde por completo.
 * Solo restaura controles que este componente haya desactivado.
 */
export default function EvitarDobleEnvio() {
  const pathname = usePathname();
  const liberarTodo = useRef(() => {});
  useEffect(() => { liberarTodo.current(); }, [pathname]);
  useEffect(() => {
    const pendientes = new Map<HTMLFormElement, () => void>();
    const alEnviar = (e: Event) => {
      const form = e.target;
      if (!(form instanceof HTMLFormElement) || e.defaultPrevented || (form.getAttribute("method") ?? "get").toLowerCase() === "get") return;
      if (pendientes.has(form)) { e.preventDefault(); e.stopImmediatePropagation(); return; }
      const bloqueados: (HTMLButtonElement | HTMLInputElement)[] = [];
      const aviso = document.createElement("p");
      aviso.setAttribute("role", "status"); aviso.setAttribute("aria-live", "polite"); aviso.className = "hint";
      const busyAnterior = form.getAttribute("aria-busy");
      let activar: ReturnType<typeof setTimeout>;
      const fin = () => {
        clearTimeout(limite); clearTimeout(activar);
        form.removeEventListener("reset", fin);
        bloqueados.forEach(b => { b.disabled = false; b.removeAttribute("aria-busy"); });
        if (busyAnterior === null) form.removeAttribute("aria-busy"); else form.setAttribute("aria-busy", busyAnterior);
        aviso.remove(); pendientes.delete(form);
      };
      const limite = setTimeout(fin, 30_000);
      pendientes.set(form, fin); form.addEventListener("reset", fin);
      // Esperar a que React lea el submitter: desactivarlo antes perdería su nombre/valor.
      activar = setTimeout(() => {
        form.querySelectorAll<HTMLButtonElement | HTMLInputElement>('button:not([type="button"]):not([type="reset"]),input[type="submit"]').forEach(b => {
          if (!b.disabled) { bloqueados.push(b); b.disabled = true; b.setAttribute("aria-busy", "true"); }
        });
        form.setAttribute("aria-busy", "true"); form.append(aviso);
        aviso.textContent = form.dataset.progreso || (location.pathname === "/registro" ? "Creando tu cuenta…" : "Guardando…");
      }, 0);
    };
    const liberar = () => { for (const fin of [...pendientes.values()]) fin(); };
    liberarTodo.current = liberar;
    document.addEventListener("submit", alEnviar, true);
    window.addEventListener("pageshow", liberar);
    window.addEventListener("lona:accion-terminada", liberar);
    window.addEventListener("error", liberar);
    window.addEventListener("unhandledrejection", liberar);
    return () => {
      liberar(); document.removeEventListener("submit", alEnviar, true);
      window.removeEventListener("pageshow", liberar); window.removeEventListener("lona:accion-terminada", liberar);
      window.removeEventListener("error", liberar); window.removeEventListener("unhandledrejection", liberar);
    };
  }, []);
  return null;
}
