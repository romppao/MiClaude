// Noticias de la portada: moderación gestiona las fuentes y puede ocultar un titular. La lectura de los canales está en lib/news.
// Todo lo que se exporta aquí es un punto de entrada público del servidor (POST): los ayudantes van sin exportar o en ./shared.
"use server";

import { revalidatePath } from "next/cache";
import type { NewsSourceKind } from "@prisma/client";
import { db } from "../../lib/common/db";
import { requireAdmin } from "../../lib/accounts/permissions";
import { audit } from "../../lib/common/audit";
import { safeHttpUrl } from "../../lib/common/url";
import { isDiscipline } from "../../lib/common/disciplines";
import { hasOwn } from "../../lib/common/safe";
import { LIMITS } from "../../lib/common/text";
import { actualizarNoticias, noticiasActivas } from "../../lib/news/refresh";
import { TIPO_DE_FUENTE_ETIQUETA } from "../../lib/news/sources";
import { go, guard, str } from "./shared";

const BACK = "/moderacion/noticias";

/** Lee ahora todas las fuentes activas (sin esperar a la media hora). */
export async function refreshNewsNow() {
  const admin = await requireAdmin();
  if (!noticiasActivas()) go(BACK, { problema: "noticias_desactivadas" });
  const r = await actualizarNoticias({ forzar: true });
  await audit({ userId: admin.id, entity: "NEWS", entityId: "todas", action: "REFRESHED", after: r });
  revalidatePath("/", "layout");
  go(BACK, { aviso: r.error ? "noticias_actualizadas_con_errores" : "noticias_actualizadas" });
}

export async function addNewsSource(f: FormData) {
  const admin = await requireAdmin();
  const name = str(f, "name");
  const url = safeHttpUrl(str(f, "url"));
  const kind = str(f, "kind");
  if (!name || name.length > LIMITS.orgName) go(BACK, { problema: "fuente_nombre" });
  if (!url || !url.startsWith("https://")) go(BACK, { problema: "fuente_url" });
  if (!hasOwn(TIPO_DE_FUENTE_ETIQUETA, kind)) go(BACK, { problema: "fuente_tipo" });
  const disciplines = f.getAll("disciplina").map(String).filter(isDiscipline);
  const fuente = await guard(BACK, () => db.newsSource.create({ data: { name, url, kind: kind as NewsSourceKind, disciplines } }), "fuente_repetida");
  await audit({ userId: admin.id, entity: "NEWS_SOURCE", entityId: fuente.id, action: "CREATED", after: { name, url, kind, disciplines } });
  go(BACK, { aviso: "fuente_anadida" });
}

/** Activa o desactiva una fuente. Al desactivarla, sus titulares dejan de mostrarse (no se borran). */
export async function toggleNewsSource(f: FormData) {
  const admin = await requireAdmin();
  const fuente = await db.newsSource.findUnique({ where: { id: str(f, "sourceId") } });
  if (!fuente) go(BACK, { problema: "no_existe" });
  await db.newsSource.update({ where: { id: fuente.id }, data: { active: !fuente.active, lastAttemptAt: null } });
  await audit({ userId: admin.id, entity: "NEWS_SOURCE", entityId: fuente.id, action: fuente.active ? "DISABLED" : "ENABLED" });
  revalidatePath("/", "layout");
  go(BACK, { aviso: fuente.active ? "fuente_desactivada" : "fuente_activada" });
}

/** Oculta (o vuelve a mostrar) un titular concreto: por ejemplo, uno que no es de deportes de contacto. */
export async function toggleNewsItem(f: FormData) {
  const admin = await requireAdmin();
  const item = await db.newsItem.findUnique({ where: { id: str(f, "itemId") } });
  if (!item) go(BACK, { problema: "no_existe" });
  await db.newsItem.update({ where: { id: item.id }, data: { hiddenAt: item.hiddenAt ? null : new Date() } });
  await audit({ userId: admin.id, entity: "NEWS_ITEM", entityId: item.id, action: item.hiddenAt ? "SHOWN" : "HIDDEN", after: { title: item.title } });
  revalidatePath("/", "layout");
  go(BACK, { aviso: item.hiddenAt ? "noticia_mostrada" : "noticia_ocultada" });
}
