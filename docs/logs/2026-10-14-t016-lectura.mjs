// Diagnóstico de revisión, sin base de datos ni escrituras de producto. Renderiza las fuentes con dependencias simuladas.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
const nativeRequire = createRequire(import.meta.url);
const root = process.cwd();
const cache = new Map();
const a = { id: "a", slug: "amateur-a", firstName: "Amateur", lastName: "Privado", recordPublic: false, listed: true, hiddenAt: null };
const b = { ...a, id: "b", slug: "amateur-b", firstName: "Rival" };
const event = { id: "e", slug: "velada", name: "Velada de prueba", level: "AMATEUR", date: new Date(Date.now() - 3 * 864e5), status: "COMPLETED" };
const bout = { id: "b1", event, fighterA: a, fighterB: b, fighterAId: "a", fighterBId: "b", result: "A_WIN", method: "KO", verification: "VERIFIED", createdAt: new Date(Date.now() - 3 * 864e5) };
let boutQuery = 0;
const db = {
  follow: { findMany: async () => [{ fighterId: "a", fighter: { ...a, gym: null } }] },
  bout: { findMany: async () => ++boutQuery === 1 ? [] : [bout] },
};
const stubs = new Map([
  [path.resolve(root, "src/lib/common/db.ts"), { db }],
  [path.resolve(root, "src/lib/accounts/auth.ts"), { requireUser: async () => ({ id: "fan", notifyEmails: true }) }],
  [path.resolve(root, "src/app/components/VerificationTag.tsx"), { __esModule: true, default: () => React.createElement("span", null, "Verificado") }],
  [path.resolve(root, "src/app/actions/community.ts"), { toggleFollow: async () => {} }],
]);
function load(file) {
  if (stubs.has(file)) return stubs.get(file);
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} }; cache.set(file, module);
  let input = fs.readFileSync(file, "utf8");
  // Expone una función interna solo en memoria para comprobar su salida; no altera el archivo de producto.
  if (file.endsWith(path.join("propuestas", "page.tsx"))) input += "\nexport { nivelDe };";
  const source = ts.transpileModule(input, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const requireLocal = (name) => {
    if (name === "next/link") return { __esModule: true, default: ({ children, ...props }) => React.createElement("a", props, children) };
    if (name === "next/navigation") return { redirect: (url) => { throw Object.assign(new Error(url), { redirect: true }); } };
    if (name === "next/cache") return { revalidatePath: () => {} };
    if (name === "next/server") return { after: () => {} };
    if (!name.startsWith(".")) return nativeRequire(name);
    const base = path.resolve(path.dirname(file), name);
    const target = [base, base + ".ts", base + ".tsx"].find((f) => fs.existsSync(f) && fs.statSync(f).isFile());
    if (!target) throw new Error(`No se encuentra ${name} desde ${file}`);
    return load(target);
  };
  vm.runInThisContext(`(function(require,module,exports){${source}\n})`, { filename: file })(requireLocal, module, module.exports);
  return module.exports;
}
const following = load(path.resolve(root, "src/app/siguiendo/page.tsx"));
const html = renderToStaticMarkup(await following.default());
console.log(JSON.stringify({ comprobacion: "Récord amateur oculto en siguiendo", recordPublic: false, resultadoPublico: html.includes("Gana Amateur Privado"), metodoPublico: html.includes("(KO)") }));
const { GaleriaMedios } = load(path.resolve(root, "src/app/components/Multimedia.tsx"));
const media = renderToStaticMarkup(React.createElement(GaleriaMedios, { back: "/veladas/velada", medios: [{ id: "m", kind: "VIDEO", caption: "Vídeo", videoKey: null, videoUrl: "https://example.com/video", createdAt: new Date(), uploader: { name: "Usuario Prueba" }, bout: { fighterA: { firstName: "Provisional", lastName: "ApellidoCompleto" }, fighterB: b } }] }));
console.log(JSON.stringify({ comprobacion: "Galería y fichas provisionales", apellidoCompletoPublicado: media.includes("Provisional ApellidoCompleto") }));
console.log(JSON.stringify({ comprobacion: "Páginas legales", condiciones: fs.existsSync("src/app/condiciones/page.tsx"), cookies: fs.existsSync("src/app/cookies/page.tsx"), privacidad: fs.existsSync("src/app/privacidad/page.tsx") }));
const { parseProposal } = load(path.resolve(root, "src/lib/fighters/proposals.ts"));
const { parseClassRequest } = load(path.resolve(root, "src/lib/trainers/requests.ts"));
for (const [tipo, resultado] of [
  ["sparring", parseProposal({ kind: "SPARRING", discipline: "BOXEO", day: "2026-11-31", place: "", message: "", today: "2026-10-14", disciplinasDelRival: ["BOXEO"] })],
  ["clase", parseClassRequest({ kind: "GROUP", day: "2026-11-31", from: "", to: "", message: "", phone: "", minutes: 60, today: "2026-10-14" })],
]) console.log(JSON.stringify({ comprobacion: "Fecha inexistente", tipo, aceptada: resultado.ok, fechaGuardada: resultado.ok ? resultado.value.day.toISOString() : null, texto: resultado.ok ? resultado.value.preferred ?? null : null }));
stubs.set(path.resolve(root, "src/app/actions/proposals.ts"), { answerProposal: async () => {}, cancelProposal: async () => {} });
db.bout.findMany = async () => [
  { ...bout, result: "A_WIN", event: { ...event, discipline: "BOXEO", level: "PRO" } },
  { ...bout, id: "b2", result: "B_WIN", event: { ...event, discipline: "MMA", level: "AMATEUR" } },
];
db.aura = { groupBy: async () => [] };
const { nivelDe } = load(path.resolve(root, "src/app/propuestas/page.tsx"));
const levels = await nivelDe([{ ...a, birthDate: null, disciplines: [{ discipline: "BOXEO", level: "PRO", priorTotal: null, priorWins: null, priorLosses: null, priorDraws: null }, { discipline: "MMA", level: "AMATEUR", priorTotal: null, priorWins: null, priorLosses: null, priorDraws: null }] }], {});
console.log(JSON.stringify({ comprobacion: "Récord mixto en sparring", privacidadAmateur: true, recordPublicado: levels.get("a").record }));
const organizer = { id: "org", role: "ORGANIZER", emailVerifiedAt: new Date() };
stubs.set(path.resolve(root, "src/lib/accounts/permissions.ts"), { requireOrganizer: async () => organizer });
stubs.set(path.resolve(root, "src/lib/community/notify.ts"), { notifyFollowersOfBout: async () => {} });
stubs.set(path.resolve(root, "src/lib/common/fallos.ts"), { registrarFallo: async () => {} });
let currentEvent = { ...event, organizerId: organizer.id, discipline: "BOXEO", province: "Madrid", kind: "VELADA" };
db.event = {
  findUnique: async () => currentEvent,
  update: async ({ data }) => { currentEvent = { ...currentEvent, ...data }; return currentEvent; },
};
db.bout.findUnique = async () => ({ ...bout, eventId: currentEvent.id, createdById: organizer.id, event: currentEvent });
db.bout.update = async () => ({});
db.bout.findMany = async () => [];
db.bout.updateMany = async () => ({ count: 0 });
db.fighter = { findMany: async () => [] };
db.auditLog = { create: async () => ({}) };
db.$transaction = async (work) => typeof work === "function" ? work(db) : Promise.all(work);
const actions = load(path.resolve(root, "src/app/actions/events.ts"));
const invoke = async (action, fields) => {
  const form = new FormData(); for (const [key, value] of Object.entries(fields)) form.set(key, value);
  try { await action(form); } catch (error) { if (!error.redirect) throw error; return error.message; }
};
for (const status of ["PENDING_AUTHORIZATION", "REJECTED"]) {
  currentEvent.status = status;
  const url = await invoke(actions.setBoutResult, { boutId: bout.id, outcome: "WIN", method: "KO" });
  console.log(JSON.stringify({ comprobacion: "Resultado sin autorización", estadoInicial: status, estadoFinal: currentEvent.status, url }));
}
currentEvent.status = "PENDING_AUTHORIZATION";
await invoke(actions.setEventStatus, { eventId: currentEvent.id, decision: "cancel" });
const cancelled = currentEvent.status;
await invoke(actions.setEventStatus, { eventId: currentEvent.id, decision: "reopen" });
console.log(JSON.stringify({ comprobacion: "Cancelar y reabrir sin autorización", estadoCancelado: cancelled, estadoFinal: currentEvent.status }));
currentEvent.status = "SCHEDULED";
currentEvent.date = new Date(Date.now() + 5 * 864e5);
const oldDate = new Date(Date.now() - 5 * 864e5).toISOString().slice(0, 10);
await invoke(actions.updateEvent, { eventId: currentEvent.id, name: currentEvent.name, date: oldDate, province: "Madrid", discipline: "BOXEO", kind: "VELADA" });
console.log(JSON.stringify({ comprobacion: "Mover futura a pasada", estadoFinal: currentEvent.status, fecha: currentEvent.date.toISOString() }));
