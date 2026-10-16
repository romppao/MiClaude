import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/** El fundador retiró el nombre «Ring España» el 14-10-2026: la app se llama Lona (docs/APROBADO.md, APR-015). */
function archivos(dir: string): string[] {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre);
    return statSync(ruta).isDirectory() ? archivos(ruta) : [ruta];
  });
}

describe("nombre de la aplicación", () => {
  it("el nombre antiguo, «Ring España», no aparece en ningún texto del código ni de la semilla", () => {
    const candidatos = [...archivos("src"), "prisma/seed.ts"].filter((f) => /\.(ts|tsx)$/.test(f));
    const conNombreAntiguo = candidatos.filter((f) => /Ring Espa[ñn]a/i.test(readFileSync(f, "utf8")));
    expect(conNombreAntiguo).toEqual([]);
  });
});
