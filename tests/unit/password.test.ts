import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../../src/lib/password";

describe("contraseñas", () => {
  it("verifica la contraseña correcta y rechaza la incorrecta", () => {
    const h = hashPassword("contraseña123");
    expect(verifyPassword("contraseña123", h)).toBe(true);
    expect(verifyPassword("otra", h)).toBe(false);
  });
  it("usa sal distinta cada vez y no guarda la contraseña en claro", () => {
    const a = hashPassword("x12345678"), b = hashPassword("x12345678");
    expect(a).not.toBe(b);
    expect(a).not.toContain("x12345678");
  });
  it("rechaza hashes mal formados sin lanzar", () => {
    expect(verifyPassword("x", "")).toBe(false);
    expect(verifyPassword("x", "sinseparador")).toBe(false);
  });
});
