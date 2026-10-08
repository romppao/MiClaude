const TZ = "Europe/Madrid";

/** Fecha de hoy en Madrid con formato AAAA-MM-DD. */
export function todayMadrid(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** Las veladas se guardan a las 12:00 UTC del día elegido: su «día» es la parte de fecha en UTC (mismo día en Madrid en cualquier época del año). */
export const dayKey = (d: Date): string => d.toISOString().slice(0, 10);

/** Límite para consultar veladas por día: las de hoy permanecen en el calendario todo el día de Madrid. */
export const calendarDayStart = (now: Date = new Date()): Date => new Date(`${todayMadrid(now)}T00:00:00Z`);

/** ¿Ya ha llegado el día de la velada (hoy o antes, según la fecha de Madrid)? Es la única definición de «ya celebrada» de la aplicación. */
export const eventDayReached = (eventDate: Date, now: Date = new Date()): boolean => dayKey(eventDate) <= todayMadrid(now);

export const MIN_EVENT_DAY = "1980-01-01";

/** Interpreta un día AAAA-MM-DD escrito por el usuario: debe existir de verdad, no ser anterior a 1980 ni estar a más de un año vista. */
export function parseDay(raw: string, now: Date = new Date()): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw) || raw < MIN_EVENT_DAY) return null;
  const d = new Date(`${raw}T12:00:00Z`);
  if (Number.isNaN(d.getTime()) || dayKey(d) !== raw) return null; // rechaza 2026-02-30
  if (d.getTime() > now.getTime() + 366 * 864e5) return null;
  return d;
}

export const MIN_BIRTH_DAY = "1920-01-01";

/** Interpreta una fecha de nacimiento AAAA-MM-DD: debe existir de verdad, ser posterior a 1920 y no estar en el futuro. */
export function parseBirthDate(raw: string, now: Date = new Date()): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw) || raw < MIN_BIRTH_DAY || raw > todayMadrid(now)) return null;
  const d = new Date(`${raw}T12:00:00Z`);
  return Number.isNaN(d.getTime()) || dayKey(d) !== raw ? null : d;
}

/** Días que faltan hasta una velada, contados por el día de Madrid (0 = hoy). Negativo si ya pasó. */
export function daysUntil(eventDate: Date, now: Date = new Date()): number {
  return Math.round((Date.parse(`${dayKey(eventDate)}T00:00:00Z`) - Date.parse(`${todayMadrid(now)}T00:00:00Z`)) / 864e5);
}

/** «Hoy», «Mañana» o «En 17 días» (para una velada próxima). */
export const whenLabel = (days: number): string => (days <= 0 ? "Hoy" : days === 1 ? "Mañana" : `En ${days} días`);

const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
/** Día y mes corto de una velada: { dia: "24", mes: "oct" } (por el día guardado, que es el de Madrid). */
export const dayAndMonth = (d: Date) => ({ dia: String(d.getUTCDate()), mes: MESES_CORTOS[d.getUTCMonth()] });

/**
 * Serie mensual para un gráfico: cuántas fechas caen en cada uno de los últimos `meses` meses (el actual el último), con su etiqueta corta.
 * Los meses se cuentan en la hora de Madrid.
 */
export function monthlySeries(dates: Date[], meses: number, now: Date = new Date()): { mes: string; total: number }[] {
  const [y, m] = todayMadrid(now).split("-").map(Number);
  const claves = Array.from({ length: meses }, (_, i) => { const t = (y * 12 + (m - 1)) - (meses - 1 - i); return { y: Math.floor(t / 12), m: t % 12 }; });
  const cuenta = new Map(claves.map((k) => [`${k.y}-${k.m}`, 0]));
  for (const d of dates) {
    const [dy, dm] = todayMadrid(d).split("-").map(Number);
    const k = `${dy}-${dm - 1}`;
    if (cuenta.has(k)) cuenta.set(k, cuenta.get(k)! + 1);
  }
  return claves.map((k) => ({ mes: MESES_CORTOS[k.m], total: cuenta.get(`${k.y}-${k.m}`)! }));
}

/** Las 00:00 en Madrid del día de una velada (para la cuenta atrás: aún no guardamos la hora de inicio). */
export function madridDayStart(eventDate: Date): Date {
  const mediodia = new Date(`${dayKey(eventDate)}T12:00:00Z`);
  const horaMadrid = Number(new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", hourCycle: "h23" }).format(mediodia));
  return new Date(Date.parse(`${dayKey(eventDate)}T00:00:00Z`) - (horaMadrid - 12) * 36e5);
}
