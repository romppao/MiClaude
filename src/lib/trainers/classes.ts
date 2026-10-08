import type { ClassKind, Discipline } from "@prisma/client";

/** Clases de los entrenadores: individuales (horario a convenir) o colectivas (con plazas y horario fijo). Precio por persona y sesión, en euros. */
export const CLASS_KIND_LABEL: Record<ClassKind, string> = { INDIVIDUAL: "Individual", GROUP: "Colectiva" };
export const CLASS_MINUTES = [45, 60, 75, 90] as const;
export const CLASS_TITLE_MAX = 60;
export const CLASS_SCHEDULE_MAX = 80;
export const CLASS_PRICE_MAX = 500;
export const GROUP_CAPACITY = { min: 2, max: 30 } as const;
export const TRAINER_YEARS_MAX = 60;

export type ClassInput = { kind: string; title: string; minutes: string; price: string; capacity: string; schedule: string };
export type ClassParsed =
  | { ok: true; value: { kind: ClassKind; title: string; minutes: number; priceEuros: number; capacity: number | null; schedule: string | null } }
  | { ok: false; problema: string };

const entero = (s: string) => (/^\d{1,4}$/.test(s.trim()) ? parseInt(s.trim(), 10) : NaN);

/** Valida una clase. Los códigos de problema tienen su texto en `messages.ts`. */
export function parseClass(input: ClassInput): ClassParsed {
  const kind = input.kind === "INDIVIDUAL" || input.kind === "GROUP" ? input.kind : null;
  if (!kind) return { ok: false, problema: "clase_tipo" };
  const title = input.title.replace(/\s+/g, " ").trim();
  if (!title || title.length > CLASS_TITLE_MAX) return { ok: false, problema: "clase_titulo" };
  const minutes = entero(input.minutes);
  if (!(CLASS_MINUTES as readonly number[]).includes(minutes)) return { ok: false, problema: "clase_duracion" };
  const priceEuros = entero(input.price);
  if (!(priceEuros >= 0 && priceEuros <= CLASS_PRICE_MAX)) return { ok: false, problema: "clase_precio" };
  if (kind === "INDIVIDUAL") return { ok: true, value: { kind, title, minutes, priceEuros, capacity: null, schedule: null } };
  const capacity = entero(input.capacity);
  if (!(capacity >= GROUP_CAPACITY.min && capacity <= GROUP_CAPACITY.max)) return { ok: false, problema: "clase_plazas" };
  const schedule = input.schedule.replace(/\s+/g, " ").trim();
  if (!schedule || schedule.length > CLASS_SCHEDULE_MAX) return { ok: false, problema: "clase_horario" };
  return { ok: true, value: { kind, title, minutes, priceEuros, capacity, schedule } };
}

/** «60 min · horario a convenir» o «90 min · Martes y jueves · 19:30». */
export const classMeta = (c: { kind: ClassKind; minutes: number; schedule: string | null }) =>
  c.kind === "INDIVIDUAL" ? `${c.minutes} min · horario a convenir` : `${c.minutes} min · ${c.schedule ?? ""}`;

/** Años entrenando: número entero entre 0 y 60 (vacío = sin indicar). */
export function parseYears(raw: string): number | null | undefined {
  if (!raw.trim()) return null;
  const n = entero(raw);
  return n >= 0 && n <= TRAINER_YEARS_MAX ? n : undefined;
}

/** Disciplinas elegidas, sin repetir y en el orden del catálogo. */
export function pickDisciplines(raw: string[], order: Discipline[]): Discipline[] {
  return order.filter((d) => raw.includes(d));
}
