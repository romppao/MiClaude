import type { Discipline, Level } from "@prisma/client";
import { DISCIPLINE_ORDER, isDiscipline, isLevel } from "../common/disciplines";
import { PROVINCES } from "../common/labels";

/**
 * Lo que la persona eligió en el último paso del registro y todavía no se ha podido crear porque falta confirmar el correo electrónico
 * (crear una ficha o un perfil público exige el correo confirmado). Se guarda en `User.onboarding` y sirve para rellenar el formulario
 * de «Mi ficha» o de «Mi perfil de entrenador», que la persona solo tiene que revisar y confirmar. Nunca se publica nada sin ese paso.
 */
export type FighterIntent = { kind: "peleador"; discipline: Discipline | null; level: Level; divisionId: string | null; weightClass: string | null; province: string | null };
/** La clase se guarda tal como llegó del formulario (ya validada al registrarse) y se vuelve a validar al crearla. */
export type ClassDraft = { kind: string; title: string; minutes: string; price: string; capacity: string; schedule: string };
export type TrainerIntent = { kind: "entrenador"; disciplines: Discipline[]; gym: string; years: number | null; province: string | null; clase: ClassDraft | null };
export type Onboarding = FighterIntent | TrainerIntent;

const texto = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const provincia = (v: unknown) => (typeof v === "string" && PROVINCES.includes(v) ? v : null);
const esObjeto = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

/** Lee lo guardado de forma defensiva: lo que no reconoce se descarta en vez de fallar. */
export function readOnboarding(raw: unknown): Onboarding | null {
  if (!esObjeto(raw)) return null;
  if (raw.kind === "peleador") {
    const d = texto(raw.discipline, 20), l = texto(raw.level, 10);
    return {
      kind: "peleador", discipline: isDiscipline(d) ? d : null, level: isLevel(l) ? l : "AMATEUR",
      divisionId: texto(raw.divisionId, 60) || null, weightClass: texto(raw.weightClass, 40) || null, province: provincia(raw.province),
    };
  }
  if (raw.kind === "entrenador") {
    const lista = Array.isArray(raw.disciplines) ? raw.disciplines.filter((x): x is string => typeof x === "string") : [];
    const years = typeof raw.years === "number" && Number.isInteger(raw.years) && raw.years >= 0 && raw.years <= 60 ? raw.years : null;
    const c = raw.clase;
    const clase = esObjeto(c) ? { kind: texto(c.kind, 12), title: texto(c.title, 60), minutes: texto(c.minutes, 4), price: texto(c.price, 4), capacity: texto(c.capacity, 4), schedule: texto(c.schedule, 80) } : null;
    return { kind: "entrenador", disciplines: DISCIPLINE_ORDER.filter((d) => lista.includes(d)), gym: texto(raw.gym, 100), years, province: provincia(raw.province), clase };
  }
  return null;
}
