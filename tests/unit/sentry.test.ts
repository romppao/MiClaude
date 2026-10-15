import { afterEach, describe, expect, it, vi } from "vitest";
import { avisarASentry, leerDsn, sobre } from "../../src/lib/common/sentry";

// Avisos de fallos a Sentry sin SDK (T-010): src/lib/common/sentry.ts.
const DSN = "https://abc123@o42.ingest.de.sentry.io/777";
const fallo = { mensaje: "No se pudo enviar el correo de [correo]", origen: "CORREO", ruta: "/registro", huella: "correo-0011", version: "0.18.3", pila: null };

afterEach(() => vi.restoreAllMocks());

describe("Sentry", () => {
  it("lee el DSN y calcula la dirección de envío; rechaza los no válidos", () => {
    expect(leerDsn(DSN)).toEqual({ endpoint: "https://o42.ingest.de.sentry.io/api/777/envelope/", clave: "abc123", dsn: DSN });
    for (const malo of [undefined, "", "no-es-url", "http://abc@o1.ingest.sentry.io/1", "https://o1.ingest.sentry.io/1", "https://abc@o1.ingest.sentry.io/proyecto"]) expect(leerDsn(malo)).toBeNull();
  });
  it("el sobre lleva el mensaje ya tachado, origen, ruta, versión y huella; nada del usuario", () => {
    const [cabecera, tipo, evento] = sobre(fallo, leerDsn(DSN)!, new Date("2026-10-15T10:00:00Z"), "e1").split("\n").map((l) => JSON.parse(l));
    expect(cabecera).toMatchObject({ event_id: "e1", dsn: DSN });
    expect(tipo).toEqual({ type: "event" });
    expect(evento).toMatchObject({ level: "error", release: "lona@0.18.3", message: { formatted: fallo.mensaje }, tags: { origen: "CORREO", ruta: "/registro" }, fingerprint: ["correo-0011"] });
    expect(JSON.stringify(evento)).not.toMatch(/user|ip_address|email/);
  });
  it("sin DSN no envía nada; con DSN envía y nunca lanza", async () => {
    const llamada = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));
    expect(await avisarASentry(fallo, {} as unknown as NodeJS.ProcessEnv)).toBe(false);
    expect(llamada).not.toHaveBeenCalled();
    expect(await avisarASentry(fallo, { SENTRY_DSN: DSN } as unknown as NodeJS.ProcessEnv)).toBe(true);
    expect(String(llamada.mock.calls[0][0])).toBe("https://o42.ingest.de.sentry.io/api/777/envelope/");
    expect((llamada.mock.calls[0][1] as RequestInit).headers).toMatchObject({ "X-Sentry-Auth": expect.stringContaining("sentry_key=abc123") });
    llamada.mockRejectedValue(new Error("sin red"));
    expect(await avisarASentry(fallo, { SENTRY_DSN: DSN } as unknown as NodeJS.ProcessEnv)).toBe(false);
  });
});
