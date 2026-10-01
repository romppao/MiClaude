import { describe, expect, it } from "vitest";
import { scryptSync, randomBytes } from "node:crypto";
import { dummyHash, hashPassword, needsRehash, verifyPassword } from "../../src/lib/accounts/password";

describe("contraseñas", () => {
  it("verifica la contraseña correcta y rechaza otra", async () => {
    const h = await hashPassword("contraseña123");
    expect(await verifyPassword("contraseña123", h)).toBe(true);
    expect(await verifyPassword("otra", h)).toBe(false);
  });
  it("cada hash lleva sal propia y sus parámetros", async () => {
    const a = await hashPassword("x12345678"), b = await hashPassword("x12345678");
    expect(a).not.toBe(b);
    expect(a).toMatch(/^scrypt\$65536\$8\$2\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
  });
  it("no acepta valores guardados mal formados", async () => {
    expect(await verifyPassword("x", "")).toBe(false);
    expect(await verifyPassword("x", "sinseparador")).toBe(false);
    expect(await verifyPassword("x", "scrypt$1$2")).toBe(false);
    expect(await verifyPassword("x", "scrypt$abc$8$2$aa$bb")).toBe(false);
  });
  it("rechaza parámetros desmesurados en lugar de agotar la memoria", async () => {
    expect(await verifyPassword("x", `scrypt$${2 ** 30}$8$1$${"aa".repeat(16)}$${"bb".repeat(64)}`)).toBe(false);
  });
  it("sigue verificando el formato anterior «sal:hash» y avisa de que hay que recalcularlo", async () => {
    const salt = randomBytes(16);
    const legacy = `${salt.toString("hex")}:${scryptSync("antigua123", salt, 64).toString("hex")}`;
    expect(await verifyPassword("antigua123", legacy)).toBe(true);
    expect(await verifyPassword("otra", legacy)).toBe(false);
    expect(needsRehash(legacy)).toBe(true);
  });
  it("un hash actual no necesita recalcularse", async () => {
    expect(needsRehash(await hashPassword("nueva12345"))).toBe(false);
    expect(needsRehash("basura")).toBe(false);
  });
  it("el hash de mentira tiene el mismo formato y no coincide con nada razonable", async () => {
    const d = await dummyHash();
    expect(d).toMatch(/^scrypt\$/);
    expect(await verifyPassword("", d)).toBe(false);
  });
});
