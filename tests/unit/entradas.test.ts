import { describe, expect, it } from "vitest";
import { cierreDeReservas, fmtBizum, fmtHora, inicioDeVelada, motivoSinReserva, nuevoCodigo, parseBizum, parseHora, plazoDeSenal, senal } from "../../src/lib/events/entradas";

const dia = (s: string) => new Date(`${s}T00:00:00Z`);

describe("entradas de las veladas", () => {
  it("la señal es la mitad, redondeada al euro hacia arriba", () => {
    expect(senal(30)).toBe(15);
    expect(senal(25)).toBe(13);
    expect(senal(1)).toBe(1);
  });

  it("lee y escribe la hora", () => {
    expect(parseHora("20:30")).toBe(1230);
    expect(parseHora("9:05")).toBe(545);
    expect(parseHora("24:00")).toBeNull();
    expect(parseHora("20h")).toBeNull();
    expect(fmtHora(1230)).toBe("20:30");
    expect(fmtHora(545)).toBe("09:05");
  });

  it("el inicio respeta la hora peninsular en verano y en invierno", () => {
    expect(inicioDeVelada(dia("2026-07-10"), 20 * 60).toISOString()).toBe("2026-07-10T18:00:00.000Z");
    expect(inicioDeVelada(dia("2026-12-10"), 20 * 60).toISOString()).toBe("2026-12-10T19:00:00.000Z");
    expect(inicioDeVelada(dia("2026-12-10"), null).toISOString()).toBe("2026-12-10T19:00:00.000Z");
  });

  it("la señal se envía en 24 horas, pero nunca después del cierre (3 horas antes)", () => {
    const ahora = new Date("2026-12-01T10:00:00Z");
    expect(plazoDeSenal(ahora, dia("2026-12-10"), 1200).toISOString()).toBe("2026-12-02T10:00:00.000Z");
    expect(plazoDeSenal(ahora, dia("2026-12-01"), 1200)).toEqual(cierreDeReservas(dia("2026-12-01"), 1200));
  });

  it("solo acepta móviles españoles como Bizum", () => {
    expect(parseBizum("+34 612 345 678")).toBe("612345678");
    expect(parseBizum("712-345-678")).toBe("712345678");
    expect(parseBizum("912345678")).toBeNull();
    expect(parseBizum("61234567")).toBeNull();
    expect(fmtBizum("612345678")).toBe("612 345 678");
  });

  it("el código es corto y sin letras que se confundan", () => {
    const codigos = new Set(Array.from({ length: 200 }, nuevoCodigo));
    expect(codigos.size).toBe(200);
    for (const c of codigos) expect(c).toMatch(/^LONA-[A-HJKMNP-Z2-9]{6}$/);
  });

  it("explica por qué no se puede reservar", () => {
    const base = { status: "SCHEDULED", date: dia("2026-12-10"), startMinute: 1200, ticketsOpen: true, ticketPriceEuros: 20, bizumPhone: "612345678" };
    const antes = new Date("2026-12-01T10:00:00Z");
    expect(motivoSinReserva(base, antes)).toBeNull();
    expect(motivoSinReserva({ ...base, ticketsOpen: false }, antes)).toBe("entradas_no_disponibles");
    expect(motivoSinReserva({ ...base, bizumPhone: null }, antes)).toBe("entradas_no_disponibles");
    expect(motivoSinReserva({ ...base, status: "CANCELLED" }, antes)).toBe("entradas_no_disponibles");
    expect(motivoSinReserva(base, new Date("2026-12-10T17:00:00Z"))).toBe("entradas_cerradas");
  });
});
