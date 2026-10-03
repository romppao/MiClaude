import { describe, expect, it, vi } from "vitest";

vi.mock("../../src/lib/common/db", () => ({ db: {} }));
vi.mock("next/navigation", () => ({ redirect: (d: string) => { throw new Error(`redirect:${d}`); } }));

import { go, returnTo, str } from "../../src/app/actions/shared";

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
  it("una respuesta conserva los filtros y la sección sin convertirla en parte del mensaje", () => {
    expect(() => go("/moderacion?avisos=3#avisos", { aviso: "aviso_resuelto" })).toThrow("redirect:/moderacion?avisos=3&seccion=avisos&aviso=aviso_resuelto");
    expect(() => go("/respaldar?q=Copa?2026", { aviso: "ok" })).toThrow("redirect:/respaldar?q=Copa%3F2026&aviso=ok");
  });
  it("un mensaje nuevo sustituye al anterior de distinto tipo", () => {
    expect(() => go("/respaldar?q=Copa&problema=anterior#titulos", { aviso: "ok" })).toThrow("redirect:/respaldar?q=Copa&seccion=titulos&aviso=ok");
    expect(() => go("/respaldar?aviso=anterior", { problema: "error" })).toThrow("redirect:/respaldar?problema=error");
  });
  it("returnTo conserva el contexto solo dentro de la pantalla autorizada", () => {
    expect(returnTo(formulario({ back: "/moderacion?avisos=3#avisos" }), "/moderacion")).toBe("/moderacion?avisos=3#avisos");
    for (const back of ["https://example.com", "//example.com", "/\\example.com", "/moderacion/acreditaciones", "/otra", "/moderacion/../otra"]) {
      expect(returnTo(formulario({ back }), "/moderacion")).toBe("/moderacion");
    }
  });
});
