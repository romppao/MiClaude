import { mkdtempSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/lib/common/fallos", () => ({ registrarFallo: vi.fn(async () => undefined) }));
import { CLAVE_DE_FOTO, almacenDeFotos, borrarFotos, guardarFoto, leerFoto, nuevaClaveDeFoto } from "../../src/lib/media/fotos";
import { registrarFallo } from "../../src/lib/common/fallos";

// Fotos fuera de la base de datos (T-004, parte 2): lib/media/fotos.ts.
const bytes = new Uint8Array([1, 2, 3, 4, 5]);
const R2 = { R2_ACCOUNT_ID: "cuenta", R2_ACCESS_KEY_ID: "id", R2_SECRET_ACCESS_KEY: "secreto", R2_BUCKET: "ring-videos", R2_JURISDICCION: "eu" } as unknown as NodeJS.ProcessEnv;

afterEach(() => { vi.unstubAllGlobals(); vi.mocked(registrarFallo).mockClear(); });

describe("almacenDeFotos", () => {
  it("sin R2 ni FOTOS_EN_DISCO no hay almacén: las fotos siguen en la base (también en la demo)", () => {
    expect(almacenDeFotos({ NODE_ENV: "production" } as NodeJS.ProcessEnv)).toBeNull();
    expect(almacenDeFotos({ NODE_ENV: "production", DEMO_MODE: "si", MEDIA_DIR: "/tmp/x" } as NodeJS.ProcessEnv)).toBeNull();
  });
  it("con las variables R2_* usa R2, aunque también esté FOTOS_EN_DISCO", () => {
    expect(almacenDeFotos({ ...R2, FOTOS_EN_DISCO: "si" })?.tipo).toBe("r2");
  });
  it("las claves nuevas son válidas y van a su carpeta", () => {
    const c = nuevaClaveDeFoto("medios");
    expect(c).toMatch(CLAVE_DE_FOTO);
    expect(c.startsWith("fotos/medios/")).toBe(true);
    expect(CLAVE_DE_FOTO.test("fotos/perfiles/../../etc/passwd.webp")).toBe(false);
    expect(CLAVE_DE_FOTO.test("videos/abc/123.mp4")).toBe(false);
  });
});

describe("en disco", () => {
  const env = () => ({ FOTOS_EN_DISCO: "si", MEDIA_DIR: mkdtempSync(join(tmpdir(), "fotos-")) }) as unknown as NodeJS.ProcessEnv;
  it("guarda, lee y borra por su clave", async () => {
    const e = env();
    const almacen = almacenDeFotos(e)!;
    const g = await guardarFoto("perfiles", bytes as Uint8Array<ArrayBuffer>, almacen);
    expect(g.bytes).toBeNull();
    expect(existsSync(join(e.MEDIA_DIR!, g.clave!))).toBe(true);
    expect(Array.from((await leerFoto({ clave: g.clave, bytes: null }, almacen))!)).toEqual([1, 2, 3, 4, 5]);
    await borrarFotos([g.clave, null, undefined], almacen);
    expect(existsSync(join(e.MEDIA_DIR!, g.clave!))).toBe(false);
    expect(await leerFoto({ clave: g.clave, bytes: null }, almacen)).toBeNull();
  });
  it("no escribe fuera de su carpeta ni sobrescribe una foto", async () => {
    const almacen = almacenDeFotos(env())!;
    await expect(almacen.guardar("fotos/perfiles/../../fuera.webp", bytes)).rejects.toThrow();
    const c = nuevaClaveDeFoto("perfiles");
    await almacen.guardar(c, bytes);
    await expect(almacen.guardar(c, bytes)).rejects.toThrow();
  });
});

describe("sin almacén", () => {
  it("la foto se queda en la fila, y las antiguas se siguen leyendo de la base", async () => {
    const g = await guardarFoto("highlights", bytes as Uint8Array<ArrayBuffer>, null);
    expect(g).toEqual({ clave: null, bytes });
    expect(Array.from((await leerFoto({ clave: null, bytes }, null))!)).toEqual([1, 2, 3, 4, 5]);
  });
  it("una foto con clave sin almacén configurado no se puede servir y queda registrado", async () => {
    expect(await leerFoto({ clave: nuevaClaveDeFoto("perfiles"), bytes: null }, null)).toBeNull();
    expect(registrarFallo).toHaveBeenCalledTimes(1);
  });
});

describe("en R2", () => {
  it("sube con PUT firmado al cubo de la UE, lee con GET y trata el 404 como «no está»", async () => {
    const llamadas: { url: string; metodo: string }[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
      llamadas.push({ url, metodo: init?.method ?? "GET" });
      if ((init?.method ?? "GET") === "GET") return url.includes("no-esta") ? new Response(null, { status: 404 }) : new Response(bytes);
      return new Response(null, { status: 200 });
    }));
    const almacen = almacenDeFotos(R2)!;
    const g = await guardarFoto("perfiles", bytes as Uint8Array<ArrayBuffer>, almacen);
    expect(llamadas[0].metodo).toBe("PUT");
    expect(llamadas[0].url).toContain(`https://cuenta.eu.r2.cloudflarestorage.com/ring-videos/${g.clave}`);
    expect(llamadas[0].url).toContain("X-Amz-Signature=");
    expect(Array.from((await leerFoto({ clave: g.clave, bytes: null }, almacen))!)).toEqual([1, 2, 3, 4, 5]);
    expect(await almacen.leer("fotos/perfiles/no-esta.webp")).toBeNull();
  });
  it("si R2 rechaza la subida, lanza (la acción no publica una foto sin guardar)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 403 })));
    await expect(guardarFoto("medios", bytes as Uint8Array<ArrayBuffer>, almacenDeFotos(R2)!)).rejects.toThrow("403");
  });
  it("si R2 no puede borrar, no lanza: lo registra para borrarla a mano", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 500 })));
    await expect(borrarFotos([nuevaClaveDeFoto("perfiles")], almacenDeFotos(R2)!)).resolves.toBeUndefined();
    expect(registrarFallo).toHaveBeenCalledTimes(1);
  });
});
