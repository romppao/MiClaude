import { describe, it, expect } from "vitest";
const { duracionEnMinutos: d } = await import(/* @vite-ignore */ `${process.env.RUTA_ENTREGA}/reto-3.ts`);

describe("reto 3 · duracionEnMinutos", () => {
  it("días normales", () => {
    expect(d("2026-10-10T20:00", "2026-10-10T22:30")).toBe(150);
    expect(d("2026-10-10T22:00", "2026-10-11T01:15")).toBe(195);
    expect(d("2026-07-01T12:00", "2026-07-01T12:00")).toBe(0);
    expect(d("2028-02-28T12:00", "2028-03-01T12:00")).toBe(2880);
  });
  it("noche en que se retrasa el reloj (25 de octubre de 2026, Madrid): hay una hora repetida", () => {
    expect(d("2026-10-25T01:00", "2026-10-25T04:00")).toBe(240);
    expect(d("2026-10-25T00:00", "2026-10-26T00:00")).toBe(1500);
  });
  it("hora ambigua: se toma su primera aparición", () => {
    expect(d("2026-10-25T02:30", "2026-10-25T02:45")).toBe(15);
    expect(d("2026-10-25T02:30", "2026-10-25T03:30")).toBe(120);
  });
  it("noche en que se adelanta el reloj (29 de marzo de 2026): falta una hora", () => {
    expect(d("2026-03-29T01:00", "2026-03-29T04:00")).toBe(120);
    expect(d("2026-03-29T00:00", "2026-03-30T00:00")).toBe(1380);
  });
  it("hora inexistente: se desplaza hacia delante", () => {
    expect(d("2026-03-29T02:30", "2026-03-29T03:30")).toBe(0);
    expect(d("2026-03-29T02:30", "2026-03-29T04:00")).toBe(30);
  });
  it("otras zonas: Canarias y UTC", () => {
    expect(d("2026-10-25T00:00", "2026-10-25T03:00", "Atlantic/Canary")).toBe(240);
    expect(d("2026-10-25T01:00", "2026-10-25T04:00", "UTC")).toBe(180);
    expect(d("2026-10-25T01:00", "2026-10-25T04:00", "Atlantic/Canary")).toBe(180 + 60);
  });
  it("fin anterior al inicio: RangeError", () => {
    expect(() => d("2026-10-10T22:00", "2026-10-10T21:59")).toThrow(RangeError);
  });
  it("formatos y fechas no válidos: RangeError", () => {
    for (const malo of ["2026-10-25 01:00", "2026-13-01T00:00", "2026-02-30T10:00", "2026-10-25T24:00", "2026-10-25T10:60", "mañana", "2026-10-25T1:00"]) {
      expect(() => d(malo, "2026-12-01T00:00")).toThrow(RangeError);
      expect(() => d("2026-01-01T00:00", malo)).toThrow(RangeError);
    }
  });
  it("zona inexistente: RangeError", () => {
    expect(() => d("2026-10-10T20:00", "2026-10-10T22:00", "Marte/Olympus")).toThrow(RangeError);
  });
});
