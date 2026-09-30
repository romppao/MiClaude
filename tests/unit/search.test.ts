import { describe, expect, it, vi } from "vitest";

vi.mock("../../src/lib/db", () => ({ db: {} }));

import { ACCENT_FROM, ACCENT_TO, searchWords } from "../../src/lib/search";
import { normalizeName } from "../../src/lib/names";

describe("búsqueda sin tildes", () => {
  it("la tabla de tildes de la base de datos tiene el mismo largo por los dos lados", () => {
    expect([...ACCENT_FROM].length).toBe([...ACCENT_TO].length);
  });
  it("cada letra con tilde se convierte en la misma letra que la normalización de JavaScript", () => {
    [...ACCENT_FROM].forEach((letra, i) => expect(ACCENT_TO[i], `«${letra}»`).toBe(normalizeName(letra)));
  });
  it("las palabras de la búsqueda van sin tildes, en minúsculas, limitadas en número y en largo", () => {
    expect(searchWords("  Álvaro   PÉREZ núñez ")).toEqual(["alvaro", "perez", "nunez"]);
    expect(searchWords("a b c d e f g h")).toHaveLength(6);
    expect(searchWords("x".repeat(200))[0]).toHaveLength(60);
    expect(searchWords("   ")).toEqual([]);
  });
});
