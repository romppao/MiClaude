import { afterEach, describe, expect, it, vi } from "vitest";
import { calendarDayStart, dayKey, eventDayReached, parseBirthDate, parseDay, todayMadrid } from "../../src/lib/common/dates";

const at = (iso: string) => new Date(iso);

describe("fechas en Europe/Madrid", () => {
  afterEach(() => vi.useRealTimers());

  it("todayMadrid respeta el horario de verano e invierno", () => {
    expect(todayMadrid(at("2026-07-14T22:30:00Z"))).toBe("2026-07-15"); // 00:30 en Madrid (CEST)
    expect(todayMadrid(at("2026-07-14T21:30:00Z"))).toBe("2026-07-14"); // 23:30 en Madrid
    expect(todayMadrid(at("2026-12-14T23:30:00Z"))).toBe("2026-12-15"); // 00:30 en Madrid (CET)
    expect(todayMadrid(at("2026-12-14T22:30:00Z"))).toBe("2026-12-14");
  });
  it("una velada de hoy ya cuenta como celebrada aunque sean las 8:00 (antes de las 12:00 UTC)", () => {
    const velada = new Date("2026-06-13T12:00:00Z");
    expect(eventDayReached(velada, at("2026-06-13T06:00:00Z"))).toBe(true);
    expect(eventDayReached(velada, at("2026-06-12T21:00:00Z"))).toBe(false); // 23:00 del día anterior en Madrid
    expect(eventDayReached(velada, at("2026-06-12T22:00:00Z"))).toBe(true); // 00:00 en Madrid
  });
  it("dayKey usa la parte de fecha guardada", () => {
    expect(dayKey(new Date("2026-06-13T12:00:00Z"))).toBe("2026-06-13");
  });
  it.each([
    "2026-07-14T00:00:00Z", "2026-07-14T21:59:59Z",
    "2026-12-14T00:00:00Z", "2026-12-14T22:59:59Z",
  ])("las veladas de hoy siguen en próximas durante todo el día: %s", (iso) => {
    const now = at(iso);
    const boundary = calendarDayStart(now);
    const today = at(`${todayMadrid(now)}T12:00:00Z`);
    const yesterday = new Date(today.getTime() - 864e5);
    const tomorrow = new Date(today.getTime() + 864e5);
    expect(today.getTime()).toBeGreaterThanOrEqual(boundary.getTime());
    expect(yesterday.getTime()).toBeLessThan(boundary.getTime());
    expect(tomorrow.getTime()).toBeGreaterThanOrEqual(boundary.getTime());
  });
  it.each(["2026-07-14T22:00:00Z", "2026-12-14T23:00:00Z"])("a medianoche de Madrid la velada de ayer pasa a pasadas: %s", (iso) => {
    expect(calendarDayStart(at(iso)).toISOString()).toBe(`${todayMadrid(at(iso))}T00:00:00.000Z`);
    const yesterday = at(`${iso.slice(0, 10)}T12:00:00Z`);
    expect(yesterday.getTime()).toBeLessThan(calendarDayStart(at(iso)).getTime());
  });
  it("parseDay acepta fechas reales dentro del rango", () => {
    const now = at("2026-09-30T10:00:00Z");
    expect(parseDay("2026-08-01", now)?.toISOString()).toBe("2026-08-01T12:00:00.000Z");
    expect(parseDay("2027-09-01", now)).not.toBeNull(); // menos de un año vista
  });
  it("parseDay rechaza fechas imposibles, antiguas o demasiado lejanas", () => {
    const now = at("2026-09-30T10:00:00Z");
    for (const bad of ["2026-02-30", "2026-13-01", "2026-1-1", "hoy", "", "1979-12-31", "2062-01-01", "2026-09-30T12:00", "0000-01-01"]) expect(parseDay(bad, now)).toBeNull();
  });
});

describe("fecha de nacimiento", () => {
  const ahora = at("2026-09-30T10:00:00Z");
  it("acepta un día real del pasado", () => {
    expect(parseBirthDate("1998-03-12", ahora)?.toISOString()).toBe("1998-03-12T12:00:00.000Z");
    expect(parseBirthDate("2026-09-30", ahora)).not.toBeNull(); // hoy
  });
  it("rechaza el futuro, lo anterior a 1920, días inexistentes y formatos raros", () => {
    for (const raw of ["2026-10-01", "1919-12-31", "1998-02-30", "12/03/1998", "1998-3-2", "", "abc"]) expect(parseBirthDate(raw, ahora)).toBeNull();
  });
});
