import { beforeEach, describe, expect, it, vi } from "vitest";

/** Recuperar la contraseña con un enlace inválido no debe costar el cálculo del hash (64 MiB): la acción es pública. */
const mundo = vi.hoisted(() => ({ hash: vi.fn(async () => "hash"), tokenValido: false }));

vi.mock("../../src/lib/common/db", () => ({
  db: new Proxy({}, { get: () => new Proxy({}, { get: () => async () => null }) }),
}));
vi.mock("../../src/lib/accounts/password", () => ({ hashPassword: mundo.hash, verifyPassword: vi.fn(), needsRehash: vi.fn(), dummyHash: vi.fn() }));
vi.mock("../../src/lib/accounts/auth", async (original) => ({
  ...(await original<object>()),
  isResetTokenUsable: async () => mundo.tokenValido,
  resetPasswordWithToken: async () => null,
}));
vi.mock("next/navigation", () => ({ redirect: (d: string) => { throw new Error(`redirect:${d}`); } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/server", () => ({ after: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined, set: vi.fn(), delete: vi.fn() }), headers: async () => new Headers() }));

import { resetPassword } from "../../src/app/actions/accounts";

const formulario = (campos: Record<string, string>) => { const f = new FormData(); for (const [k, v] of Object.entries(campos)) f.set(k, v); return f; };
const destino = async (campos: Record<string, string>) => { try { await resetPassword(formulario(campos)); } catch (e) { return (e as Error).message; } return "(sin redirección)"; };

describe("resetPassword", () => {
  beforeEach(() => { mundo.hash.mockClear(); mundo.tokenValido = false; });
  it("con un enlace que no sirve responde sin calcular el hash", async () => {
    expect(await destino({ token: "basura", password: "contraseña-larga-1", repeat: "contraseña-larga-1" })).toBe("redirect:/recuperar?problema=token_invalido");
    expect(mundo.hash).not.toHaveBeenCalled();
  });
  it("las contraseñas distintas o demasiado cortas se rechazan antes de nada", async () => {
    expect(await destino({ token: "t", password: "contraseña-larga-1", repeat: "otra" })).toContain("problema=contrasenas_distintas");
    expect(await destino({ token: "t", password: "corta", repeat: "corta" })).toContain("problema=registro_password");
    expect(mundo.hash).not.toHaveBeenCalled();
  });
  it("con un enlace válido sí se calcula el hash (y se intenta gastar el enlace)", async () => {
    mundo.tokenValido = true;
    await destino({ token: "bueno", password: "contraseña-larga-1", repeat: "contraseña-larga-1" });
    expect(mundo.hash).toHaveBeenCalledTimes(1);
  });
});
