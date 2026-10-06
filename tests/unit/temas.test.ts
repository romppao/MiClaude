import { describe, expect, it } from "vitest";
import { DISCIPLINE_ORDER } from "../../src/lib/common/disciplines";
import { TEMAS_POR_DEPORTE, claveDeDisciplina, claveDeporteSegura, esClaveDeporte } from "../../src/lib/common/temas";

describe("temas por deporte", () => {
  it("asigna una clave y un tema a cada disciplina existente", () => {
    for (const discipline of DISCIPLINE_ORDER) {
      const clave = claveDeDisciplina(discipline);
      expect(esClaveDeporte(clave)).toBe(true);
      expect(TEMAS_POR_DEPORTE[clave].categorias).not.toBeNull();
    }
  });

  it.each(["__proto__", "", "inventado", "constructor"])('convierte "%s" en la vista general segura', (invalida) => {
    expect(esClaveDeporte(invalida)).toBe(false);
    expect(claveDeporteSegura(invalida)).toBe("todos");
  });
});
