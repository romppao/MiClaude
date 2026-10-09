import type { RegistrationStatus } from "@prisma/client";

/**
 * Inscripción de peleadores en veladas e interclubs (propuesta n.º 3 del diseño v3; pedida por el fundador el 9 de octubre de 2026:
 * «solicitar participación en una velada o interclub, y que los organizadores puedan gestionar todas esas solicitudes, filtrar las listas
 * con x parámetros, listarlo por un orden… todo para facilitar la selección de los peleadores»).
 * El organizador abre o cierra la inscripción; el peleador la solicita con su categoría y su peso; el organizador acepta o rechaza, y
 * después empareja a los aceptados en el cartel. Aceptar no crea combates.
 */
export const REG_STATUS_LABEL: Record<RegistrationStatus, string> = { PENDING: "Pendiente", ACCEPTED: "Aceptada", DECLINED: "Rechazada", WITHDRAWN: "Retirada" };
export const REG_MESSAGE_MAX = 500;
export const REG_REPLY_MAX = 500;
export const REG_NOTE_MAX = 500;
export const PESO_MIN = 20;
export const PESO_MAX = 200;
/** Solicitudes nuevas por peleador y día. */
export const REGISTRATIONS_PER_DAY = 10;

const limpio = (s: string) => s.replace(/\s+/g, " ").trim();

/** ¿Se puede pedir participar hoy? Abierta por el organizador, evento programado y futuro (o de hoy), y sin pasar la fecha límite. */
export function inscripcionAbierta(e: { registrationOpen: boolean; status: string; date: Date; registrationUntil: Date | null }, hoy: string): boolean {
  const dia = (d: Date) => d.toISOString().slice(0, 10);
  return e.registrationOpen && e.status === "SCHEDULED" && dia(e.date) >= hoy && (!e.registrationUntil || dia(e.registrationUntil) >= hoy);
}

export type RegistrationParsed = { ok: true; value: { weightKg: number | null; message: string | null } } | { ok: false; problema: string };

/** Peso (opcional, de 20 a 200 kg, con coma o punto y como mucho un decimal) y mensaje (opcional). */
export function parseRegistration(input: { weightKg: string; message: string }): RegistrationParsed {
  const crudo = input.weightKg.trim().replace(",", ".");
  let weightKg: number | null = null;
  if (crudo) {
    if (!/^\d{2,3}(\.\d)?$/.test(crudo) || Number(crudo) < PESO_MIN || Number(crudo) > PESO_MAX) return { ok: false, problema: "inscripcion_peso" };
    weightKg = Number(crudo);
  }
  const message = limpio(input.message);
  if (message.length > REG_MESSAGE_MAX) return { ok: false, problema: "inscripcion_mensaje_largo" };
  return { ok: true, value: { weightKg, message: message || null } };
}

/** Requisitos y fecha límite que escribe el organizador al abrir la inscripción. La fecha, de hoy al día del evento. */
export function parseRegistrationSettings(input: { note: string; until: string; hoy: string; diaEvento: string }): { ok: true; value: { registrationNote: string | null; registrationUntil: Date | null } } | { ok: false; problema: string } {
  const note = limpio(input.note);
  if (note.length > REG_NOTE_MAX) return { ok: false, problema: "inscripcion_requisitos_largo" };
  if (input.until && (!/^\d{4}-\d{2}-\d{2}$/.test(input.until) || Number.isNaN(Date.parse(`${input.until}T00:00:00Z`)) || input.until < input.hoy || input.until > input.diaEvento)) return { ok: false, problema: "inscripcion_fecha_limite" };
  return { ok: true, value: { registrationNote: note || null, registrationUntil: input.until ? new Date(`${input.until}T00:00:00Z`) : null } };
}

/** Una fila de la lista del organizador, con lo que hace falta para filtrar y ordenar. */
export type FilaInscripcion = {
  id: string; status: RegistrationStatus; createdAt: Date; nombre: string; gimnasio: string | null; provincia: string | null;
  divisionId: string | null; weightClass: string | null; weightKg: number | null; combates: number; victorias: number; aura: number; edad: number | null;
};

