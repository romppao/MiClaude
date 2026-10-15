import { describe, expect, it } from "vitest";
import { LIMITE_DIARIO_POR_DEFECTO, MAX_INTENTOS, RESERVA_CUENTA, cabeHoy, esperaTras, limiteDiario } from "../../src/lib/common/cola-correo";

// Cola de correos (T-008): reintentos y límite diario del proveedor (src/lib/common/cola-correo.ts).
describe("cola de correos", () => {
  it("espera cada vez más entre intentos: 1 min, 5 min, 30 min, 2 h y 12 h", () => {
    expect([1, 2, 3, 4, 5, 6].map(esperaTras)).toEqual([1, 5, 30, 120, 720, 720]);
    expect(MAX_INTENTOS).toBe(6);
  });
  it("el límite diario solo existe con proveedor real; por defecto, el del plan gratuito de Resend", () => {
    expect(limiteDiario({} as unknown as NodeJS.ProcessEnv)).toBe(Infinity);
    expect(limiteDiario({ RESEND_API_KEY: "x" } as unknown as NodeJS.ProcessEnv)).toBe(LIMITE_DIARIO_POR_DEFECTO);
    expect(limiteDiario({ RESEND_API_KEY: "x", MAIL_LIMITE_DIARIO: "3000" } as unknown as NodeJS.ProcessEnv)).toBe(3000);
    expect(limiteDiario({ RESEND_API_KEY: "x", MAIL_LIMITE_DIARIO: "nada" } as unknown as NodeJS.ProcessEnv)).toBe(LIMITE_DIARIO_POR_DEFECTO);
  });
  it("los correos de la cuenta tienen reservado el final del cupo: un día de muchos avisos no impide confirmar una cuenta", () => {
    const limite = 100;
    expect(cabeHoy(limite - RESERVA_CUENTA - 1, limite, 1)).toBe(true);
    expect(cabeHoy(limite - RESERVA_CUENTA, limite, 1)).toBe(false);
    expect(cabeHoy(limite - 1, limite, 0)).toBe(true);
    expect(cabeHoy(limite, limite, 0)).toBe(false);
    // Con un cupo muy pequeño, la reserva no se come todo.
    expect(cabeHoy(0, 4, 1)).toBe(true);
  });
});
