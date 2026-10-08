import { describe, expect, it } from "vitest";
import { categoryLabel } from "../../src/lib/common/disciplines";
import { miniaturaDeEnlace, webDeEnlace } from "../../src/lib/fighters/highlights";
import { parseClassRequest, puedeCancelar, puedeResponder, REQUEST_STATUS_LABEL } from "../../src/lib/trainers/requests";
import { menuDe } from "../../src/lib/accounts/menu";

describe("categoryLabel (sin repetir el sexo)", () => {
  it("une división y peso sin «Masculino · Masculino» (la captura del fundador)", () => {
    const l = categoryLabel("BOXEO", "AMATEUR", "RFE2026:Élite:M", "M65");
    expect(l).toMatch(/^Élite \(19–40 años\) · Masculino · /);
    expect((l.match(/Masculino/g) ?? []).length).toBe(1);
  });
  it("sin peso devuelve solo la división", () => {
    expect(categoryLabel("BOXEO", "AMATEUR", null, null)).toBe("Edad y categoría sin indicar");
  });
});

describe("portada de los highlights enlazados", () => {
  it("saca la miniatura de YouTube de sus distintas direcciones", () => {
    const m = "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg";
    expect(miniaturaDeEnlace("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(m);
    expect(miniaturaDeEnlace("https://youtu.be/dQw4w9WgXcQ?t=3")).toBe(m);
    expect(miniaturaDeEnlace("https://youtube.com/shorts/dQw4w9WgXcQ")).toBe(m);
    expect(miniaturaDeEnlace("https://m.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(m);
  });
  it("no inventa portadas ni acepta identificadores raros", () => {
    expect(miniaturaDeEnlace("https://www.instagram.com/reel/abc/")).toBeNull();
    expect(miniaturaDeEnlace("https://www.youtube.com/watch?v=<script>")).toBeNull();
    expect(miniaturaDeEnlace("https://evil.com/youtube.com/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(miniaturaDeEnlace(null)).toBeNull();
    expect(miniaturaDeEnlace("no es una dirección")).toBeNull();
  });
  it("nombra la web del vídeo", () => {
    expect(webDeEnlace("https://www.instagram.com/reel/x")).toBe("Instagram");
    expect(webDeEnlace("https://www.tiktok.com/@a/video/1")).toBe("TikTok");
    expect(webDeEnlace("https://vimeo.com/1")).toBe("otra web");
  });
});

describe("solicitudes de clase", () => {
  const base = { day: "2026-10-14", from: "1080", to: "1200", message: "", phone: "", kind: "INDIVIDUAL" as const, minutes: 60, today: "2026-10-08" };
  it("compone lo que lee el entrenador a partir del día y la franja", () => {
    expect(parseClassRequest(base)).toEqual({ ok: true, value: { preferred: "miércoles 14 de octubre, entre las 18:00 y las 20:00", day: new Date("2026-10-14T00:00:00Z"), fromMinute: 1080, toMinute: 1200, message: null, phone: null } });
  });
  it("una clase colectiva solo pide el día", () => {
    expect(parseClassRequest({ ...base, kind: "GROUP", from: "", to: "" })).toMatchObject({ ok: true, value: { preferred: "miércoles 14 de octubre", fromMinute: null, toMinute: null } });
  });
  it("el día va de hoy a 90 días y debe ser una fecha", () => {
    expect(parseClassRequest({ ...base, day: "" })).toEqual({ ok: false, problema: "solicitud_dia" });
    expect(parseClassRequest({ ...base, day: "2026-10-07" })).toEqual({ ok: false, problema: "solicitud_dia" });
    expect(parseClassRequest({ ...base, day: "2027-01-07" })).toEqual({ ok: false, problema: "solicitud_dia" });
    expect(parseClassRequest({ ...base, day: "2026-10-08" }).ok).toBe(true);
  });
  it("la franja va de 07:00 a 23:00 en medias horas, en orden, y cabe la clase", () => {
    expect(parseClassRequest({ ...base, from: "1200", to: "1080" })).toEqual({ ok: false, problema: "solicitud_horas" });
    expect(parseClassRequest({ ...base, from: "360", to: "480" })).toEqual({ ok: false, problema: "solicitud_horas" });
    expect(parseClassRequest({ ...base, from: "1085", to: "1200" })).toEqual({ ok: false, problema: "solicitud_horas" });
    expect(parseClassRequest({ ...base, from: "1080", to: "1110", minutes: 60 })).toEqual({ ok: false, problema: "solicitud_horas_cortas" });
  });
  it("acepta teléfonos con espacios o prefijo y rechaza letras", () => {
    expect(parseClassRequest({ ...base, phone: "+34 600 12 34 56" })).toMatchObject({ ok: true, value: { phone: "+34600123456" } });
    expect(parseClassRequest({ ...base, phone: "llámame" })).toEqual({ ok: false, problema: "solicitud_telefono" });
  });
  it("limita el mensaje", () => {
    expect(parseClassRequest({ ...base, message: "m".repeat(501) })).toEqual({ ok: false, problema: "solicitud_mensaje_largo" });
  });
  it("solo se responde lo pendiente y se cancela lo pendiente o aceptado", () => {
    expect([puedeResponder("PENDING"), puedeResponder("ACCEPTED"), puedeResponder("CANCELLED")]).toEqual([true, false, false]);
    expect([puedeCancelar("PENDING"), puedeCancelar("ACCEPTED"), puedeCancelar("DECLINED"), puedeCancelar("CANCELLED")]).toEqual([true, true, false, false]);
    expect(Object.values(REQUEST_STATUS_LABEL).every((t) => !/[A-Z]{3,}/.test(t))).toBe(true);
  });
  it("el menú del aficionado y del peleador llevan a «Mis reservas de clases» sin pasar de cinco enlaces", () => {
    for (const papel of ["usuario", "peleador"] as const) {
      const propias = menuDe(papel)[0];
      expect(propias.enlaces.some((e) => e.href === "/mis-reservas")).toBe(true);
      expect(propias.enlaces.length).toBeLessThanOrEqual(5);
    }
  });
});
