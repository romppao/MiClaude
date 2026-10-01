import { describe, expect, it, vi } from "vitest";

vi.mock("../../src/lib/common/db", () => ({ db: {} }));
vi.mock("next/navigation", () => ({ redirect: (d: string) => { throw new Error(`redirect:${d}`); } }));

import { go, str } from "../../src/app/actions/shared";

const formulario = (campos: Record<string, string>) => { const f = new FormData(); for (const [k, v] of Object.entries(campos)) f.set(k, v); return f; };

describe("ayudantes de las acciones", () => {
  it("str recorta espacios y elimina caracteres nulos (darían un error 500 en PostgreSQL)", () => {
    expect(str(formulario({ a: "  hola\u0000 mundo  " }), "a")).toBe("hola mundo");
    expect(str(formulario({}), "falta")).toBe("");
  });
  it("go añade el aviso o el problema a la dirección y conserva lo que ya llevaba", () => {
    expect(() => go("/mi-ficha", { aviso: "ok" })).toThrow("redirect:/mi-ficha?aviso=ok");
    expect(() => go("/entrar?next=%2Fx", { problema: "sin_sesion" })).toThrow("redirect:/entrar?next=%2Fx&problema=sin_sesion");
    expect(() => go("/inicio")).toThrow("redirect:/inicio");
  });
});
