import { describe, expect, it } from "vitest";
import { variantesDireccion } from "../../src/lib/common/geo";

describe("formas sencillas de una dirección para el mapa", () => {
  it("quita nave, local, paréntesis y s/n", () => {
    expect(variantesDireccion("Calle Francisco Alonso, 3, nave 5", "Alcalá de Henares")[0]).toBe("Calle Francisco Alonso, 3, Alcalá de Henares, España");
    expect(variantesDireccion("Avenida de Europa, 10, local 7", "Fuenlabrada")[0]).toBe("Avenida de Europa, 10, Fuenlabrada, España");
    expect(variantesDireccion("Calle del Payaso Fofó, 1 (Estadio de Vallecas)", "Madrid")[0]).toBe("Calle del Payaso Fofó, 1, Madrid, España");
  });
  it("prueba sin artículos y, al final, solo la vía y el número", () => {
    const v = variantesDireccion("Calle de los Pintores, 6", "Alcorcón");
    expect(v).toContain("Calle Pintores, 6, Alcorcón, España");
    expect(v.at(-1)).toBe("Pintores 6, Alcorcón, España");
  });
  it("no repite formas iguales", () => {
    const v = variantesDireccion("Calle Aragón, 187", "Vigo");
    expect(new Set(v).size).toBe(v.length);
  });
});
