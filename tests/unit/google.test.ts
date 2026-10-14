import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { decidirCuenta, escribirViaje, leerViaje, nuevoViaje, urlDeAutorizacion, validarIdToken } from "../../src/lib/accounts/google";

const CLIENTE = "cliente.apps.googleusercontent.com";
const AHORA = Date.UTC(2026, 9, 14, 12, 0, 0);
const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
const token = (claims: Record<string, unknown>) => `${b64({ alg: "RS256" })}.${b64(claims)}.firma`;
const validos = { iss: "https://accounts.google.com", aud: CLIENTE, exp: AHORA / 1000 + 600, nonce: "n1", sub: "1234567890", email: "Ana@Ejemplo.ES", email_verified: true, name: "  Ana   García " };

describe("entrar con Google: viaje y dirección de autorización", () => {
  it("prepara valores aleatorios distintos y solo admite tipos con registro por Google", () => {
    const a = nuevoViaje("registro", "peleador", "/mi-ficha");
    const b = nuevoViaje("registro", "peleador", "/mi-ficha");
    expect(a.state).not.toBe(b.state);
    expect(a.verifier).not.toBe(a.nonce);
    expect(a).toMatchObject({ modo: "registro", tipo: "peleador", next: "/mi-ficha" });
    expect(nuevoViaje("otro", "entidad", "").tipo).toBe("usuario"); // la entidad se registra con correo y contraseña
    expect(nuevoViaje("otro", "x", "").modo).toBe("entrar");
  });

  it("la cookie del viaje se lee igual que se escribió y rechaza lo manipulado", () => {
    const v = nuevoViaje("entrar", "", "/");
    expect(leerViaje(escribirViaje(v))).toEqual(v);
    expect(leerViaje("no-es-json")).toBeNull();
    expect(leerViaje(Buffer.from(JSON.stringify({ state: 1 })).toString("base64url"))).toBeNull();
    expect(leerViaje(undefined)).toBeNull();
  });

  it("la dirección de Google lleva cliente, vuelta, permisos básicos, state, nonce y PKCE S256", () => {
    const v = nuevoViaje("entrar", "", "");
    const u = new URL(urlDeAutorizacion({ clientId: CLIENTE, redirectUri: "https://lona.test/api/auth/google/callback" }, v));
    expect(u.origin + u.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    expect(u.searchParams.get("client_id")).toBe(CLIENTE);
    expect(u.searchParams.get("redirect_uri")).toBe("https://lona.test/api/auth/google/callback");
    expect(u.searchParams.get("scope")).toBe("openid email profile");
    expect(u.searchParams.get("response_type")).toBe("code");
    expect(u.searchParams.get("state")).toBe(v.state);
    expect(u.searchParams.get("nonce")).toBe(v.nonce);
    expect(u.searchParams.get("code_challenge_method")).toBe("S256");
    expect(u.searchParams.get("code_challenge")).toBe(createHash("sha256").update(v.verifier).digest("base64url"));
  });
});

describe("entrar con Google: validación del id_token", () => {
  const validar = (claims: Record<string, unknown>) => validarIdToken(token(claims), { clientId: CLIENTE, nonce: "n1", ahora: AHORA });

  it("acepta un token correcto y normaliza correo y nombre", () => {
    expect(validar(validos)).toEqual({ ok: true, identidad: { sub: "1234567890", email: "ana@ejemplo.es", nombre: "Ana García" } });
    expect(validar({ ...validos, iss: "accounts.google.com", aud: [CLIENTE, "otro"], email_verified: "true", name: undefined })).toMatchObject({ ok: true, identidad: { nombre: "Ana" } });
  });

  it.each([
    ["emisor", { iss: "https://malo.example" }],
    ["destinatario", { aud: "otro-cliente" }],
    ["caducado", { exp: AHORA / 1000 - 1 }],
    ["nonce", { nonce: "otro" }],
    ["sub", { sub: "" }],
    ["correo", { email: "sin-arroba" }],
    ["correo_sin_confirmar", { email_verified: false }],
  ])("rechaza el token por %s", (motivo, cambio) => {
    expect(validar({ ...validos, ...cambio })).toEqual({ ok: false, motivo });
  });

  it("rechaza lo que no es un JWT", () => {
    expect(validarIdToken("abc", { clientId: CLIENTE, nonce: "n1", ahora: AHORA })).toEqual({ ok: false, motivo: "formato" });
    expect(validarIdToken("a.%%%.c", { clientId: CLIENTE, nonce: "n1", ahora: AHORA })).toEqual({ ok: false, motivo: "formato" });
  });
});

describe("entrar con Google: qué cuenta usar", () => {
  it("si ya está vinculada, entra en ella", () => {
    expect(decidirCuenta({ id: "u1" }, { id: "u1", googleSub: "s", emailVerifiedAt: new Date() })).toEqual({ accion: "entrar", userId: "u1" });
  });
  it("si hay una cuenta con ese correo ya confirmado, la vincula sin tocar su contraseña", () => {
    expect(decidirCuenta(null, { id: "u2", googleSub: null, emailVerifiedAt: new Date() })).toEqual({ accion: "vincular", userId: "u2", protegerCuenta: false });
  });
  it("si esa cuenta no había confirmado el correo (posible secuestro previo), se protege antes de vincular", () => {
    expect(decidirCuenta(null, { id: "u3", googleSub: null, emailVerifiedAt: null })).toEqual({ accion: "vincular", userId: "u3", protegerCuenta: true });
  });
  it("si no hay cuenta, se crea", () => {
    expect(decidirCuenta(null, null)).toEqual({ accion: "crear" });
  });
});
