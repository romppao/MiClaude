import { beforeEach, describe, expect, it, vi } from "vitest";

// Base de datos simulada: una tabla de intentos en memoria con las dos operaciones que usa el límite.
const tabla = vi.hoisted(() => ({ filas: [] as { id: string; key: string; createdAt: Date }[], n: 0 }));
vi.mock("../../src/lib/common/db", () => ({
  db: {
    rateHit: {
      create: async ({ data }: { data: { key: string } }) => { const fila = { id: `h${++tabla.n}`, key: data.key, createdAt: new Date() }; tabla.filas.push(fila); return { id: fila.id }; },
      count: async ({ where }: { where: { key: string; createdAt: { gt: Date } } }) => tabla.filas.filter((f) => f.key === where.key && f.createdAt > where.createdAt.gt).length,
      deleteMany: async ({ where }: { where: { id?: string; key?: string } }) => { tabla.filas = tabla.filas.filter((f) => !(where.id ? f.id === where.id : f.key === where.key)); },
    },
  },
}));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));

import { MINUTO, normalizeIp, reservar } from "../../src/lib/accounts/ratelimit";

describe("dirección IP del cliente", () => {
  it("toma la que añadió el proxy de confianza (la última), no la que escribe el propio cliente (la primera)", () => {
    expect(normalizeIp("1.2.3.4, 203.0.113.7")).toBe("203.0.113.7"); // el cliente inventó 1.2.3.4; el proxy vio 203.0.113.7
    expect(normalizeIp("203.0.113.7")).toBe("203.0.113.7");
    expect(normalizeIp(" 2001:db8::1 ")).toBe("2001:db8::1");
  });
  it("con varios proxies de confianza cuenta desde el final", () => {
    expect(normalizeIp("1.2.3.4, 203.0.113.7, 10.0.0.1", 2)).toBe("203.0.113.7");
    expect(normalizeIp("203.0.113.7", 3)).toBe("203.0.113.7"); // la lista es más corta que los saltos: se usa la primera
  });
  it("ignora lo que no tiene aspecto de dirección o es la propia máquina", () => {
    for (const raw of [null, undefined, "", "   ", "unknown", "<script>", "127.0.0.1", "::1", "::ffff:127.0.0.1", "1".repeat(60)]) expect(normalizeIp(raw)).toBeNull();
  });
});

describe("reserva de intentos antes de comprobar una contraseña", () => {
  beforeEach(() => { tabla.filas = []; });
  it("admite los intentos hasta el máximo y rechaza el siguiente", async () => {
    for (let i = 1; i <= 8; i++) expect((await reservar("acceso:correo:a@x.es", 8, 15 * MINUTO)).permitido).toBe(true);
    expect((await reservar("acceso:correo:a@x.es", 8, 15 * MINUTO)).permitido).toBe(false);
  });
  it("con 200 peticiones simultáneas nunca se admiten más del máximo (comprobar y anotar no se separan)", async () => {
    const r = await Promise.all(Array.from({ length: 200 }, () => reservar("acceso:correo:b@x.es", 8, 15 * MINUTO)));
    expect(r.filter((x) => x.permitido).length).toBeLessThanOrEqual(8);
  });
  it("devolver la reserva (contraseña correcta) libera el intento", async () => {
    const reservas = [];
    for (let i = 0; i < 8; i++) reservas.push(await reservar("acceso:correo:c@x.es", 8, 15 * MINUTO));
    await reservas[0].devolver();
    expect((await reservar("acceso:correo:c@x.es", 8, 15 * MINUTO)).permitido).toBe(true);
  });
  it("cada clave tiene su propio contador", async () => {
    for (let i = 0; i < 9; i++) await reservar("acceso:correo:d@x.es", 8, 15 * MINUTO);
    expect((await reservar("acceso:correo:otro@x.es", 8, 15 * MINUTO)).permitido).toBe(true);
  });
});
