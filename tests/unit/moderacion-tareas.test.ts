/** Tareas de moderación para «Hoy» (17 de octubre de 2026): orden de atención, agrupación y que nunca se invente trabajo. */
import { describe, expect, it } from "vitest";
import { GRUPOS, TAREAS, agrupar, contarTareas, siguienteTarea, totalPendiente } from "../../src/lib/community/moderacion-tareas";

describe("tipos de trabajo", () => {
  it("cada tarea tiene clave única, prioridad única y un destino de moderación", () => {
    expect(new Set(TAREAS.map((t) => t.clave)).size).toBe(TAREAS.length);
    expect(new Set(TAREAS.map((t) => t.prioridad)).size).toBe(TAREAS.length);
    for (const t of TAREAS) {
      expect(t.href, t.clave).toMatch(/^\/moderacion/);
      expect(GRUPOS, t.clave).toContain(t.grupo);
      expect(t.texto.length, t.clave).toBeGreaterThan(3);
    }
  });

  it("las denuncias de usuarios van siempre primero", () => {
    expect([...TAREAS].sort((a, b) => a.prioridad - b.prioridad)[0].clave).toBe("denuncias");
  });
});

describe("contarTareas", () => {
  it("una clave sin número, negativa o rara cuenta como 0", () => {
    const c = contarTareas({ denuncias: 3, veladas: -2, fallos: Number.NaN, fichas: 2.9 });
    const n = (k: string) => c.find((x) => x.clave === k)?.n;
    expect(n("denuncias")).toBe(3);
    expect(n("veladas")).toBe(0);
    expect(n("fallos")).toBe(0);
    expect(n("fichas")).toBe(2);
    expect(n("noticias")).toBe(0);
    expect(c).toHaveLength(TAREAS.length);
  });

  it("no se deja engañar por claves del prototipo", () => {
    const c = contarTareas(JSON.parse('{"__proto__": 9, "constructor": 9}'));
    expect(totalPendiente(c)).toBe(0);
  });
});

describe("siguienteTarea", () => {
  it("es la de menor prioridad con algo pendiente", () => {
    const c = contarTareas({ noticias: 4, fichas: 1, fallos: 2 });
    expect(siguienteTarea(c)?.clave).toBe("fallos");
  });

  it("si hay denuncias, son lo primero aunque haya más de otra cosa", () => {
    expect(siguienteTarea(contarTareas({ denuncias: 1, veladas: 20, fallos: 9 }))?.clave).toBe("denuncias");
  });

  it("sin nada pendiente no hay siguiente tarea", () => {
    expect(siguienteTarea(contarTareas({}))).toBeNull();
    expect(totalPendiente(contarTareas({}))).toBe(0);
  });
});

describe("agrupar", () => {
  it("reparte todas las tareas en los tres grupos, sin perder ninguna", () => {
    const g = agrupar(contarTareas({}));
    expect(g.map((x) => x.grupo)).toEqual([...GRUPOS]);
    expect(g.flatMap((x) => x.tareas)).toHaveLength(TAREAS.length);
  });

  it("dentro de cada grupo, primero las que tienen trabajo, y luego por prioridad", () => {
    const personas = agrupar(contarTareas({ "reclamaciones-gimnasio": 2 })).find((x) => x.grupo === "Personas")!.tareas;
    expect(personas[0].clave).toBe("reclamaciones-gimnasio");
    expect(personas.slice(1).map((t) => t.prioridad)).toEqual([...personas.slice(1).map((t) => t.prioridad)].sort((a, b) => a - b));
  });
});
