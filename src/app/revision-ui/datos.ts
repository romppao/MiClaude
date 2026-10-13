import type { DatosVisitante } from "../_inicio/Visitante";
import type { Noticia } from "../../lib/news/feed";

/** Casos ficticios de lectura: nunca se guardan ni consultan datos de personas reales. */
export const ESTADOS = ["demo", "extremo", "vacio", "uno", "mil"] as const;
export type Estado = typeof ESTADOS[number];
const fecha = new Date("2026-10-20T18:00:00+02:00");

export function datosRevision(estado: Estado): DatosVisitante {
  const extremo = estado === "extremo" || estado === "mil";
  const cantidad = estado === "vacio" ? 0 : estado === "uno" ? 1 : estado === "mil" ? 1000 : 6;
  const nombres = extremo
    ? ["Aleksandra Wiśniewska-Kowalczyk", "Jo", "Đặng Thị Ngọc Hân", "王秀英", "María José de la Cruz y Fernández", "🦊 Fox"]
    : ["Álex García", "Laura Torres", "Dani Martín", "Sara Pérez", "Pablo Díaz", "Lucía López"];
  const noticias: Noticia[] = Array.from({ length: estado === "vacio" ? 0 : estado === "uno" ? 1 : 13 }, (_, i) => ({
    id: `revision-noticia-${i}`, sourceId: "revision", guid: `revision-${i}`,
    url: "https://example.com/deportes/actualidad", clave: "revision",
    title: extremo ? (i === 1 ? "Benachrichtigungseinstellungen" : "La comunidad de deportes de contacto prepara un encuentro nacional de clubes, entrenadores y deportistas de todas las disciplinas") : "Los clubes se preparan para una nueva jornada de deportes de contacto",
    publisher: extremo ? "Federación y Asociación de Clubes de Deportes de Contacto de toda España" : null,
    source: { name: "Medio de ejemplo", kind: i % 2 ? "VIDEO" : "PRENSA" },
    summary: null, imageUrl: extremo ? "/revision-imagen-inexistente.webp" : null,
    publishedAt: fecha, createdAt: fecha, hiddenAt: null,
    disciplines: extremo ? ["BOXEO", "JIUJITSU", "K1", "KICKBOXING", "MMA", "MUAYTHAI"] : ["MMA"],
  }));
  return {
    noticias,
    veladas: Array.from({ length: cantidad }, (_, i) => ({
      id: `revision-velada-${i}`, slug: `revision-velada-${i}`, date: fecha,
      name: extremo ? "Encuentro nacional amateur de clubes de deportes de contacto y exhibición de nuevas promesas" : "Encuentro de clubes",
      city: extremo ? "Villanueva de la Cañada · Comunidad de Madrid" : "Valencia",
      discipline: "KICKBOXING", level: "AMATEUR",
    })),
    conAura: Array.from({ length: cantidad }, (_, i) => ({
      id: `revision-peleador-${i}`, slug: `revision-peleador-${i}`,
      name: nombres[i % nombres.length], discipline: "JIUJITSU", pos: i + 1,
      aura: extremo ? (i === 1 ? 0 : 12345678) : i + 1,
      avatarUrl: "/revision-imagen-inexistente.webp",
    })),
  };
}
