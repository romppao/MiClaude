#!/usr/bin/env node
// Barra de estado de Claude Code con el flujo de la flota (mod pedido por el fundador el 16-10-2026, inspirado en el vídeo de @robles.ia).
// Claude Code la ejecuta y le pasa por la entrada estándar un JSON con el modelo de la sesión; esta barra lee además
// ~/.lona-flota/estado.json (lo escribe scripts/flota.mjs) y pinta una línea:
//   Opus 5.5 │ Flota T-017 · ronda 1/3 │ ✓ Planifica · ▶ Ejecuta: Codex gpt-6.1-sol (medium) 2:31 · ○ Comprobaciones · ○ Revisa · ○ Decide
// Es autónoma (no importa nada del repositorio) para poder instalarse en ~/.claude con `node scripts/flota.mjs instalar-barra`.
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const ORDEN = [["plan", "Planifica"], ["ejecutar", "Ejecuta"], ["puertas", "Comprobaciones"], ["revision", "Revisa"], ["decision", "Decide"]];
const COLOR = { activo: "\x1b[1;93m", hecho: "\x1b[32m", fallo: "\x1b[31m", omitido: "\x1b[90m", pendiente: "\x1b[90m" };
const ICONO = { activo: "▶", hecho: "✓", fallo: "✘", omitido: "–", pendiente: "○" };
const FIN = "\x1b[0m";
const reloj = (ms) => { const s = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };

let sesion = {};
try { sesion = JSON.parse(readFileSync(0, "utf8") || "{}"); } catch { /* sin datos de la sesión */ }
const modeloSesion = sesion?.model?.display_name ?? "Claude";

let estado = null;
try { estado = JSON.parse(readFileSync(join(homedir(), ".lona-flota", "estado.json"), "utf8")); } catch { /* sin flota */ }

// Sin tarea o con una tarea parada hace más de 12 horas: solo el modelo de la sesión.
if (!estado || Date.now() - (estado.actualizado ?? 0) > 12 * 3600_000) {
  console.log(`${modeloSesion} │ Flota: libre`);
  process.exit(0);
}

const partes = ORDEN.map(([id, nombre]) => {
  const p = estado.pasos?.[id] ?? { estado: "pendiente" };
  const e = p.estado ?? "pendiente";
  let texto = `${ICONO[e] ?? "○"} ${nombre}`;
  if (e === "activo") texto += `: ${p.quien ?? ""} ${p.desde ? reloj(Date.now() - p.desde) : ""}`.trimEnd();
  if (id === "revision" && p.veredicto && e !== "activo") texto += ` (${p.veredicto})`;
  return `${COLOR[e] ?? ""}${texto}${FIN}`;
});
const cabecera = `Flota ${estado.tarea}${estado.riesgo === "critico" ? " ⚠ crítico" : ""} · ronda ${estado.ronda}/${estado.rondasMax ?? 3}`;
console.log(`${modeloSesion} │ ${cabecera} │ ${partes.join(" · ")}`);
