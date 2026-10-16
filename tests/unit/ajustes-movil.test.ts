import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("tres ajustes de móvil en Lona revisados por Claude", () => {
  const css = fs.readFileSync(path.resolve(__dirname, "../../src/app/globals.css"), "utf-8");

  it("1. Portada: .portada-visita tiene altura acotada en móvil para que el lema no quede tapado por la barra inferior", () => {
    expect(css).toMatch(/\.portada-visita\s*\{[^}]*min-height:\s*400px/);
    expect(css).toMatch(/\.portada-visita\s+\.lema-portada\s*\{[^}]*font-size:\s*16px/);
  });

  it("2. Gimnasios: .mapa-gimnasios tiene scroll-margin-top y form.search no es sticky", () => {
    expect(css).toMatch(/\.mapa-gimnasios\s*\{[^}]*scroll-margin-top:\s*96px/);
    expect(css).toMatch(/form\.search\s*\{[^}]*position:\s*relative/);
  });

  it("3. Peleadores: el botón de aplicar filtros está visible antes del desplegable de más filtros", () => {
    const peleadoresPage = fs.readFileSync(path.resolve(__dirname, "../../src/app/peleadores/page.tsx"), "utf-8");
    const idxBotones = peleadoresPage.indexOf("<BotonesFiltro");
    const idxMasFiltros = peleadoresPage.indexOf("<MasFiltros");
    expect(idxBotones).toBeGreaterThan(-1);
    expect(idxMasFiltros).toBeGreaterThan(-1);
    expect(idxBotones).toBeLessThan(idxMasFiltros);
  });
});