export const ORDENES = {
  fecha: "Fecha de la solicitud (primero las más antiguas)",
  aura: "Más aura primero",
  victorias: "Más victorias primero",
  combates: "Más combates primero",
  experiencia: "Menos combates primero",
  peso: "Peso declarado (de menos a más)",
  edad: "Edad (de menos a más)",
  nombre: "Nombre (A-Z)",
} as const;
export type Orden = keyof typeof ORDENES;
export const parseOrden = (v: string | undefined): Orden => (v && Object.prototype.hasOwnProperty.call(ORDENES, v) ? (v as Orden) : "fecha");

export type FiltrosInscripcion = {
  estado?: RegistrationStatus | "TODAS"; weightClass?: string; divisionId?: string; provincia?: string; texto?: string; orden?: Orden;
  minCombates?: number; maxCombates?: number; minEdad?: number; maxEdad?: number; minPeso?: number; maxPeso?: number;
};

/** Un número de un filtro de la dirección (entero o con un decimal), o nada si está vacío o no es válido. */
export const numeroDeFiltro = (v: string | undefined): number | undefined => {
  const t = v?.trim().replace(",", ".");
  return t && /^\d{1,3}(\.\d)?$/.test(t) ? Number(t) : undefined;
};

const sinTildes = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Filtra y ordena las solicitudes de un evento. Por defecto, solo las pendientes y por orden de llegada. A igualdad, por nombre, para que
 * el orden sea siempre el mismo.
 */
