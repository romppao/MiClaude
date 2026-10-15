import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import TeToca from "../../src/app/_inicio/TeToca";
import CompletaPerfil from "../../src/app/_inicio/CompletaPerfil";
import { menuDe } from "../../src/lib/accounts/menu";

describe("pendientes y perfil en los paneles", () => {
  it("no ocupa espacio cuando no hay pendientes", () => {
    expect(renderToStaticMarkup(<TeToca pendientes={[]} />)).toBe("");
    expect(renderToStaticMarkup(<TeToca pendientes={[{ texto: "Clases", href: "/mis-clases", cantidad: 0 }]} />)).toBe("");
  });
  it("muestra cada pendiente con su cantidad y destino, sin incluir los resueltos", () => {
    const html = renderToStaticMarkup(<TeToca pendientes={[
      { texto: "Clases", href: "/mis-clases", cantidad: 5 },
      { texto: "Resultados", href: "/organizador", cantidad: 12 },
      { texto: "Resuelto", href: "/", cantidad: 0 },
    ]} />);
    expect(html).toContain('href="/mis-clases"');
    expect(html).toContain('href="/organizador"');
    expect(html).toContain(">12</span>");
    expect(html).not.toContain("Resuelto");
  });
  it("oculta el perfil completo y enlaza solo lo que falta", () => {
    const campos = [{ texto: "Foto", href: "/mi-ficha", completo: true }];
    expect(renderToStaticMarkup(<CompletaPerfil campos={campos} />)).toBe("");
    const html = renderToStaticMarkup(<CompletaPerfil campos={[...campos, { texto: "Provincia", href: "/mi-cuenta", completo: false }]} />);
    expect(html).toContain('value="50"');
    expect(html).toContain('href="/mi-cuenta"');
    expect(html).not.toContain('href="/mi-ficha"');
  });
  it("mantiene los accesos retirados del panel en el menú sin superar cinco enlaces", () => {
    const menu = menuDe("peleador", { admin: true, creador: true, canSupport: true });
    expect(menu.flatMap((s) => s.enlaces.map((e) => e.href))).toEqual(expect.arrayContaining(["/mis-inscripciones", "/mi-ficha/trayectoria", "/clases", "/propuestas"]));
    for (const seccion of menu) expect(seccion.enlaces.length).toBeLessThanOrEqual(5);
  });
});
