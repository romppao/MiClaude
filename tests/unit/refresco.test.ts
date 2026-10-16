/** Datos al día: qué pantallas se actualizan solas y cuándo toca hacerlo. */
import { describe, expect, it } from "vitest";
import { INTERVALO_RAPIDO_MS, INTERVALO_REFRESCO_MS, MINIMO_ENTRE_REFRESCOS_MS, intervaloDe, rutaConRefresco, tocaRefrescar } from "../../src/lib/common/refresco";

describe("pantallas que se actualizan solas", () => {
  it.each(["/", "/veladas", "/veladas/velada-demo", "/peleadores", "/peleadores/ana-lopez", "/entrenadores", "/gimnasios/club-demo", "/ranking", "/clases", "/avisos", "/mi-panel", "/siguiendo", "/mis-reservas", "/mis-inscripciones", "/disciplinas/boxeo"])("sí: %s", (r) => {
    expect(rutaConRefresco(r)).toBe(true);
  });
  it.each(["/mi-ficha", "/mi-ficha/trayectoria", "/compartir", "/registro", "/entrar", "/organizador", "/organizador/velada/inscripciones", "/moderacion", "/mi-cuenta/eliminar", "/clases/abc/solicitar", "/veladas/velada-demo/reservar", "/peleadores/ana/editar"])("no, hay formulario o es de gestión: %s", (r) => {
    expect(rutaConRefresco(r)).toBe(false);
  });
});

describe("cuándo toca actualizar", () => {
  const base = { ahora: 1_000_000, ultimo: 1_000_000 - MINIMO_ENTRE_REFRESCOS_MS, visible: true, escribiendo: false, ventanaAbierta: false };
  it("toca cuando la pestaña se ve y ha pasado el mínimo", () => expect(tocaRefrescar(base)).toBe(true));
  it("no toca si se actualizó hace poco", () => expect(tocaRefrescar({ ...base, ultimo: base.ahora - 1000 })).toBe(false));
  it("no toca si la pestaña no se ve", () => expect(tocaRefrescar({ ...base, visible: false })).toBe(false));
  it("no toca mientras la persona escribe", () => expect(tocaRefrescar({ ...base, escribiendo: true })).toBe(false));
  it("no toca con una ventana abierta", () => expect(tocaRefrescar({ ...base, ventanaAbierta: true })).toBe(false));
  it("el intervalo es de minutos, no de segundos (el coste de la base de datos importa)", () => expect(INTERVALO_REFRESCO_MS).toBeGreaterThanOrEqual(60_000));
});

describe("cada cuánto", () => {
  it("las veladas, los avisos y las inscripciones, cada medio minuto", () => {
    for (const r of ["/veladas/velada-demo", "/avisos", "/mis-inscripciones"]) expect(intervaloDe(r)).toBe(INTERVALO_RAPIDO_MS);
  });
  it("el resto, con calma, y nunca por debajo de 30 s (coste de la base de datos)", () => {
    expect(intervaloDe("/peleadores")).toBe(INTERVALO_REFRESCO_MS);
    expect(INTERVALO_RAPIDO_MS).toBeGreaterThanOrEqual(30_000);
  });
});
