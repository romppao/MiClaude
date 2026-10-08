import { describe, expect, it } from "vitest";
import { recordHidden, shownRecord } from "../../src/lib/fighters/privacy";
import { HIGHLIGHT_TITLE_MAX, orderHighlights, parseHighlight } from "../../src/lib/fighters/highlights";
import { classMeta, parseClass, parseYears, pickDisciplines } from "../../src/lib/trainers/classes";
import { readOnboarding } from "../../src/lib/accounts/onboarding";

describe("récord amateur privado", () => {
  it("en amateur, por defecto el público solo ve el número de combates", () => {
    expect(recordHidden("AMATEUR", false, false)).toBe(true);
    expect(shownRecord({ w: 8, l: 1, d: 0 }, true)).toBe("9 combates");
    expect(shownRecord({ w: 1, l: 0, d: 0 }, true)).toBe("1 combate");
  });
  it("se ve completo si el peleador lo publica, si es profesional o si es su propia ficha", () => {
    expect(recordHidden("AMATEUR", true, false)).toBe(false);
    expect(recordHidden("PRO", false, false)).toBe(false);
    expect(recordHidden("AMATEUR", false, true)).toBe(false);
    expect(shownRecord({ w: 12, l: 2, d: 1 }, false)).toBe("12-2-1");
  });
});

describe("highlights", () => {
  const base = { kind: "VIDEO", title: "El KO del tercer asalto", videoUrl: "https://www.youtube.com/watch?v=abc", hasImage: false };
  it("un vídeo necesita un enlace https", () => {
    expect(parseHighlight(base)).toEqual({ ok: true, kind: "VIDEO", title: "El KO del tercer asalto", videoUrl: "https://www.youtube.com/watch?v=abc", videoKey: null });
    expect(parseHighlight({ ...base, videoUrl: "" })).toEqual({ ok: false, problema: "highlight_enlace" });
    expect(parseHighlight({ ...base, videoUrl: "javascript:alert(1)" })).toEqual({ ok: false, problema: "highlight_enlace" });
    expect(parseHighlight({ ...base, videoUrl: "http://inseguro.es/v" })).toEqual({ ok: false, problema: "highlight_enlace" });
  });
  it("una foto necesita la imagen y no guarda enlace", () => {
    expect(parseHighlight({ ...base, kind: "PHOTO" })).toEqual({ ok: false, problema: "highlight_foto" });
    expect(parseHighlight({ ...base, kind: "PHOTO", hasImage: true })).toEqual({ ok: true, kind: "PHOTO", title: "El KO del tercer asalto", videoUrl: null, videoKey: null });
  });
  it("título obligatorio y corto; tipo conocido", () => {
    expect(parseHighlight({ ...base, title: "   " })).toEqual({ ok: false, problema: "highlight_titulo" });
    expect(parseHighlight({ ...base, title: "x".repeat(HIGHLIGHT_TITLE_MAX + 1) })).toEqual({ ok: false, problema: "highlight_titulo_largo" });
    expect(parseHighlight({ ...base, kind: "__proto__" })).toEqual({ ok: false, problema: "highlight_tipo" });
  });
  it("el destacado va primero y después los más recientes", () => {
    const d = (n: number) => new Date(2026, 0, n);
    const lista = [{ id: "a", pinned: false, createdAt: d(1) }, { id: "b", pinned: true, createdAt: d(2) }, { id: "c", pinned: false, createdAt: d(3) }];
    expect(orderHighlights(lista).map((h) => h.id)).toEqual(["b", "c", "a"]);
  });
});

describe("clases de los entrenadores", () => {
  const ind = { kind: "INDIVIDUAL", title: "Técnica y defensa", minutes: "60", price: "35", capacity: "", schedule: "" };
  it("una clase individual no lleva plazas ni horario", () => {
    expect(parseClass(ind)).toEqual({ ok: true, value: { kind: "INDIVIDUAL", title: "Técnica y defensa", minutes: 60, priceEuros: 35, capacity: null, schedule: null } });
  });
  it("una colectiva exige plazas (2–30) y horario", () => {
    const grupo = { ...ind, kind: "GROUP", capacity: "10", schedule: "Martes y jueves · 19:30" };
    expect(parseClass(grupo)).toMatchObject({ ok: true, value: { capacity: 10, schedule: "Martes y jueves · 19:30" } });
    expect(parseClass({ ...grupo, capacity: "1" })).toEqual({ ok: false, problema: "clase_plazas" });
    expect(parseClass({ ...grupo, schedule: " " })).toEqual({ ok: false, problema: "clase_horario" });
  });
  it("rechaza duración, precio, tipo y título no válidos", () => {
    expect(parseClass({ ...ind, minutes: "50" })).toEqual({ ok: false, problema: "clase_duracion" });
    expect(parseClass({ ...ind, price: "-3" })).toEqual({ ok: false, problema: "clase_precio" });
    expect(parseClass({ ...ind, price: "501" })).toEqual({ ok: false, problema: "clase_precio" });
    expect(parseClass({ ...ind, price: "12.5" })).toEqual({ ok: false, problema: "clase_precio" });
    expect(parseClass({ ...ind, kind: "OTRA" })).toEqual({ ok: false, problema: "clase_tipo" });
    expect(parseClass({ ...ind, title: "" })).toEqual({ ok: false, problema: "clase_titulo" });
  });
  it("describe la duración y el horario", () => {
    expect(classMeta({ kind: "INDIVIDUAL", minutes: 60, schedule: null })).toBe("60 min · horario a convenir");
    expect(classMeta({ kind: "GROUP", minutes: 90, schedule: "Sábados · 11:00" })).toBe("90 min · Sábados · 11:00");
  });
  it("años entrenando y disciplinas", () => {
    expect(parseYears("")).toBeNull();
    expect(parseYears("14")).toBe(14);
    expect(parseYears("61")).toBeUndefined();
    expect(parseYears("abc")).toBeUndefined();
    expect(pickDisciplines(["MMA", "BOXEO", "OTRA", "MMA"], ["BOXEO", "JIUJITSU", "MMA"])).toEqual(["BOXEO", "MMA"]);
  });
});