export function filtrarYOrdenar<T extends FilaInscripcion>(filas: T[], f: FiltrosInscripcion): T[] {
  const estado = f.estado ?? "PENDING";
  const texto = f.texto ? sinTildes(f.texto.trim()) : "";
  const quedan = filas.filter((r) =>
    (estado === "TODAS" || r.status === estado) &&
    (!f.weightClass || r.weightClass === f.weightClass) &&
    (!f.divisionId || r.divisionId === f.divisionId) &&
    (!f.provincia || r.provincia === f.provincia) &&
    (f.minCombates === undefined || r.combates >= f.minCombates) &&
    (f.maxCombates === undefined || r.combates <= f.maxCombates) &&
    // Con edad o peso pedidos, quien no los ha indicado queda fuera: no se puede saber si cumple.
    (f.minEdad === undefined || (r.edad !== null && r.edad >= f.minEdad)) &&
    (f.maxEdad === undefined || (r.edad !== null && r.edad <= f.maxEdad)) &&
    (f.minPeso === undefined || (r.weightKg !== null && r.weightKg >= f.minPeso)) &&
    (f.maxPeso === undefined || (r.weightKg !== null && r.weightKg <= f.maxPeso)) &&
    (!texto || sinTildes(`${r.nombre} ${r.gimnasio ?? ""}`).includes(texto)));
  const porNombre = (a: T, b: T) => a.nombre.localeCompare(b.nombre, "es") || a.id.localeCompare(b.id);
  const orden = f.orden ?? "fecha";
  const comparar: Record<Orden, (a: T, b: T) => number> = {
    fecha: (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    aura: (a, b) => b.aura - a.aura,
    victorias: (a, b) => b.victorias - a.victorias,
    combates: (a, b) => b.combates - a.combates,
    experiencia: (a, b) => a.combates - b.combates,
    peso: (a, b) => (a.weightKg ?? Infinity) - (b.weightKg ?? Infinity),
    edad: (a, b) => (a.edad ?? Infinity) - (b.edad ?? Infinity),
    nombre: () => 0,
  };
  return [...quedan].sort((a, b) => comparar[orden](a, b) || porNombre(a, b));
}

export const puedeResponderInscripcion = (s: RegistrationStatus) => s === "PENDING" || s === "ACCEPTED" || s === "DECLINED";
export const puedeRetirarInscripcion = (s: RegistrationStatus) => s === "PENDING" || s === "ACCEPTED";

/** Estados en la dirección de la lista del organizador (en español) y su equivalente. */
export const ESTADOS_LISTA = { pendientes: "PENDING", aceptadas: "ACCEPTED", rechazadas: "DECLINED", retiradas: "WITHDRAWN", todas: "TODAS" } as const;
export type EstadoLista = keyof typeof ESTADOS_LISTA;
export const parseEstadoLista = (v: string | undefined): EstadoLista => (v && Object.prototype.hasOwnProperty.call(ESTADOS_LISTA, v) ? (v as EstadoLista) : "pendientes");

/*
 * Plazas por categoría (decisión del fundador, 9 de octubre de 2026: «me parece bien que se especifiquen los pesos para los combates, las
 * plazas por categoría»). El organizador puede ofrecer solo ciertas categorías, cada una con un número de plazas. Con plazas, el peleador
 * elige entre ellas; cuando una se llena, las solicitudes nuevas o pendientes quedan «en lista de espera» y no se pueden aceptar más
 * de las plazas que hay (el organizador puede ampliarlas). Sin plazas, cualquier categoría vale, como antes.
 */
export const PLAZAS_MAX = 64;
export const CATEGORIAS_MAX = 30;
export type Plaza = { id?: string; divisionId: string; weightClass: string; places: number };

/** Clave de una categoría (división y peso); la división vacía es "". */
export const claveCategoria = (divisionId: string | null | undefined, weightClass: string | null | undefined) => `${divisionId ?? ""}|${weightClass ?? ""}`;

/** Número de plazas de un formulario: entero de 1 a 64. */
export const parsePlazas = (v: string): number | null => (/^\d{1,2}$/.test(v.trim()) && Number(v) >= 1 && Number(v) <= PLAZAS_MAX ? Number(v) : null);

export type Ocupacion = { places: number; aceptadas: number; pendientes: number; libres: number; llena: boolean };

/** Cuántas plazas quedan en cada categoría ofrecida, contando las aceptadas, y cuántas solicitudes esperan. */
export function ocupacion(plazas: Plaza[], filas: { status: RegistrationStatus; divisionId: string | null; weightClass: string | null }[]): Map<string, Ocupacion> {
  const m = new Map<string, Ocupacion>();
  for (const p of plazas) m.set(claveCategoria(p.divisionId, p.weightClass), { places: p.places, aceptadas: 0, pendientes: 0, libres: p.places, llena: false });
  for (const r of filas) {
    const o = m.get(claveCategoria(r.divisionId, r.weightClass));
    if (!o) continue;
    if (r.status === "ACCEPTED") o.aceptadas++;
    else if (r.status === "PENDING") o.pendientes++;
  }
  for (const o of m.values()) { o.libres = Math.max(0, o.places - o.aceptadas); o.llena = o.libres === 0; }
  return m;
}

/** Una solicitud pendiente en una categoría sin plazas libres está en lista de espera. */
export const enListaDeEspera = (r: { status: RegistrationStatus; divisionId: string | null; weightClass: string | null }, ocup: Map<string, Ocupacion>) =>
  r.status === "PENDING" && !!ocup.get(claveCategoria(r.divisionId, r.weightClass))?.llena;

/**
 * ¿Caben estas aceptaciones nuevas? Devuelve la clave de la primera categoría que se pasaría de sus plazas, o null si caben todas.
 * Las categorías sin plazas definidas no tienen límite.
 */
export function categoriaSinSitio(ocup: Map<string, Ocupacion>, nuevas: { divisionId: string | null; weightClass: string | null }[]): string | null {
  const suma = new Map<string, number>();
  for (const r of nuevas) { const k = claveCategoria(r.divisionId, r.weightClass); suma.set(k, (suma.get(k) ?? 0) + 1); }
  for (const [k, n] of suma) { const o = ocup.get(k); if (o && o.aceptadas + n > o.places) return k; }
  return null;
}
