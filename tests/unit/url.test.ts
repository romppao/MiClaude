import { describe, expect, it } from "vitest";
import { safeHttpUrl } from "../../src/lib/common/url";

describe("safeHttpUrl", () => {
  it("acepta http y https", () => {
    expect(safeHttpUrl("https://example.com/acta.pdf")).toBe("https://example.com/acta.pdf");
    expect(safeHttpUrl("  http://example.com  ")).toBe("http://example.com/");
  });
  it("rechaza esquemas peligrosos o no web", () => {
    for (const u of ["javascript:alert(1)", "data:text/html,<script>1</script>", "file:///etc/passwd", "ftp://x.com", "vbscript:x"])
      expect(safeHttpUrl(u)).toBeNull();
  });
  it("rechaza vacío, texto suelto y URLs demasiado largas", () => {
    expect(safeHttpUrl("")).toBeNull();
    expect(safeHttpUrl("no es una url")).toBeNull();
    expect(safeHttpUrl("https://x.com/" + "a".repeat(600))).toBeNull();
  });
});
