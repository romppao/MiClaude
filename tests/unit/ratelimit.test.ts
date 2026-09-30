import { describe, expect, it } from "vitest";
import { normalizeIp } from "../../src/lib/ratelimit";

describe("dirección IP del cliente", () => {
  it("toma la primera de la lista que añade el proxy", () => {
    expect(normalizeIp("203.0.113.7, 10.0.0.1")).toBe("203.0.113.7");
    expect(normalizeIp(" 2001:db8::1 ")).toBe("2001:db8::1");
  });
  it("ignora lo que no tiene aspecto de dirección o es la propia máquina", () => {
    for (const raw of [null, undefined, "", "   ", "unknown", "<script>", "127.0.0.1", "::1", "::ffff:127.0.0.1", "1".repeat(60)]) expect(normalizeIp(raw)).toBeNull();
  });
});
