import { describe, expect, it } from "vitest";
import { hasOwn, lookup, oneParam } from "../../src/lib/common/safe";
import { REPORT_REASONS } from "../../src/lib/community/reports";
import { AVISOS, PROBLEMAS } from "../../src/lib/common/messages";

const MALOS = ["__proto__", "constructor", "toString", "hasOwnProperty", "valueOf", "prototype", ""];

describe("claves heredadas", () => {
  it("hasOwn distingue claves propias de heredadas", () => {
    for (const k of MALOS) expect(hasOwn({ a: 1 }, k)).toBe(false);
    expect(hasOwn({ a: 1 }, "a")).toBe(true);
  });
  it("lookup no devuelve nunca objetos ni funciones del prototipo", () => {
    for (const k of MALOS) {
      expect(lookup(REPORT_REASONS, k)).toBeUndefined();
      expect(lookup(AVISOS, k)).toBeUndefined();
      expect(lookup(PROBLEMAS, k)).toBeUndefined();
    }
    expect(lookup(REPORT_REASONS, "OTRO")).toBe("Otro motivo");
    expect(lookup(AVISOS, null)).toBeUndefined();
  });
  it("oneParam toma el primer valor de un parámetro repetido", () => {
    expect(oneParam(["a", "b"])).toBe("a");
    expect(oneParam("a")).toBe("a");
    expect(oneParam(undefined)).toBeUndefined();
  });
});
