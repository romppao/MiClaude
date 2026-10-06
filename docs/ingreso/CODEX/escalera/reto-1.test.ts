import { expect, it } from "vitest";
import { recortarTexto } from "./reto-1";
it("cuenta puntos de código y no parte palabras", () => { expect(recortarTexto("hola 😀 mundo", 7)).toBe("hola 😀…"); expect(recortarTexto("😀😀😀", 2)).toBe("😀…"); });
it("limpia puntuación y valida el máximo", () => { expect(recortarTexto("hola, mundo", 6)).toBe("hola…"); expect(recortarTexto(" palabra", 2)).toBe("…"); expect(() => recortarTexto("x", 1.2)).toThrow(RangeError); });
