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
