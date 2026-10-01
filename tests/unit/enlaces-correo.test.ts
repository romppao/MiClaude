import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";

const db = vi.hoisted(() => {
  const d: Record<string, any> = {
    emailToken: { findUnique: vi.fn(), deleteMany: vi.fn(), create: vi.fn() },
    user: { update: vi.fn(), findUnique: vi.fn() },
    session: { deleteMany: vi.fn() },
  };
  d.$transaction = vi.fn(async (a: unknown) => (typeof a === "function" ? (a as (tx: unknown) => unknown)(d) : Promise.all(a as unknown[])));
  return d;
});
vi.mock("../../src/lib/common/db", () => ({ db }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined, set: vi.fn(), delete: vi.fn() }) }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("../../src/lib/common/mail", () => ({ APP_URL: "https://ring.test", sendMail: vi.fn(async () => true) }));

import { consumeVerificationToken, isResetTokenUsable, resetPasswordWithToken, unsubscribeWithToken } from "../../src/lib/accounts/auth";

const sha = (t: string) => createHash("sha256").update(t).digest("hex");
const futuro = () => new Date(Date.now() + 36e5);
const pasado = () => new Date(Date.now() - 1000);
const fila = (kind: string, expiresAt = futuro()) => ({ id: "x", userId: "u1", kind, expiresAt });

beforeEach(() => {
  vi.clearAllMocks();
  db.emailToken.deleteMany.mockResolvedValue({ count: 1 });
  db.user.findUnique.mockResolvedValue({ emailVerifiedAt: null });
  db.user.update.mockResolvedValue({ id: "u1" });
});

describe("enlace de verificación del correo", () => {
  it("busca el enlace por su huella, nunca por el token en claro", async () => {
    db.emailToken.findUnique.mockResolvedValue(null);
    await consumeVerificationToken("token-secreto");
    expect(db.emailToken.findUnique).toHaveBeenCalledWith({ where: { id: sha("token-secreto") } });
  });
  it("uno válido verifica el correo y se gasta", async () => {
    db.emailToken.findUnique.mockResolvedValue(fila("VERIFY"));
    expect(await consumeVerificationToken("t")).toBe(true);
    expect(db.emailToken.deleteMany).toHaveBeenCalled();
    expect(db.user.update.mock.calls[0][0].data.emailVerifiedAt).toBeInstanceOf(Date);
  });
  it("no sirve si no existe, ha caducado o es de otro tipo (recuperar contraseña, baja)", async () => {
    for (const row of [null, fila("VERIFY", pasado()), fila("RESET"), fila("UNSUB")]) {
      db.emailToken.findUnique.mockResolvedValue(row);
      expect(await consumeVerificationToken("t")).toBe(false);
    }
    expect(db.user.update).not.toHaveBeenCalled();
  });
  it("si otra petición lo gastó a la vez, esta no verifica nada", async () => {
    db.emailToken.findUnique.mockResolvedValue(fila("VERIFY"));
    db.emailToken.deleteMany.mockResolvedValue({ count: 0 });
    expect(await consumeVerificationToken("t")).toBe(false);
    expect(db.user.update).not.toHaveBeenCalled();
  });
});

describe("enlace para elegir una contraseña nueva", () => {
  it("uno válido cambia la contraseña, gasta todos los enlaces, cierra todas las sesiones y verifica el correo", async () => {
    db.emailToken.findUnique.mockResolvedValue(fila("RESET"));
    const u = await resetPasswordWithToken("t", "hash-nuevo");
    expect(u).toEqual({ id: "u1" });
    expect(db.user.update.mock.calls[0][0].data.passwordHash).toBe("hash-nuevo");
    expect(db.user.update.mock.calls[0][0].data.emailVerifiedAt).toBeInstanceOf(Date);
    expect(db.emailToken.deleteMany).toHaveBeenCalledWith({ where: { userId: "u1" } });
    expect(db.session.deleteMany).toHaveBeenCalledWith({ where: { userId: "u1" } });
  });
  it("si el correo ya estaba verificado, conserva la fecha original", async () => {
    const antes = new Date("2026-01-01T00:00:00Z");
    db.user.findUnique.mockResolvedValue({ emailVerifiedAt: antes });
    db.emailToken.findUnique.mockResolvedValue(fila("RESET"));
    await resetPasswordWithToken("t", "h");
    expect(db.user.update.mock.calls[0][0].data.emailVerifiedAt).toBe(antes);
  });
  it("no sirve si no existe, ha caducado, es de otro tipo o ya se gastó", async () => {
    for (const row of [null, fila("RESET", pasado()), fila("VERIFY"), fila("UNSUB")]) {
      db.emailToken.findUnique.mockResolvedValue(row);
      expect(await resetPasswordWithToken("t", "h")).toBeNull();
    }
    db.emailToken.findUnique.mockResolvedValue(fila("RESET"));
    db.emailToken.deleteMany.mockResolvedValue({ count: 0 });
    expect(await resetPasswordWithToken("t", "h")).toBeNull();
    expect(db.user.update).not.toHaveBeenCalled();
    expect(db.session.deleteMany).not.toHaveBeenCalled();
  });
  it("la comprobación de solo lectura de la página distingue los mismos casos", async () => {
    db.emailToken.findUnique.mockResolvedValue(fila("RESET"));
    expect(await isResetTokenUsable("t")).toBe(true);
    for (const row of [null, fila("RESET", pasado()), fila("VERIFY")]) {
      db.emailToken.findUnique.mockResolvedValue(row);
      expect(await isResetTokenUsable("t")).toBe(false);
    }
    expect(db.emailToken.deleteMany).not.toHaveBeenCalled(); // mirar la página no gasta el enlace
  });
});

describe("enlace de baja de los avisos", () => {
  it("uno válido desactiva los avisos y puede usarse más de una vez", async () => {
    db.emailToken.findUnique.mockResolvedValue(fila("UNSUB"));
    expect(await unsubscribeWithToken("t")).toBe(true);
    expect(await unsubscribeWithToken("t")).toBe(true);
    expect(db.user.update).toHaveBeenCalledWith({ where: { id: "u1" }, data: { notifyEmails: false } });
  });
  it("no sirve si no existe, ha caducado o es de otro tipo", async () => {
    for (const row of [null, fila("UNSUB", pasado()), fila("RESET"), fila("VERIFY")]) {
      db.emailToken.findUnique.mockResolvedValue(row);
      expect(await unsubscribeWithToken("t")).toBe(false);
    }
    expect(db.user.update).not.toHaveBeenCalled();
  });
});