describe("lo elegido en el registro", () => {
  it("lee la ficha de peleador y el perfil de entrenador guardados", () => {
    expect(readOnboarding({ kind: "peleador", discipline: "BOXEO", level: "AMATEUR", divisionId: "", weightClass: "M65", province: "Madrid" }))
      .toEqual({ kind: "peleador", discipline: "BOXEO", level: "AMATEUR", divisionId: null, weightClass: "M65", province: "Madrid" });
    const e = readOnboarding({ kind: "entrenador", disciplines: ["BOXEO", "X"], gym: "Club Vallecas", years: 14, province: "Madrid", clase: { kind: "INDIVIDUAL", title: "Técnica", minutes: "60", price: "35", capacity: "", schedule: "" } });
    expect(e).toMatchObject({ kind: "entrenador", disciplines: ["BOXEO"], gym: "Club Vallecas", years: 14, clase: { title: "Técnica" } });
  });
  it("descarta lo que no reconoce sin fallar", () => {
    expect(readOnboarding(null)).toBeNull();
    expect(readOnboarding("texto")).toBeNull();
    expect(readOnboarding({ kind: "admin" })).toBeNull();
    expect(readOnboarding({ kind: "peleador", discipline: "PETANCA", level: "PRO" })).toMatchObject({ discipline: null, level: "PRO" });
    expect(readOnboarding({ kind: "entrenador", years: 99, province: "Atlántida", clase: "x" })).toMatchObject({ years: null, province: null, clase: null, disciplines: [] });
  });
});

import { dayAndMonth, daysUntil, monthlySeries, whenLabel } from "../../src/lib/common/dates";
describe("fechas del diseño v3", () => {
  const ahora = new Date("2026-10-07T22:30:00Z"); // ya es 8 de octubre en Madrid
  it("cuenta los días por el día de Madrid", () => {
    expect(daysUntil(new Date("2026-10-08T12:00:00Z"), ahora)).toBe(0);
    expect(daysUntil(new Date("2026-10-25T12:00:00Z"), ahora)).toBe(17);
    expect(whenLabel(0)).toBe("Hoy"); expect(whenLabel(1)).toBe("Mañana"); expect(whenLabel(17)).toBe("En 17 días");
    expect(dayAndMonth(new Date("2026-10-24T12:00:00Z"))).toEqual({ dia: "24", mes: "oct" });
  });
  it("agrupa por mes los últimos meses, el actual el último", () => {
    const serie = monthlySeries([new Date("2026-10-01T10:00:00Z"), new Date("2026-09-30T23:30:00Z"), new Date("2026-04-02T10:00:00Z"), new Date("2025-01-01T10:00:00Z")], 7, ahora);
    expect(serie.map((x) => x.mes)).toEqual(["abr", "may", "jun", "jul", "ago", "sep", "oct"]);
    expect(serie.map((x) => x.total)).toEqual([1, 0, 0, 0, 0, 0, 2]);
  });
  it("cruza el cambio de año", () => {
    expect(monthlySeries([], 3, new Date("2027-01-15T12:00:00Z")).map((x) => x.mes)).toEqual(["nov", "dic", "ene"]);
  });
});
import { madridDayStart } from "../../src/lib/common/dates";
describe("medianoche en Madrid", () => {
  it("tiene en cuenta el horario de verano y de invierno", () => {
    expect(madridDayStart(new Date("2026-10-24T12:00:00Z")).toISOString()).toBe("2026-10-23T22:00:00.000Z");
    expect(madridDayStart(new Date("2026-11-08T12:00:00Z")).toISOString()).toBe("2026-11-07T23:00:00.000Z");
  });
});
