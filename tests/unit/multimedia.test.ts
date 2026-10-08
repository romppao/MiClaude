import { describe, expect, it } from "vitest";
import { CONSENTIMIENTO, nombreDeDescarga, parseMedio, veladaAbiertaAlPublico } from "../../src/lib/media/rules";
import { almacenDeVideos, carpetaEnDisco, claveDe, nuevaClave, rutaEnDisco, tipoDeClave } from "../../src/lib/media/storage";
import { validateEnv } from "../../src/lib/common/env";

const base = { caption: "", hayFoto: false, videoKey: "", videoUrl: "", consentimiento: true };

describe("vídeos y fotos del público: qué se admite", () => {
  it("exige confirmar que lo grabó y puede compartirlo", () => {
    expect(parseMedio({ ...base, hayFoto: true, consentimiento: false })).toEqual({ ok: false, problema: "medio_consentimiento" });
    expect(CONSENTIMIENTO).toMatch(/menores/);
  });
  it("una sola cosa cada vez, y alguna", () => {
    expect(parseMedio(base)).toEqual({ ok: false, problema: "medio_vacio" });
    expect(parseMedio({ ...base, hayFoto: true, videoUrl: "https://youtu.be/x" })).toEqual({ ok: false, problema: "medio_uno_solo" });
  });
  it("foto, vídeo subido o enlace https", () => {
    expect(parseMedio({ ...base, hayFoto: true, caption: "  Tercer   asalto " })).toEqual({ ok: true, kind: "PHOTO", caption: "Tercer asalto", videoKey: null, videoUrl: null });
    expect(parseMedio({ ...base, videoKey: "videos/u/k.mp4" })).toMatchObject({ ok: true, kind: "VIDEO", videoKey: "videos/u/k.mp4" });
    expect(parseMedio({ ...base, videoUrl: "https://youtu.be/x" })).toMatchObject({ ok: true, kind: "VIDEO", videoUrl: "https://youtu.be/x" });
    expect(parseMedio({ ...base, videoUrl: "javascript:alert(1)" })).toEqual({ ok: false, problema: "medio_enlace" });
    expect(parseMedio({ ...base, hayFoto: true, caption: "x".repeat(121) })).toEqual({ ok: false, problema: "medio_pie_largo" });
  });
  it("solo veladas ya celebradas, no canceladas y de los últimos cuatro meses", () => {
    const v = (dia: string, status = "SCHEDULED") => ({ date: new Date(`${dia}T00:00:00Z`), status });
    expect(veladaAbiertaAlPublico(v("2026-10-08"), "2026-10-08")).toBe("ok");
    expect(veladaAbiertaAlPublico(v("2026-10-09"), "2026-10-08")).toBe("futura");
    expect(veladaAbiertaAlPublico(v("2026-10-01", "CANCELLED"), "2026-10-08")).toBe("cancelada");
    expect(veladaAbiertaAlPublico(v("2026-06-01"), "2026-10-08")).toBe("antigua");
  });
  it("nombre de descarga limpio", () => {
    expect(nombreDeDescarga("gran-velada-2026-10-04-ab12", "mp4")).toBe("gran-velada-2026-10-04-ab12.mp4");
    expect(nombreDeDescarga('../"x', "webp")).toBe("x.webp");
  });
});

describe("almacén de vídeos", () => {
  it("cada vídeo vive en la carpeta de quien lo sube y nadie puede usar la de otro", () => {
    const k = nuevaClave("clxyz12345abc", "video/quicktime");
    expect(k).toMatch(/^videos\/clxyz12345abc\/[0-9a-f-]{36}\.mov$/);
    expect(claveDe(k, "clxyz12345abc")).toBe(true);
    expect(claveDe(k, "otrapersona1")).toBe(false);
    expect(claveDe("videos/clxyz12345abc/../../etc/passwd", "clxyz12345abc")).toBe(false);
    expect(tipoDeClave(k)).toBe("video/quicktime");
  });
  it("la ruta en disco nunca se sale de su carpeta", () => {
    expect(rutaEnDisco("/datos", "videos/clxyz12345abc/0f8fad5b-d9cb-469f-a165-70867728950e.mp4")).toBe("/datos/videos/clxyz12345abc/0f8fad5b-d9cb-469f-a165-70867728950e.mp4");
    expect(rutaEnDisco("/datos", "../fuera.mp4")).toBeNull();
  });
  it("elige R2 si está configurado; si no, el disco fuera de producción o en la demo; en producción sin R2, solo enlaces", () => {
    const r2 = { R2_ACCOUNT_ID: "c", R2_ACCESS_KEY_ID: "k", R2_SECRET_ACCESS_KEY: "s", R2_BUCKET: "b", NODE_ENV: "production" } as unknown as NodeJS.ProcessEnv;
    const a = almacenDeVideos(r2)!;
    expect(a.tipo).toBe("r2");
    expect(a.subida("videos/u/x.mp4", "video/mp4").url).toMatch(/^https:\/\/c\.r2\.cloudflarestorage\.com\/b\/videos\/u\/x\.mp4\?X-Amz-Algorithm=AWS4-HMAC-SHA256/);
    expect(almacenDeVideos({ NODE_ENV: "development" } as NodeJS.ProcessEnv)?.tipo).toBe("disco");
    expect(almacenDeVideos({ NODE_ENV: "production", DEMO_MODE: "si" } as unknown as NodeJS.ProcessEnv)?.tipo).toBe("disco");
    expect(almacenDeVideos({ NODE_ENV: "production" } as NodeJS.ProcessEnv)).toBeNull();
    expect(carpetaEnDisco({ NODE_ENV: "production", MEDIA_DIR: "/datos/videos" } as unknown as NodeJS.ProcessEnv)).toBe("/datos/videos");
  });
  it("avisa si la configuración de R2 está a medias", () => {
    const env = { NODE_ENV: "production", DATABASE_URL: "x", APP_URL: "https://ring.es", MAIL_TRANSPORT: "log", CONTACT_EMAIL: "a@b.es", R2_BUCKET: "b" } as unknown as NodeJS.ProcessEnv;
    expect(validateEnv(env).errors.join(" ")).toMatch(/almacén de vídeos está incompleta/);
  });
});
