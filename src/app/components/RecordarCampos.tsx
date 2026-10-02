"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const CLAVE = "ringespana:formulario-enviado";
/** `firma` identifica el formulario por los nombres de sus campos (no por su posición, que cambia si la pantalla cambia) y `orden` distingue a los que comparten firma. */
type Guardado = { ruta: string; firma: string; orden: number; valores: Record<string, string> };
type Campo = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

const esCampo = (el: Element): el is Campo => el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement;
const formularios = () => Array.from(document.querySelectorAll<HTMLFormElement>("main form"));
const firmaDe = (form: HTMLFormElement) => Array.from(form.elements).filter((el) => esCampo(el) && el.name && !el.name.startsWith("$ACTION")).map((el) => (el as Campo).name).sort().join(",");
const hayProblema = () => !!new URLSearchParams(location.search).get("problema");
/**
 * Campos que la persona ha tocado (escrito, borrado o cambiado) DESPUÉS del último envío: restaurar nunca los pisa, ni siquiera si los ha dejado vacíos a propósito
 * (por ejemplo, para quitar un enlace que dio error). Lo que escribió antes de enviar sí se devuelve: el envío empieza una lista nueva.
 */
let tocados = new WeakSet<Element>();

function leer(): Guardado | null {
  try { return JSON.parse(sessionStorage.getItem(CLAVE) ?? "null"); } catch { return null; }
}
function olvidar() {
  try { sessionStorage.removeItem(CLAVE); } catch { /* ignorar */ }
}

/** Devuelve lo guardado a su formulario (sin pisar lo que la persona ya haya vuelto a escribir) y abre el desplegable que lo contiene. */
function restaurar(g: Guardado) {
  const candidatos = formularios().filter((f) => firmaDe(f) === g.firma);
  const form = candidatos[g.orden] ?? candidatos[0];
  if (!form) return;
  // Un formulario dentro de un desplegable vuelve cerrado tras el error: se abre para que la persona vea dónde corregir.
  for (let d = form.closest("details"); d; d = d.parentElement?.closest("details") ?? null) d.open = true;
  for (const [nombre, valor] of Object.entries(g.valores)) {
    const el = form.elements.namedItem(nombre);
    if (!(el instanceof Element) || !esCampo(el) || tocados.has(el)) continue;
    if (el instanceof HTMLSelectElement) {
      const inicial = Array.from(el.options).find((o) => o.defaultSelected)?.value ?? el.options[0]?.value;
      if (el.value === inicial) el.value = valor;
    } else if (el.value === el.defaultValue) el.value = valor;
  }
}

/**
 * Para no perder lo escrito: al enviar un formulario se guardan sus campos de texto (en esta pestaña, sin contraseñas, campos ocultos ni casillas) y,
 * si la acción termina con un problema y la persona vuelve a la misma pantalla, se devuelven a su sitio y se abre el desplegable que lo contiene
 * (para que vea dónde corregir). Con cualquier otro resultado (éxito, otra pantalla) se descartan. Un campo que la persona ya ha vuelto a escribir no se pisa.
 *
 * Funciona aunque el mismo error se repita (la dirección no cambia): React vacía los campos cuando termina la acción y se vuelven a rellenar justo después.
 */
export default function RecordarCampos() {
  const ruta = usePathname();
  const params = useSearchParams();

  // Al enviar un formulario: se guarda y, durante unos segundos, cada vez que la pantalla vacía o vuelve a crear el formulario al terminar su acción
  // con un problema en esta misma pantalla (React lo vacía con un «reset» y, además, Next.js puede volver a montarlo con la respuesta del servidor), se rellena de nuevo.
  useEffect(() => {
    let cierre: ReturnType<typeof setTimeout> | undefined;
    let observador: MutationObserver | undefined;
    const restaurarSiProcede = () => {
      const g = leer();
      if (g && g.ruta === location.pathname && hayProblema()) restaurar(g);
    };
    const alReiniciar = () => queueMicrotask(restaurarSiProcede);
    const dejarDeVigilar = () => { observador?.disconnect(); document.removeEventListener("reset", alReiniciar, true); clearTimeout(cierre); };
    const guardar = (e: Event) => {
      const form = e.target;
      if (!(form instanceof HTMLFormElement)) return;
      const firma = firmaDe(form);
      const orden = formularios().filter((f) => firmaDe(f) === firma).indexOf(form);
      if (orden < 0) return;
      const valores: Record<string, string> = {};
      for (const el of Array.from(form.elements)) {
        if (!esCampo(el) || !el.name || el.name.startsWith("$ACTION")) continue;
        // Las casillas no se recuerdan: casi todas son confirmaciones («entiendo que no se puede deshacer») y la persona debe volver a marcarlas a propósito.
        if (el instanceof HTMLInputElement && ["password", "hidden", "file", "submit", "button", "radio", "checkbox"].includes(el.type)) continue;
        valores[el.name] = el.value;
      }
      try { sessionStorage.setItem(CLAVE, JSON.stringify({ ruta: location.pathname, firma, orden, valores } satisfies Guardado)); } catch { /* sin almacenamiento: simplemente no se recuerda */ }
      tocados = new WeakSet();
      dejarDeVigilar();
      document.addEventListener("reset", alReiniciar, true);
      observador = new MutationObserver(() => queueMicrotask(restaurarSiProcede)); // restaurar solo toca valores y desplegables, no los atributos que se observan: no hay bucle
      observador.observe(document.body, { childList: true, subtree: true });
      cierre = setTimeout(dejarDeVigilar, 8000);
    };
    const marcarTocado = (e: Event) => { if (e.target instanceof Element) tocados.add(e.target); };
    document.addEventListener("input", marcarTocado, true);
    document.addEventListener("submit", guardar, true);
    return () => { document.removeEventListener("input", marcarTocado, true); document.removeEventListener("submit", guardar, true); dejarDeVigilar(); };
  }, []);

  // Al llegar a una dirección nueva: si lo guardado es de esta pantalla y hay un problema, se restaura; en cualquier otro caso se descarta.
  useEffect(() => {
    const g = leer();
    if (!g) return;
    if (!params.get("problema") || g.ruta !== ruta) { olvidar(); return; }
    restaurar(g);
    const t = setTimeout(() => restaurar(g), 150); // por si la pantalla nueva termina de pintarse un instante después
    return () => clearTimeout(t);
  }, [ruta, params]);

  return null;
}
