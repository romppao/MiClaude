import { describe, expect, it } from "vitest";
import { availableFighters, isAvailable, parseCurrentWeight } from "../../src/lib/fighters/availability";
import { eventCalendar } from "../../src/lib/events/calendar";
import { eventPreparation } from "../../src/lib/events/preparation";
import { trainerWeek, agendaTime } from "../../src/lib/trainers/agenda";

const now = new Date("2026-10-14T22:30:00Z");

describe("disponibilidad voluntaria", () => {
  it("caduca exactamente a los 60 días y nunca activa una ficha sin fecha", () => {
    const fecha = new Date(now.getTime() - 60 * 864e5);
    expect(isAvailable({ availableToFight: true, availableSince: fecha }, now)).toBe(false);
    expect(isAvailable({ availableToFight: true, availableSince: new Date(+fecha + 1) }, now)).toBe(true);
    expect(isAvailable({ availableToFight: false, availableSince: now }, now)).toBe(false);
    expect(isAvailable({ availableToFight: true, availableSince: null }, now)).toBe(false);
    expect(availableFighters(now)).toEqual({ availableToFight: true, availableSince: { gt: fecha } });
  });
  it("el peso vacío no publica un valor; rechaza formatos y rangos inválidos", () => {
    expect(parseCurrentWeight("")).toBe(null);
    expect(parseCurrentWeight(" 70,25 ")).toBe(70.25);
    for (const raw of ["19.99", "300.01", "70.001", "NaN", "1e2", "-70"]) expect(parseCurrentWeight(raw)).toBe(undefined);
  });
});

describe("calendario público", () => {
  it("exporta un día completo y escapa saltos de línea, sin campos de asistencia", () => {
    const ics = eventCalendar({ id: "evento", name: "Velada\rATTENDEE:intruso\nFinal, uno; dos", date: new Date("2026-10-25T12:00:00Z"), venue: "Sala", city: "Madrid" }, now);
    expect(ics).toContain("DTSTART;VALUE=DATE:20261025\r\nDTEND;VALUE=DATE:20261026");
    expect(ics).not.toContain("\r\nATTENDEE:");
    expect(ics).toContain("SUMMARY:Velada\\nATTENDEE:intruso\\nFinal\\, uno\\; dos");
    expect(ics).not.toContain("userId");
  });
  it("pliega líneas por octetos sin romper letras UTF-8", () => {
    const ics = eventCalendar({ id: "evento", name: "á".repeat(100), date: now, venue: "Sala", city: "Madrid" }, now);
    for (const line of ics.split("\r\n")) expect(Buffer.byteLength(line)).toBeLessThanOrEqual(75);
    expect(ics.replace(/\r\n /g, "")).toContain(`SUMMARY:${"á".repeat(100)}`);
  });
});

describe("agenda y preparación", () => {
  it("usa la semana del día de Madrid incluso después de las doce locales", () => {
    expect(trainerWeek(new Date("2026-10-18T22:30:00Z"))).toEqual({ gte: new Date("2026-10-19T00:00:00Z"), lt: new Date("2026-10-26T00:00:00Z") });
    expect(agendaTime(540, 630)).toBe("09:00–10:30");
    expect(agendaTime(null, null)).toBe("Horario por acordar");
  });
  it("un cartel vacío nunca aparece completo; después exige todos los resultados", () => {
    const event = { slug: "central", date: new Date("2026-10-20T12:00:00Z"), ticketUrl: null, bouts: [] };
    expect(eventPreparation(event, now).every((p) => !p.completo)).toBe(true);
    const pasado = { ...event, date: new Date("2026-10-10T12:00:00Z"), bouts: [{ result: "A_WIN", weightClass: "M65" }, { result: null, weightClass: "M70" }] };
    expect(eventPreparation(pasado, now)[0].completo).toBe(false);
    expect(eventPreparation({ ...pasado, bouts: [{ result: "DRAW", weightClass: "M65" }] }, now)[0].completo).toBe(true);
  });
});
