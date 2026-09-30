import { afterEach, describe, expect, it, vi } from "vitest";
import { sendMail } from "../../src/lib/mail";

afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("envío de correo", () => {
  it("descarta destinatarios que no son una sola dirección válida", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    for (const to of ["a@b.es, c@d.es", "sin-arroba", "a@b", "a b@c.es", "a@b.es\nBcc: x@y.es"]) expect(await sendMail(to, "Hola", "texto")).toBe(false);
  });
  it("en modo registro escribe el mensaje en el log con el asunto en una sola línea", async () => {
    vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("MAIL_TRANSPORT", "log"); vi.stubEnv("RESEND_API_KEY", "");
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    expect(await sendMail("persona@ejemplo.es", "Asunto\r\nBcc: otro@ejemplo.es", "cuerpo")).toBe(true);
    const salida = String(log.mock.calls[0][0]);
    expect(salida).toContain('subject="Asunto Bcc: otro@ejemplo.es"');
    expect(salida.split("\n")[0]).toContain("to=persona@ejemplo.es");
  });
  it("en producción sin proveedor no envía nada y lo dice (false)", async () => {
    vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("MAIL_TRANSPORT", ""); vi.stubEnv("RESEND_API_KEY", "");
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    expect(await sendMail("persona@ejemplo.es", "Hola", "enlace-secreto")).toBe(false);
    expect(log).not.toHaveBeenCalled();
    expect(error.mock.calls.join()).not.toContain("enlace-secreto");
  });
  it("con proveedor pero sin remitente no envía", async () => {
    vi.stubEnv("RESEND_API_KEY", "clave"); vi.stubEnv("MAIL_FROM", "");
    vi.spyOn(console, "error").mockImplementation(() => {});
    const llamada = vi.spyOn(globalThis, "fetch");
    expect(await sendMail("persona@ejemplo.es", "Hola", "texto")).toBe(false);
    expect(llamada).not.toHaveBeenCalled();
  });
  it("con proveedor envía por HTTP y devuelve el resultado", async () => {
    vi.stubEnv("RESEND_API_KEY", "clave"); vi.stubEnv("MAIL_FROM", "Ring España <hola@ejemplo.es>");
    const llamada = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));
    expect(await sendMail("persona@ejemplo.es", "Hola", "texto")).toBe(true);
    const [url, init] = llamada.mock.calls[0];
    expect(String(url)).toBe("https://api.resend.com/emails");
    expect(JSON.parse(String((init as RequestInit).body))).toMatchObject({ to: ["persona@ejemplo.es"], subject: "Hola" });
    llamada.mockResolvedValue(new Response("{}", { status: 500 }));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await sendMail("persona@ejemplo.es", "Hola", "texto")).toBe(false);
    llamada.mockRejectedValue(new Error("sin red"));
    expect(await sendMail("persona@ejemplo.es", "Hola", "texto")).toBe(false);
  });
});
