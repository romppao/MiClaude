import { describe, expect, it } from "vitest";
import { EXPLORAR, menuDe } from "../../src/lib/accounts/menu";

const enlaces = (...a: Parameters<typeof menuDe>) => menuDe(...a).flatMap((s) => s.enlaces.map((e) => e.href.split("#")[0]));

describe("menú por tipo de cuenta (decisión del fundador, 8 de octubre de 2026)", () => {
  it("el aficionado solo ve lo suyo: nada de ficha, clases ni veladas propias", () => {
    const h = enlaces("usuario");
    expect(h).toEqual(expect.arrayContaining(["/mi-panel", "/siguiendo", "/compartir", "/mi-cuenta"]));
    for (const ajeno of ["/mi-ficha", "/mis-clases", "/organizador", "/moderacion", "/respaldar"]) expect(h).not.toContain(ajeno);
  });
  it("el peleador ve su ficha, pero no clases ni veladas propias", () => {
    const h = enlaces("peleador");
    expect(h).toContain("/mi-ficha");
    for (const ajeno of ["/mis-clases", "/organizador", "/compartir"]) expect(h).not.toContain(ajeno);
  });
  it("el entrenador reúne entrenador, club y promotora", () => {
    const m = menuDe("entrenador", { gimnasio: "club-norte", entrenador: "ana-g" });
    expect(m.map((s) => s.titulo)).toEqual(expect.arrayContaining(["Entrenador", "Club", "Promotora"]));
    const h = m.flatMap((s) => s.enlaces.map((e) => e.href));
    expect(h).toEqual(expect.arrayContaining(["/mis-clases", "/organizador", "/organizador#crear", "/gimnasios/club-norte", "/entrenadores/ana-g"]));
    expect(h).not.toContain("/mi-ficha");
  });
  it("la entidad ve sus veladas y su perfil, no la ficha ni las clases", () => {
    const h = enlaces("entidad", { promotorId: "u1" });
    expect(h).toEqual(expect.arrayContaining(["/organizador", "/promotores/u1"]));
    for (const ajeno of ["/mi-ficha", "/mis-clases"]) expect(h).not.toContain(ajeno);
  });
  it("el visitante ve cómo empezar y no ve enlaces de cuenta", () => {
    const h = enlaces("visitante");
    expect(h).toEqual(expect.arrayContaining(["/registro", "/entrar", "/ayuda"]));
    for (const ajeno of ["/mi-cuenta", "/mi-panel"]) expect(h).not.toContain(ajeno);
  });
  it("«Explorar» es igual para todos, y moderación y respaldo solo aparecen con permiso", () => {
    for (const p of ["visitante", "usuario", "peleador", "entrenador", "entidad"] as const) expect(menuDe(p)).toContainEqual(EXPLORAR);
    expect(enlaces("usuario", { admin: true, canSupport: true })).toEqual(expect.arrayContaining(["/moderacion", "/respaldar"]));
  });
  it("ningún bloque tiene más de cinco enlaces (navegación corta)", () => {
    for (const p of ["visitante", "usuario", "peleador", "entrenador", "entidad"] as const)
      for (const s of menuDe(p, { gimnasio: "g", entrenador: "e", promotorId: "u", perfilesGestionados: true, admin: true, canSupport: true })) expect(s.enlaces.length, `${p}: ${s.titulo}`).toBeLessThanOrEqual(5);
  });
  it("ninguna sección tiene enlaces repetidos con el mismo texto", () => {
    for (const p of ["visitante", "usuario", "peleador", "entrenador", "entidad"] as const)
      for (const s of menuDe(p, { gimnasio: "g", entrenador: "e", promotorId: "u", perfilesGestionados: true, admin: true, canSupport: true }))
        expect(new Set(s.enlaces.map((e) => e.texto)).size).toBe(s.enlaces.length);
  });
});
