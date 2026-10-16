// Estado en vivo de la flota (petición del fundador, 16-10-2026: «un mod en el que se vea el flujo de acciones de cada modelo en pantalla
// y saber qué hace cada cosa en todo momento»). scripts/flota.mjs apunta aquí cada paso; lo leen la barra de estado de Claude Code
// (scripts/flota-barra.mjs) y el panel (scripts/flota-panel.mjs). Se guarda en ~/.lona-flota/estado.json, fuera del repositorio,
// para que lo vean todas las copias de trabajo. No contiene código, secretos ni datos personales: solo pasos, modelos y tiempos.
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export const DIR_ESTADO = join(homedir(), ".lona-flota");
export const ARCHIVO_ESTADO = join(DIR_ESTADO, "estado.json");

/** Los pasos del flujo, en orden, con quién los hace por defecto (el modelo real se apunta al empezar cada paso). */
export const PASOS = [
  { id: "plan", nombre: "Planifica", papel: "arquitecto", quien: "Claude" },
  { id: "ejecutar", nombre: "Ejecuta", papel: "ejecutor", quien: "Codex · gpt-6.1-sol" },
  { id: "puertas", nombre: "Comprobaciones", papel: "puertas", quien: "tipos · pruebas · catálogo · aprobado" },
  { id: "revision", nombre: "Revisa", papel: "revisor", quien: "Codex · gpt-6-luna / gpt-6-astra" },
  { id: "decision", nombre: "Decide", papel: "decisor", quien: "Claude" },
];

export function leerEstado() {
  try { return JSON.parse(readFileSync(ARCHIVO_ESTADO, "utf8")); } catch { return null; }
}

function guardar(estado) {
  mkdirSync(DIR_ESTADO, { recursive: true });
  const tmp = `${ARCHIVO_ESTADO}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(estado, null, 2));
  renameSync(tmp, ARCHIVO_ESTADO);
}

/** Empieza (o retoma) una tarea: deja los pasos en «pendiente». */
export function iniciarTarea(tarea, { ronda = 1, rondasMax = 3, titulo = "", riesgo = "normal", complejidad = "normal" } = {}) {
  const previo = leerEstado();
  const mismo = previo?.tarea === tarea && previo?.ronda === ronda;
  const estado = mismo ? previo : {
    tarea, titulo, ronda, rondasMax, riesgo, complejidad, inicio: Date.now(),
    pasos: Object.fromEntries(PASOS.map((p) => [p.id, { estado: "pendiente", quien: p.quien }])),
    historial: [],
  };
  estado.actualizado = Date.now();
  guardar(estado);
  return estado;
}

/** Marca un paso: estado «activo», «hecho», «fallo» u «omitido», con quién lo hace y una nota breve. */
export function marcar(paso, estadoPaso, { quien, nota, veredicto, resumen, hallazgos } = {}) {
  const estado = leerEstado() ?? iniciarTarea("(sin ficha)");
  const p = estado.pasos[paso] ?? (estado.pasos[paso] = { estado: "pendiente" });
  const ahora = Date.now();
  if (estadoPaso === "activo") { p.desde = ahora; delete p.hasta; }
  else p.hasta = ahora;
  p.estado = estadoPaso;
  if (quien) p.quien = quien;
  if (nota !== undefined) p.nota = nota;
  if (veredicto) p.veredicto = veredicto;
  if (resumen !== undefined) p.resumen = resumen;
  if (hallazgos) p.hallazgos = hallazgos;
  estado.actual = estadoPaso === "activo" ? paso : estado.actual === paso ? null : estado.actual;
  estado.historial = [...(estado.historial ?? []), { t: ahora, paso, estado: estadoPaso, quien: p.quien, nota: nota ?? "" }].slice(-40);
  estado.actualizado = ahora;
  guardar(estado);
  return estado;
}

export const hayEstado = () => existsSync(ARCHIVO_ESTADO);
