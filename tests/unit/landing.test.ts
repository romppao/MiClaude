import { describe, expect, it } from "vitest";
import { TIPOS_DE_CUENTA, TIPOS_DE_ENTIDAD, landingFor, parseTipoDeCuenta, parseTipoDeEntidad } from "../../src/lib/accounts/landing";

describe("aterrizaje por papel", () => {
  it("lleva a cada papel a su sitio", () => {
    expect(landingFor("FAN")).toBe("/");
    expect(landingFor("FIGHTER")).toBe("/mi-ficha");
    expect(landingFor("ORGANIZER")).toBe("/organizador");
    expect(landingFor("ADMIN")).toBe("/moderacion");
  });
  it("un papel desconocido va al inicio", () => {
    expect(landingFor("")).toBe("/");
    expect(landingFor("__proto__")).toBe("/");
  });
});

describe("tipos de cuenta del registro", () => {
  it("acepta solo los tres paneles", () => {
    for (const t of TIPOS_DE_CUENTA) expect(parseTipoDeCuenta(t)).toBe(t);
    expect(TIPOS_DE_CUENTA).toEqual(["usuario", "peleador", "entidad"]);
  });
  it("un tipo inventado cae en «usuario», sin dar permisos", () => {
    expect(parseTipoDeCuenta("admin")).toBe("usuario");
    expect(parseTipoDeCuenta("constructor")).toBe("usuario");
    expect(parseTipoDeCuenta("__proto__")).toBe("usuario");
  });
  it("un formulario antiguo con role=FIGHTER sigue creando un peleador", () => {
    expect(parseTipoDeCuenta("", "FIGHTER")).toBe("peleador");
    expect(parseTipoDeCuenta("", "ADMIN")).toBe("usuario");
  });
});

describe("tipos de entidad", () => {
  it("solo promotora y federación", () => {
    expect(TIPOS_DE_ENTIDAD).toEqual(["PROMOTORA", "FEDERACION"]);
    expect(parseTipoDeEntidad("FEDERACION")).toBe("FEDERACION");
    expect(parseTipoDeEntidad("GIMNASIO")).toBeNull();
    expect(parseTipoDeEntidad("")).toBeNull();
    expect(parseTipoDeEntidad("toString")).toBeNull();
  });
});
