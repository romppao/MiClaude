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
    // React puede quitar method al hidratar una acción y dejar su action javascript de protección.
    // Leer el atributo evita que input[name=method] oculte la propiedad, pero no se debe confundir esa acción con una búsqueda GET.
    const esGet = (form: HTMLFormElement) => (form.getAttribute("method") ?? (form.getAttribute("action")?.startsWith("javascript:") ? "post" : "get")).toLowerCase() === "get";
    const alEnviar = (e: Event) => {
      const form = e.target;
      if (!(form instanceof HTMLFormElement) || e.defaultPrevented || esGet(form)) return;
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
    // Un reset/respuesta rápida puede liberar el formulario entre los dos clics físicos.
    // El segundo clic de un doble clic no es una nueva intención de enviar, aunque el primer envío ya haya terminado.
    const alClic = (e: MouseEvent) => {
      if (e.detail < 2 || !(e.target instanceof Element)) return;
      const boton = e.target.closest("button,input[type=submit]");
      if (!(boton instanceof HTMLButtonElement || boton instanceof HTMLInputElement) || boton.type !== "submit") return;
      const form = boton.form;
      if (!form || esGet(form)) return;
      e.preventDefault(); e.stopImmediatePropagation();
    };
    const liberar = () => { for (const fin of [...pendientes.values()]) fin(); };
    liberarTodo.current = liberar;
    document.addEventListener("submit", alEnviar, true);
    document.addEventListener("click", alClic, true);
    window.addEventListener("pageshow", liberar);
    window.addEventListener("lona:accion-terminada", liberar);
    window.addEventListener("error", liberar);
    window.addEventListener("unhandledrejection", liberar);
    return () => {
      liberar(); document.removeEventListener("submit", alEnviar, true);
      document.removeEventListener("click", alClic, true);
      window.removeEventListener("pageshow", liberar); window.removeEventListener("lona:accion-terminada", liberar);
      window.removeEventListener("error", liberar); window.removeEventListener("unhandledrejection", liberar);
    };
  }, []);
  return null;
}
