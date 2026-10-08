import { after } from "next/server";
import type { NewsSource } from "@prisma/client";
import { db } from "../common/db";
import { CONSERVAR_DIAS, FUENTES_INICIALES, REFRESCO_MS } from "./sources";
import { disciplinasDe, parseFeed } from "./parse";

/**
 * Actualización de las noticias. Se lanza en segundo plano (after()) cuando alguien abre la portada y alguna fuente lleva más de
 * REFRESCO_MS sin leerse, así no hace falta un servidor de tareas. Cada fuente se «reserva» con una actualización condicional, de modo
 * que dos visitas a la vez no la leen dos veces. NEWS_FETCH=no lo desactiva (pruebas y CI, que no tienen salida a internet).
 */
export const noticiasActivas = () => process.env.NEWS_FETCH !== "no";

const MAX_BYTES = 3_000_000;
const TIEMPO_MAX_MS = 10_000;

export async function asegurarFuentesIniciales() {
  await db.newsSource.createMany({ data: FUENTES_INICIALES, skipDuplicates: true });
}

async function leer(url: string): Promise<string> {
  const r = await fetch(url, { signal: AbortSignal.timeout(TIEMPO_MAX_MS), headers: { "user-agent": "RingEspana/1.0 (lector de noticias)", accept: "application/rss+xml, application/atom+xml, application/xml, text/xml" }, redirect: "follow" });
  if (!r.ok) throw new Error(`La fuente respondió con el código ${r.status}`);
  if (Number(r.headers.get("content-length") ?? 0) > MAX_BYTES) throw new Error("La fuente es demasiado grande");
  const texto = await r.text();
  if (texto.length > MAX_BYTES) throw new Error("La fuente es demasiado grande");
  return texto;
}

const mensaje = (e: unknown) => (e instanceof Error ? (e.name === "TimeoutError" ? "La fuente no respondió a tiempo" : e.message) : "Error desconocido").slice(0, 200);

async function actualizarFuente(f: NewsSource, forzar: boolean): Promise<"ok" | "error" | "ocupada"> {
  const ahora = new Date();
  const limite = new Date(ahora.getTime() - (forzar ? 60_000 : REFRESCO_MS));
  const reservada = await db.newsSource.updateMany({ where: { id: f.id, active: true, OR: [{ lastAttemptAt: null }, { lastAttemptAt: { lt: limite } }] }, data: { lastAttemptAt: ahora } });
  if (reservada.count === 0) return "ocupada";
  try {
    const entradas = parseFeed(await leer(f.url), ahora);
    if (entradas.length === 0) throw new Error("La fuente no tiene noticias legibles");
    await db.newsItem.createMany({
      data: entradas.map((e) => ({ ...e, sourceId: f.id, disciplines: disciplinasDe(f.disciplines, e) })),
      skipDuplicates: true,
    });
    await db.newsSource.update({ where: { id: f.id }, data: { lastOkAt: new Date(), lastError: null, lastCount: entradas.length } });
    return "ok";
  } catch (e) {
    await db.newsSource.update({ where: { id: f.id }, data: { lastError: mensaje(e) } });
    return "error";
  }
}

export async function actualizarNoticias({ forzar = false } = {}) {
  if (!noticiasActivas()) return { ok: 0, error: 0 };
  await asegurarFuentesIniciales();
  const limite = new Date(Date.now() - (forzar ? 60_000 : REFRESCO_MS));
  const pendientes = await db.newsSource.findMany({ where: { active: true, OR: [{ lastAttemptAt: null }, { lastAttemptAt: { lt: limite } }] } });
  const cuenta = { ok: 0, error: 0 };
  // De cuatro en cuatro, para no abrir demasiadas conexiones a la vez desde un servidor pequeño.
  for (let i = 0; i < pendientes.length; i += 4) {
    for (const r of await Promise.all(pendientes.slice(i, i + 4).map((f) => actualizarFuente(f, forzar)))) if (r !== "ocupada") cuenta[r]++;
  }
  await db.newsItem.deleteMany({ where: { publishedAt: { lt: new Date(Date.now() - CONSERVAR_DIAS * 864e5) } } });
  return cuenta;
}

/** ¿Hay alguna fuente por leer? Consulta barata para decidir si se lanza la actualización en segundo plano. */
export async function noticiasPorActualizar() {
  if (!noticiasActivas()) return false;
  const total = await db.newsSource.count();
  if (total === 0) return true;
  return (await db.newsSource.count({ where: { active: true, OR: [{ lastAttemptAt: null }, { lastAttemptAt: { lt: new Date(Date.now() - REFRESCO_MS) } }] } })) > 0;
}

/** Desde una pantalla: si toca, actualiza las noticias cuando ya se ha enviado la respuesta (la persona no espera). */
export function actualizarSiToca() {
  if (!noticiasActivas()) return;
  after(async () => {
    try {
      if (await noticiasPorActualizar()) await actualizarNoticias();
    } catch (e) {
      console.error("No se pudieron actualizar las noticias", e);
    }
  });
}
