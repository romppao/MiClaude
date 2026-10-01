import { describe, expect, it } from "vitest";
import { internalPath } from "../../src/lib/common/paths";

describe("internalPath (redirecciones seguras)", () => {
  it("acepta rutas internas con parámetros", () => {
    expect(internalPath("/ok?a=1")).toBe("/ok?a=1");
    expect(internalPath("/peleadores/ana-ruiz")).toBe("/peleadores/ana-ruiz");
    expect(internalPath("/")).toBe("/");
  });
  it("rechaza direcciones externas y trucos con barras", () => {
    for (const bad of ["//evil.com", "/\\evil.com", "/\\/evil.com", "/\t/evil.com", "/\n/evil.com", "/\r/evil.com", "https://evil.com", "http://evil.com/x", "javascript:alert(1)", "evil.com", "", "\\evil.com", "/ok\u0000"]) {
      expect(internalPath(bad, "/inicio")).toBe("/inicio");
    }
  });
  it("una barra codificada no es una barra real", () => {
    expect(internalPath("/%5Cevil.com", "/x")).toBe("/%5Cevil.com"); // el navegador no la interpreta como dominio
  });
  it("rechaza rutas absurdamente largas", () => {
    expect(internalPath("/" + "a".repeat(600), "/x")).toBe("/x");
  });
});
