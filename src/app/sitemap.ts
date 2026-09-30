import type { MetadataRoute } from "next";
import { db } from "../lib/db";
import { APP_URL } from "../lib/mail";

export const dynamic = "force-dynamic";

/** Mapa del sitio: páginas fijas y fichas públicas (no incluye fichas sin reclamar ni ocultas). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [fighters, events, gyms, trainers] = await Promise.all([
    db.fighter.findMany({ where: { listed: true, hiddenAt: null }, select: { slug: true }, take: 5000 }),
    db.event.findMany({ where: { status: { not: "CANCELLED" } }, select: { slug: true, date: true }, orderBy: { date: "desc" }, take: 5000 }),
    db.gym.findMany({ select: { slug: true }, take: 2000 }),
    db.trainer.findMany({ select: { slug: true }, take: 2000 }),
  ]);
  const fijas = ["", "/peleadores", "/ranking", "/veladas", "/gimnasios", "/entrenadores", "/ayuda", "/privacidad"].map((p) => ({ url: `${APP_URL}${p}` }));
  return [
    ...fijas,
    ...fighters.map((f) => ({ url: `${APP_URL}/peleadores/${f.slug}` })),
    ...events.map((e) => ({ url: `${APP_URL}/veladas/${e.slug}`, lastModified: e.date })),
    ...gyms.map((g) => ({ url: `${APP_URL}/gimnasios/${g.slug}` })),
    ...trainers.map((t) => ({ url: `${APP_URL}/entrenadores/${t.slug}` })),
  ];
}
