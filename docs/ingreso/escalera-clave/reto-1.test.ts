import { describe, it, expect } from "vitest";
const { recortarTexto } = await import(/* @vite-ignore */ `${process.env.RUTA_ENTREGA}/reto-1.ts`);
const largo = (s: string) => Array.from(s).length;

describe("reto 1 · recortarTexto", () => {
  it("devuelve el texto igual si cabe (incluso justo)", () => {
    expect(recortarTexto("hola", 10)).toBe("hola");
    expect(recortarTexto("hola", 4)).toBe("hola");
    expect(recortarTexto("  hola  ", 8)).toBe("  hola  ");
    expect(recortarTexto("", 5)).toBe("");
  });
  it("corta en el último espacio y añade «…»", () => {
    expect(recortarTexto("hola mundo feliz", 10)).toBe("hola…");
    expect(recortarTexto("Peleador de Madrid, campeón", 14)).toBe("Peleador de…");
  });
  it("conserva la última palabra si cabe entera", () => {
    expect(recortarTexto("hola mundo feliz", 11)).toBe("hola mundo…");
  });
  it("quita signos y espacios finales antes de «…»", () => {
    expect(recortarTexto("uno, dos tres", 8)).toBe("uno…");
    expect(recortarTexto("uno\ndos tres", 7)).toBe("uno…");
    expect(recortarTexto("¡Gran velada! Entradas ya", 14)).toBe("¡Gran velada…");
  });
  it("una sola palabra larga se corta en seco", () => {
    expect(recortarTexto("abcdefghij", 5)).toBe("abcd…");
  });
  it("no parte caracteres Unicode (emojis, acentos compuestos)", () => {
    const r = recortarTexto("🥊🥊🥊🥊🥊🥊", 4);
    expect(r).toBe("🥊🥊🥊…");
    expect(largo(r)).toBe(4);
    expect(recortarTexto("🥊🥊🥊🥊", 4)).toBe("🥊🥊🥊🥊");
  });
  it("máximos pequeños", () => {
    expect(recortarTexto("hola mundo", 1)).toBe("…");
    expect(recortarTexto("hola mundo", 0)).toBe("");
    expect(recortarTexto("hola mundo", -3)).toBe("");
    expect(recortarTexto("   hola mundo", 5)).toBe("…");
  });
  it("rechaza máximos que no son enteros", () => {
    expect(() => recortarTexto("hola", 1.5)).toThrow(RangeError);
    expect(() => recortarTexto("hola", NaN)).toThrow(RangeError);
    expect(() => recortarTexto("hola", Infinity)).toThrow(RangeError);
  });
  it("nunca supera el máximo (barrido determinista)", () => {
    const trozos = ["hola", "mundo,", "🥊", "pelea", "x", "  ", "año.", "KO!", "é"];
    let semilla = 7;
    const azar = () => (semilla = (semilla * 1103515245 + 12345) % 2147483648) / 2147483648;
    for (let i = 0; i < 400; i++) {
      const t = Array.from({ length: 1 + Math.floor(azar() * 12) }, () => trozos[Math.floor(azar() * trozos.length)]).join(azar() < 0.5 ? " " : "");
      const m = Math.floor(azar() * 20);
      const r = recortarTexto(t, m);
      expect(largo(r)).toBeLessThanOrEqual(Math.max(m, 0));
      if (largo(t) > m && m > 0) expect(r.endsWith("…")).toBe(true);
    }
  });
});
