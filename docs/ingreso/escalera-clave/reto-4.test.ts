import { describe, it, expect } from "vitest";
const { crearLimitador } = await import(/* @vite-ignore */ `${process.env.RUTA_ENTREGA}/reto-4.ts`);
function reloj(inicio = 0) { let t = inicio; return { ahora: () => t, poner: (x: number) => { t = x; }, avanzar: (x: number) => { t += x; } }; }

describe("reto 4 · crearLimitador", () => {
  it("permite hasta el máximo y avisa cuántos quedan", () => {
    const r = reloj(1000);
    const l = crearLimitador({ maximo: 3, ventanaMs: 1000, ahora: r.ahora });
    expect(l.permitir("a")).toEqual({ permitido: true, restantes: 2, reintentarEnMs: 0 });
    expect(l.permitir("a")).toEqual({ permitido: true, restantes: 1, reintentarEnMs: 0 });
    expect(l.permitir("a")).toEqual({ permitido: true, restantes: 0, reintentarEnMs: 0 });
    expect(l.permitir("a")).toEqual({ permitido: false, restantes: 0, reintentarEnMs: 1000 });
  });
  it("ventana deslizante exacta: un intento deja de contar cuando cumple la ventana", () => {
    const r = reloj(0);
    const l = crearLimitador({ maximo: 2, ventanaMs: 1000, ahora: r.ahora });
    l.permitir("a"); r.poner(400); l.permitir("a");
    r.poner(999); expect(l.permitir("a")).toEqual({ permitido: false, restantes: 0, reintentarEnMs: 1 });
    r.poner(1000); expect(l.permitir("a")).toEqual({ permitido: true, restantes: 0, reintentarEnMs: 0 });
    r.poner(1000); expect(l.permitir("a")).toEqual({ permitido: false, restantes: 0, reintentarEnMs: 400 });
  });
  it("los intentos denegados no se registran (no alargan el bloqueo)", () => {
    const r = reloj(0);
    const l = crearLimitador({ maximo: 1, ventanaMs: 1000, ahora: r.ahora });
    l.permitir("a");
    for (let t = 100; t < 1000; t += 100) { r.poner(t); expect(l.permitir("a").permitido).toBe(false); }
    r.poner(1000);
    expect(l.permitir("a").permitido).toBe(true);
  });
  it("claves independientes, incluidas las que parecen propiedades de objeto", () => {
    const r = reloj(0);
    const l = crearLimitador({ maximo: 1, ventanaMs: 1000, ahora: r.ahora });
    for (const k of ["a", "b", "__proto__", "constructor", "toString", "hasOwnProperty", ""]) {
      expect(l.permitir(k).permitido).toBe(true);
      expect(l.permitir(k).permitido).toBe(false);
    }
    expect(l.tamano()).toBe(7);
  });
  it("si el reloj va hacia atrás, no se concede nada de más", () => {
    const r = reloj(5000);
    const l = crearLimitador({ maximo: 1, ventanaMs: 1000, ahora: r.ahora });
    expect(l.permitir("a").permitido).toBe(true);
    r.poner(100);
    expect(l.permitir("a")).toEqual({ permitido: false, restantes: 0, reintentarEnMs: 1000 });
    r.poner(5999); expect(l.permitir("a")).toEqual({ permitido: false, restantes: 0, reintentarEnMs: 1 });
    r.poner(6000); expect(l.permitir("a").permitido).toBe(true);
  });
  it("memoria acotada: al llenarse se descarta la clave menos usada recientemente", () => {
    const r = reloj(0);
    const l = crearLimitador({ maximo: 1, ventanaMs: 100000, ahora: r.ahora, maxClaves: 2 });
    l.permitir("a"); l.permitir("b");
    l.permitir("a");           // «a» se usa de nuevo (aunque se deniegue): «b» queda como la menos reciente
    l.permitir("c");           // expulsa «b»
    expect(l.tamano()).toBe(2);
    expect(l.permitir("b")).toEqual({ permitido: true, restantes: 0, reintentarEnMs: 0 }); // «b» empieza de cero (expulsa «a»)
    expect(l.permitir("c").permitido).toBe(false);
  });
  it("limpiar() quita las claves sin intentos dentro de la ventana", () => {
    const r = reloj(0);
    const l = crearLimitador({ maximo: 1, ventanaMs: 1000, ahora: r.ahora });
    l.permitir("a"); r.poner(600); l.permitir("b");
    r.poner(1000); l.limpiar();
    expect(l.tamano()).toBe(1);
    r.poner(1600); l.limpiar();
    expect(l.tamano()).toBe(0);
  });
  it("usa el reloj real si no se le da uno", () => {
    const l = crearLimitador({ maximo: 1, ventanaMs: 60000 });
    expect(l.permitir("x").permitido).toBe(true);
    const d = l.permitir("x");
    expect(d.permitido).toBe(false);
    expect(d.reintentarEnMs).toBeGreaterThan(0);
    expect(d.reintentarEnMs).toBeLessThanOrEqual(60000);
  });
  it("rechaza opciones no válidas", () => {
    const malas = [{ maximo: 0, ventanaMs: 1 }, { maximo: 1.5, ventanaMs: 1 }, { maximo: 1, ventanaMs: 0 }, { maximo: 1, ventanaMs: -5 }, { maximo: 1, ventanaMs: Infinity }, { maximo: 1, ventanaMs: 1, maxClaves: 0 }];
    for (const o of malas) expect(() => crearLimitador(o)).toThrow(RangeError);
  });
});
