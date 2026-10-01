import { describe, expect, it } from "vitest";
import { limpiarParametros } from "../../src/middleware";

const limpia = (q: string) => limpiarParametros(new URLSearchParams(q));

describe("limpieza de los parámetros de la dirección", () => {
  it("no toca una dirección normal", () => {
    expect(limpia("q=ana&pagina=2&level=PRO")).toBeNull();
    expect(limpia("")).toBeNull();
  });
  it("quita «constructor» (rompe el objeto de parámetros de Next.js) y conserva el resto", () => {
    expect(limpia("constructor=y&q=ana")).toBe("q=ana");
    expect(limpia("q=ana&constructor=y")).toBe("q=ana");
  });
  it("conserva solo el primer valor de un parámetro repetido", () => {
    expect(limpia("q=a&q=b&pagina=2")).toBe("q=a&pagina=2");
  });
  it("elimina los caracteres nulos de los valores (PostgreSQL no los admite)", () => {
    expect(limpia("q=a%00b")).toBe("q=ab");
    expect(limpia("q=%00")).toBe("q=");
  });
  it("otros nombres con significado especial en JavaScript no dan problemas", () => {
    expect(limpia("__proto__=x&then=x&toString=x")).toBeNull();
  });
});
