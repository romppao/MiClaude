import { describe, expect, it } from "vitest";
import { PASOS_REGISTRO, ROL_INICIAL, TIPOS_DE_CUENTA, TIPOS_DE_ENTIDAD, landingFor, papelDe, puedeOrganizar, parseTipoDeCuenta, parseTipoDeEntidad } from "../../src/lib/accounts/landing";

describe("aterrizaje por papel", () => {
  it("lleva a cada papel a su sitio", () => {
    expect(landingFor("FAN")).toBe("/");
    expect(landingFor("FIGHTER")).toBe("/");
    expect(landingFor("TRAINER")).toBe("/");
    expect(landingFor("ORGANIZER")).toBe("/");
    expect(landingFor("ADMIN")).toBe("/moderacion");
  });
  it("un papel desconocido va al inicio", () => {
    expect(landingFor("")).toBe("/");
    expect(landingFor("__proto__")).toBe("/");
  });
});

describe("tipos de cuenta del registro", () => {
  it("acepta solo los cuatro tipos de cuenta", () => {
    for (const t of TIPOS_DE_CUENTA) expect(parseTipoDeCuenta(t)).toBe(t);
    expect(TIPOS_DE_CUENTA).toEqual(["usuario", "peleador", "entrenador", "entidad"]);
  });
  it("ningún tipo de cuenta empieza con permisos de organizador o de moderación", () => {
    for (const t of TIPOS_DE_CUENTA) expect(["FAN", "FIGHTER", "TRAINER"]).toContain(ROL_INICIAL[t]);
    expect(ROL_INICIAL.entidad).toBe("FAN");
  });
  it("cada tipo empieza eligiendo el tipo y sigue con sus datos", () => {
    for (const t of TIPOS_DE_CUENTA) expect(PASOS_REGISTRO[t].slice(0, 2)).toEqual(["tipo", "datos"]);
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
  it("solo promotora, federación y club", () => {
    expect(TIPOS_DE_ENTIDAD).toEqual(["PROMOTORA", "FEDERACION", "CLUB"]);
    expect(parseTipoDeEntidad("CLUB")).toBe("CLUB");
    expect(parseTipoDeEntidad("FEDERACION")).toBe("FEDERACION");
    expect(parseTipoDeEntidad("GIMNASIO")).toBeNull();
    expect(parseTipoDeEntidad("")).toBeNull();
    expect(parseTipoDeEntidad("toString")).toBeNull();
  });
});

describe("papel de la cuenta y permiso para organizar", () => {
  it("elige el papel por tipo de cuenta", () => {
    expect(papelDe(null)).toBe("visitante");
    expect(papelDe({ role: "FAN" })).toBe("usuario");
    expect(papelDe({ role: "FAN", fighter: { id: "x" } })).toBe("peleador");
    expect(papelDe({ role: "FIGHTER", fighter: null })).toBe("peleador");
    expect(papelDe({ role: "TRAINER", fighter: { id: "x" } })).toBe("entrenador");
    expect(papelDe({ role: "ORGANIZER" })).toBe("entidad");
    expect(papelDe({ role: "ADMIN" })).toBe("usuario");
  });
  it("los entrenadores organizan veladas e interclubs sin aprobación previa; aficionados y peleadores no", () => {
    expect(["ORGANIZER", "TRAINER", "ADMIN"].every(puedeOrganizar)).toBe(true);
    expect(["FAN", "FIGHTER", "", "__proto__"].some(puedeOrganizar)).toBe(false);
  });
});
