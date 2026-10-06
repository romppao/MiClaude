import { describe, expect, it, vi } from "vitest";

const cache = vi.hoisted(() => vi.fn());
vi.mock("next/cache", () => ({ unstable_cache: cache }));
import { leerCacheado } from "../../src/lib/common/cache";

describe("leerCacheado", () => {
  it("separa claves, conserva las etiquetas y usa sesenta segundos cuando se le pide", async () => {
    const fn = vi.fn(async () => ({ total: 3 }));
    cache.mockImplementation((lectura: () => Promise<unknown>) => lectura);
    await expect(leerCacheado("ranking:sin-filtros", ["ranking"], 60, fn)).resolves.toEqual({ total: 3 });
    expect(cache).toHaveBeenCalledWith(fn, ["ranking:sin-filtros"], { tags: ["ranking"], revalidate: 60 });
  });
});
