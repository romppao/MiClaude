import { describe, expect, it } from "vitest";
import { base32, claveLegible, codigo, comprobarCodigo, desdeBase32, enlaceApp, gastarCodigoEmergencia, huella, intervalo, nuevaClave, nuevosCodigosEmergencia } from "../../src/lib/accounts/totp";
import { correoCreador, esCreador } from "../../src/lib/accounts/creador";
import { menuDe } from "../../src/lib/accounts/menu";

// Clave de los vectores de prueba de la RFC 6238 (apéndice B): «12345678901234567890» en ASCII.
const RFC = base32(Buffer.from("12345678901234567890"));

describe("códigos de la aplicación (RFC 6238)", () => {
  it("base32 ida y vuelta", () => {
    const b = Buffer.from([0, 1, 2, 250, 251, 252, 253, 254, 255, 7]);
    expect(desdeBase32(base32(b)).equals(b)).toBe(true);
    expect(RFC).toBe("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ");
  });
  it("coincide con los vectores oficiales de la RFC 6238 (SHA-1, 8 cifras)", () => {
    expect(codigo(RFC, Math.floor(59 / 30), 8)).toBe("94287082");
    expect(codigo(RFC, Math.floor(1111111109 / 30), 8)).toBe("07081804");
    expect(codigo(RFC, Math.floor(1234567890 / 30), 8)).toBe("89005924");
    expect(codigo(RFC, Math.floor(20000000000 / 30), 8)).toBe("65353130");
  });
  it("acepta el intervalo anterior, el actual y el siguiente, y nada más", () => {
    const ahora = 1_700_000_000_000, p = intervalo(ahora);
    for (const d of [-1, 0, 1]) expect(comprobarCodigo(RFC, codigo(RFC, p + d), { ahora })).toBe(p + d);
    expect(comprobarCodigo(RFC, codigo(RFC, p - 2), { ahora })).toBeNull();
    expect(comprobarCodigo(RFC, codigo(RFC, p + 2), { ahora })).toBeNull();
  });
  it("un código ya usado no vale dos veces", () => {
    const ahora = 1_700_000_000_000, p = intervalo(ahora);
    expect(comprobarCodigo(RFC, codigo(RFC, p), { ahora, ultimo: p })).toBeNull();
    expect(comprobarCodigo(RFC, codigo(RFC, p + 1), { ahora, ultimo: p })).toBe(p + 1);
  });
  it("rechaza lo que no son seis cifras y admite espacios", () => {
    const ahora = 1_700_000_000_000, c = codigo(RFC, intervalo(ahora));
    expect(comprobarCodigo(RFC, `${c.slice(0, 3)} ${c.slice(3)}`, { ahora })).not.toBeNull();
    for (const x of ["", "12345", "1234567", "abcdef"]) expect(comprobarCodigo(RFC, x, { ahora })).toBeNull();
  });
  it("las claves nuevas son de 160 bits, distintas y legibles", () => {
    const a = nuevaClave(), b = nuevaClave();
    expect(a).toMatch(/^[A-Z2-7]{32}$/);
    expect(a).not.toBe(b);
    expect(claveLegible(a).split(" ")).toHaveLength(8);
    expect(enlaceApp(a, "yo@correo.es")).toBe(`otpauth://totp/Ring%20Espa%C3%B1a%3Ayo%40correo.es?secret=${a}&issuer=Ring%20Espa%C3%B1a&algorithm=SHA1&digits=6&period=30`);
  });
});

describe("códigos de emergencia", () => {
  it("diez códigos XXXX-XXXX distintos; solo se guardan sus huellas", () => {
    const { claros, huellas } = nuevosCodigosEmergencia();
    expect(claros).toHaveLength(10);
    expect(new Set(claros).size).toBe(10);
    for (const c of claros) expect(c).toMatch(/^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
    expect(huellas.some((h) => claros.includes(h))).toBe(false);
  });
  it("cada uno sirve una sola vez y da igual mayúsculas, minúsculas o el guion", () => {
    const { claros, huellas } = nuevosCodigosEmergencia();
    const resto = gastarCodigoEmergencia(huellas, claros[3].toLowerCase().replace("-", " "));
    expect(resto).toHaveLength(9);
    expect(resto).not.toContain(huella(claros[3]));
    expect(gastarCodigoEmergencia(resto!, claros[3])).toBeNull();
    expect(gastarCodigoEmergencia(huellas, "AAAA-AAAA")).toBeNull();
    expect(gastarCodigoEmergencia(huellas, "")).toBeNull();
  });
});

describe("cuenta del creador", () => {
  const env = { CREADOR_CORREO: "  Fundador@Correo.es " } as unknown as NodeJS.ProcessEnv;
  it("es la del correo de CREADOR_CORREO, sin importar mayúsculas", () => {
    expect(correoCreador(env)).toBe("fundador@correo.es");
    expect(esCreador({ email: "fundador@correo.es", emailVerifiedAt: new Date() }, env)).toBe(true);
  });
  it("exige el correo confirmado: registrarse antes con ese correo no basta", () => {
    expect(esCreador({ email: "fundador@correo.es", emailVerifiedAt: null }, env)).toBe(false);
  });
  it("sin la variable no hay cuenta de creador", () => {
    expect(esCreador({ email: "fundador@correo.es", emailVerifiedAt: new Date() }, {} as unknown as NodeJS.ProcessEnv)).toBe(false);
    expect(esCreador({ email: "", emailVerifiedAt: new Date() }, { CREADOR_CORREO: "" } as unknown as NodeJS.ProcessEnv)).toBe(false);
    expect(esCreador(null, env)).toBe(false);
  });
  it("el menú del creador añade «Administración» sin pasar de cinco enlaces", () => {
    const cuenta = menuDe("usuario", { admin: true, canSupport: true, creador: true }).at(-1)!;
    expect(cuenta.enlaces.map((e) => e.href)).toContain("/moderacion/usuarios");
    expect(cuenta.enlaces.length).toBeLessThanOrEqual(5);
    expect(menuDe("usuario", { admin: true }).at(-1)!.enlaces.map((e) => e.href)).not.toContain("/moderacion/usuarios");
  });
});
