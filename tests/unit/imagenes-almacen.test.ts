import { describe, it, expect, vi, beforeEach } from "vitest";

const { filas, perfil } = vi.hoisted(() => {
const filas = new Map<string, { avatar: Uint8Array | null; banner: Uint8Array | null; hasAvatar: boolean; hasBanner: boolean }>();
const nombre = (w: { kind: string; entityId: string }) => `${w.kind}/${w.entityId}`;
const perfil = {
  upsert: vi.fn(async ({ where, create, update }: any) => { const k = nombre(where.kind_entityId); filas.set(k, { avatar: null, banner: null, hasAvatar: false, hasBanner: false, ...(filas.get(k) ?? create), ...update }); }),
  findUnique: vi.fn(async ({ where, select }: any) => { const f = filas.get(nombre(where.kind_entityId)); if (!f) return null; return Object.fromEntries(Object.keys(select).map((c) => [c, (f as any)[c]])); }),
  updateMany: vi.fn(async ({ where, data }: any) => { const f = filas.get(nombre(where)); if (f) Object.assign(f, data); }),
  deleteMany: vi.fn(async ({ where }: any) => { filas.delete(nombre(where)); }),
};
return { filas, perfil };
});
vi.mock("../../src/lib/common/db", () => ({ db: { profile: perfil } }));

import { imageKey, parseImageKey } from "../../src/lib/common/imageKeys";
import { getImageStore } from "../../src/lib/common/imageStore";
import { anonymizeFighter } from "../../src/lib/fighters/anonymize";

const bytes = (...n: number[]) => new Uint8Array(n) as Uint8Array<ArrayBuffer>;

describe("claves de imagen", () => {
  it("se construyen y se leen de vuelta", () => {
    expect(imageKey("peleador", "abc", "avatar")).toBe("perfiles/peleador/abc/avatar.webp");
    expect(parseImageKey("perfiles/gimnasio/g1/banner.webp")).toEqual({ kind: "gimnasio", entityId: "g1", slot: "banner" });
  });
  it("rechaza claves manipuladas", () => {
    for (const k of ["", "perfiles/x/y/otro.webp", "../perfiles/x/y/avatar.webp", "perfiles/x/y/z/avatar.webp", "perfiles//y/avatar.webp"]) expect(parseImageKey(k)).toBeNull();
  });
});

describe("almacén de imágenes en base de datos", () => {
  beforeEach(() => { filas.clear(); vi.clearAllMocks(); delete process.env.IMAGE_STORE; });
  it("guarda, lee y borra una imagen", async () => {
    const s = getImageStore(), k = imageKey("peleador", "p1", "avatar");
    expect(await s.get(k)).toBeNull();
    await s.put(k, bytes(1, 2, 3), "image/webp");
    const leida = await s.get(k);
    expect([...leida!.bytes]).toEqual([1, 2, 3]); expect(leida!.contentType).toBe("image/webp");
    expect(filas.get("peleador/p1")!.hasAvatar).toBe(true);
    await s.delete(k);
    expect(await s.get(k)).toBeNull(); expect(filas.get("peleador/p1")!.hasAvatar).toBe(false);
  });
  it("el avatar y el banner no se mezclan", async () => {
    const s = getImageStore();
    await s.put(imageKey("gimnasio", "g", "avatar"), bytes(1), "image/webp");
    await s.put(imageKey("gimnasio", "g", "banner"), bytes(2), "image/webp");
    await s.delete(imageKey("gimnasio", "g", "avatar"));
    expect(await s.get(imageKey("gimnasio", "g", "avatar"))).toBeNull();
    expect([...(await s.get(imageKey("gimnasio", "g", "banner")))!.bytes]).toEqual([2]);
  });
  it("usa el cliente de la transacción cuando se le da", async () => {
    const tx = { profile: { upsert: vi.fn(), updateMany: vi.fn() } } as any;
    await getImageStore().put(imageKey("peleador", "p2", "banner"), bytes(9), "image/webp", tx);
    await getImageStore().delete(imageKey("peleador", "p2", "banner"), tx);
    expect(tx.profile.upsert).toHaveBeenCalledTimes(1); expect(tx.profile.updateMany).toHaveBeenCalledTimes(1);
    expect(perfil.upsert).not.toHaveBeenCalled();
  });
  it("rechaza claves inválidas y almacenes desconocidos", async () => {
    await expect(getImageStore().put("mala", bytes(1), "image/webp")).rejects.toThrow("clave_de_imagen_invalida");
    process.env.IMAGE_STORE = "s3";
    expect(() => getImageStore()).toThrow(/no está disponible/);
  });
  it("anonimizar a un peleador retira sus imágenes y su perfil", async () => {
    const s = getImageStore();
    await s.put(imageKey("peleador", "f1", "avatar"), bytes(1), "image/webp");
    const tx = { fighter: { update: vi.fn() }, profile: perfil, fighterDiscipline: { updateMany: vi.fn() }, fighterAchievement: { findMany: vi.fn(async () => []) }, auditLog: { updateMany: vi.fn() } } as any;
    await anonymizeFighter(tx, "f1");
    expect(await s.get(imageKey("peleador", "f1", "avatar"))).toBeNull();
    expect(filas.has("peleador/f1")).toBe(false);
  });
});
