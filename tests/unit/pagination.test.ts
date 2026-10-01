import { describe, expect, it } from "vitest";
import { pageNumber, pageWindow } from "../../src/lib/common/pagination";

describe("paginación", () => {
  it("interpreta el número de página con cuidado", () => {
    expect(pageNumber("3")).toBe(3);
    expect(pageNumber(["2", "9"])).toBe(2);
    for (const raw of [undefined, "", "0", "-1", "abc", "1.5", "99999", "2 "]) expect([1, 1000]).toContain(pageNumber(raw as string));
    expect(pageNumber("abc")).toBe(1);
    expect(pageNumber("0")).toBe(1);
    expect(pageNumber("99999")).toBe(1);
  });
  it("calcula la ventana y no pasa de la última página", () => {
    expect(pageWindow(0, 1)).toMatchObject({ pages: 1, current: 1, skip: 0, from: 0, to: 0 });
    expect(pageWindow(24, 1)).toMatchObject({ pages: 1, from: 1, to: 24 });
    expect(pageWindow(25, 2)).toMatchObject({ pages: 2, skip: 24, from: 25, to: 25 });
    expect(pageWindow(50, 99)).toMatchObject({ current: 3, skip: 48, to: 50 });
  });
});
