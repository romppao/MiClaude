import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { ACCENT_FROM, ACCENT_TO } from "../../src/lib/common/search";

// El índice de trigramas solo sirve si su expresión es idéntica a la de la consulta (T-006). Esta prueba evita que se desalineen en silencio.
describe("índice de búsqueda de peleadores", () => {
  const migracion = readFileSync("prisma/migrations/20261006160000_indices_listados/migration.sql", "utf8");
  it("usa las mismas letras con tilde y sin tilde que la búsqueda", () => {
    expect(migracion).toContain(`'${ACCENT_FROM}', '${ACCENT_TO}'`);
  });
  it("indexa el nombre, los apellidos y el alias con coalesce y ||, que son inmutables", () => {
    expect(migracion).toContain(`coalesce("firstName", '') || ' ' || coalesce("lastName", '') || ' ' || coalesce("alias", '')`);
    expect(migracion).not.toContain("concat_ws");
  });
});
