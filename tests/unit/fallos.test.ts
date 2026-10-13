import { beforeEach, describe, expect, it, vi } from "vitest";

// Base en memoria: lo justo para registrarFallo (buscar por huella, crear, actualizar) y el historial.
const filas = new Map<string, Record<string, unknown>>();
const historial: Record<string, unknown>[] = [];
const db = {
  appError: {
    findUnique: vi.fn(async ({ where }: { where: { fingerprint: string } }) => [...filas.values()].find((f) => f.fingerprint === where.fingerprint) ?? null),
    create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => { const f = { id: `f${filas.size + 1}`, count: 1, status: "OPEN", ...data }; filas.set(f.id as string, f); return f; }),
    update: vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
      const f = filas.get(where.id)!;
      for (const [k, v] of Object.entries(data)) f[k] = k === "count" ? (f.count as number) + (v as { increment: number }).increment : v === undefined ? f[k] : v;
      return f;
    }),
  },
  auditLog: { create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => { historial.push(data); return data; }) },
};
vi.mock("../../src/lib/common/db", () => ({ db }));

const { registrarFallo, tacharDatos, huellaFallo, normalizarMensaje, normalizarRuta } = await import("../../src/lib/common/fallos");

beforeEach(() => { filas.clear(); historial.length = 0; vi.spyOn(console, "error").mockImplementation(() => {}); });

describe("registro de fallos", () => {
  it("tacha correos, claves de enlaces, tokens largos y cadenas de conexión", () => {
    const t = tacharDatos("Fallo para ana.perez+1@correo.es en /recuperar/nueva?token=abc123&x=1 con postgresql://u:p@host/db y clave a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7");
    expect(t).not.toContain("ana.perez");
    expect(t).toContain("[correo]");
    expect(t).toContain("token=[oculto]");
    expect(t).toContain("postgresql://[oculto]");
    expect(t).toContain("[clave]");
  });
  it("reconoce el mismo fallo aunque cambien números, identificadores o la consulta", () => {
    expect(normalizarMensaje("No existe el combate 123 (cmg8x1y2z3a4b5c6d7e8f9)")).toBe(normalizarMensaje("No existe el combate 98 (clz0000000000000000000a)"));
    expect(normalizarRuta("/veladas/12?pagina=3#cartel")).toBe("/veladas/#");
    expect(huellaFallo("PAGINA", "Fallo 1", "/a/1")).toBe(huellaFallo("PAGINA", "Fallo 2", "/a/2"));
    expect(huellaFallo("PAGINA", "Fallo", "/a")).not.toBe(huellaFallo("ACCION", "Fallo", "/a"));
  });
  it("guarda el fallo la primera vez y suma las repeticiones en vez de duplicar", async () => {
    await registrarFallo({ origen: "PAGINA", error: new Error("Algo se rompió en 1"), ruta: "/peleadores/[slug]" });
    await registrarFallo({ origen: "PAGINA", error: new Error("Algo se rompió en 2"), ruta: "/peleadores/[slug]" });
    expect(filas.size).toBe(1);
    expect([...filas.values()][0].count).toBe(2);
  });
  it("añade el contexto en palabras delante del mensaje técnico", async () => {
    await registrarFallo({ origen: "CORREO", contexto: "No se pudo enviar el correo «Hola»", error: new Error("timeout") });
    expect([...filas.values()][0].message).toBe("No se pudo enviar el correo «Hola»: timeout");
  });
  it("un fallo resuelto que vuelve a pasar se reabre y queda en el historial", async () => {
    await registrarFallo({ origen: "ACCION", error: "Fallo repetido" });
    const f = [...filas.values()][0];
    f.status = "RESOLVED";
    await registrarFallo({ origen: "ACCION", error: "Fallo repetido" });
    expect(f.status).toBe("OPEN");
    expect(historial).toEqual([expect.objectContaining({ entity: "APP_ERROR", action: "FALLO_REAPARECE" })]);
  });
  it("un fallo descartado sigue descartado aunque se repita (solo suma)", async () => {
    await registrarFallo({ origen: "CLIENTE", error: "Extensión del navegador" });
    const f = [...filas.values()][0];
    f.status = "IGNORED";
    await registrarFallo({ origen: "CLIENTE", error: "Extensión del navegador" });
    expect(f.status).toBe("IGNORED");
    expect(f.count).toBe(2);
  });
  it("nunca lanza, aunque la base de datos falle", async () => {
    db.appError.findUnique.mockRejectedValueOnce(new Error("base caída"));
    await expect(registrarFallo({ origen: "SERVIDOR", error: new Error("x") })).resolves.toBeUndefined();
  });
});
