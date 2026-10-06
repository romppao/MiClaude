import { describe, it, expect } from "vitest";
const { calcularRecord } = await import(/* @vite-ignore */ `${process.env.RUTA_ENTREGA}/reto-2.ts`);
const c = (fecha: string, resultado: string, metodo?: string) => (metodo ? { fecha, resultado, metodo } : { fecha, resultado });

describe("reto 2 · calcularRecord", () => {
  it("sin combates", () => {
    expect(calcularRecord([])).toEqual({ victorias: 0, derrotas: 0, empates: 0, sinResultado: 0, victoriasPorKO: 0, victoriasPorSumision: 0, victoriasPorDecision: 0, racha: { tipo: null, longitud: 0 } });
  });
  it("cuenta resultados y métodos de victoria", () => {
    const r = calcularRecord([
      c("2025-01-01", "V", "KO"), c("2025-02-01", "V", "TKO"), c("2025-03-01", "V", "SUMISION"),
      c("2025-04-01", "V", "DECISION"), c("2025-05-01", "V", "DESCALIFICACION"), c("2025-06-01", "V"),
      c("2025-07-01", "D", "KO"), c("2025-08-01", "E"), c("2025-09-01", "SR"),
    ]);
    expect(r).toMatchObject({ victorias: 6, derrotas: 1, empates: 1, sinResultado: 1, victoriasPorKO: 2, victoriasPorSumision: 1, victoriasPorDecision: 1 });
  });
  it("el método de una derrota o empate no cuenta como victoria", () => {
    const r = calcularRecord([c("2025-01-01", "D", "KO"), c("2025-02-01", "E", "DECISION")]);
    expect(r.victoriasPorKO + r.victoriasPorDecision).toBe(0);
  });
  it("racha actual: orden cronológico, no el de la lista", () => {
    const r = calcularRecord([c("2025-03-01", "V"), c("2025-01-01", "D"), c("2025-02-01", "V"), c("2025-04-01", "V")]);
    expect(r.racha).toEqual({ tipo: "V", longitud: 3 });
  });
  it("misma fecha: se respeta el orden original", () => {
    expect(calcularRecord([c("2025-01-01", "V"), c("2025-01-01", "D")]).racha).toEqual({ tipo: "D", longitud: 1 });
    expect(calcularRecord([c("2025-01-01", "D"), c("2025-01-01", "V")]).racha).toEqual({ tipo: "V", longitud: 1 });
  });
  it("los combates sin resultado no rompen ni alargan la racha", () => {
    const r = calcularRecord([c("2025-01-01", "V"), c("2025-02-01", "SR"), c("2025-03-01", "V")]);
    expect(r.racha).toEqual({ tipo: "V", longitud: 2 });
    expect(calcularRecord([c("2025-01-01", "SR")]).racha).toEqual({ tipo: null, longitud: 0 });
  });
  it("un empate es su propio tipo de racha", () => {
    expect(calcularRecord([c("2025-01-01", "V"), c("2025-02-01", "E"), c("2025-03-01", "E")]).racha).toEqual({ tipo: "E", longitud: 2 });
  });
  it("no modifica la entrada", () => {
    const lista = Object.freeze([Object.freeze(c("2025-02-01", "V")), Object.freeze(c("2025-01-01", "D"))]);
    expect(() => calcularRecord(lista)).not.toThrow();
    expect(lista[0].fecha).toBe("2025-02-01");
  });
  it("rechaza datos no válidos con RangeError", () => {
    expect(() => calcularRecord([c("2025-01-01", "X")])).toThrow(RangeError);
    expect(() => calcularRecord([c("2025-1-1", "V")])).toThrow(RangeError);
    expect(() => calcularRecord([c("2025-02-30", "V")])).toThrow(RangeError);
    expect(() => calcularRecord([c("2025-01-01", "V", "PUÑETAZO")])).toThrow(RangeError);
    expect(() => calcularRecord([c("2025-13-01", "V")])).toThrow(RangeError);
  });
  it("29 de febrero solo en años bisiestos", () => {
    expect(() => calcularRecord([c("2028-02-29", "V")])).not.toThrow();
    expect(() => calcularRecord([c("2027-02-29", "V")])).toThrow(RangeError);
  });
});
