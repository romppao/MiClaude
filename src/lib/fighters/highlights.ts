import type { HighlightKind } from "@prisma/client";
import { safeHttpUrl } from "../common/url";

/** Lo mejor de un peleador, publicado por él mismo. Un vídeo se sube a la aplicación (videoKey) o es un enlace (YouTube, Instagram, TikTok…); una foto se sube y se guarda normalizada. */
export const HIGHLIGHT_TITLE_MAX = 60;
export const MAX_HIGHLIGHTS = 12;
export const HIGHLIGHT_KIND_LABEL: Record<HighlightKind, string> = { VIDEO: "Vídeo", PHOTO: "Foto" };

export type HighlightInput = { kind: string; title: string; videoUrl: string; hasImage: boolean; videoKey?: string };
export type HighlightParsed = { ok: true; kind: HighlightKind; title: string; videoUrl: string | null; videoKey: string | null } | { ok: false; problema: string };

/** Valida lo que llega del formulario «Publicar un highlight». Los códigos de problema tienen su texto en `messages.ts`. */
export function parseHighlight(input: HighlightInput): HighlightParsed {
  const kind = input.kind === "VIDEO" || input.kind === "PHOTO" ? input.kind : null;
  if (!kind) return { ok: false, problema: "highlight_tipo" };
  const title = input.title.replace(/\s+/g, " ").trim();
  if (!title) return { ok: false, problema: "highlight_titulo" };
  if (title.length > HIGHLIGHT_TITLE_MAX) return { ok: false, problema: "highlight_titulo_largo" };
  if (kind === "VIDEO") {
    if (input.videoKey) return { ok: true, kind, title, videoUrl: null, videoKey: input.videoKey };
    const url = safeHttpUrl(input.videoUrl);
    if (!url || !url.startsWith("https://")) return { ok: false, problema: "highlight_enlace" };
    return { ok: true, kind, title, videoUrl: url, videoKey: null };
  }
  if (!input.hasImage) return { ok: false, problema: "highlight_foto" };
  return { ok: true, kind, title, videoUrl: null, videoKey: null };
}

/**
 * Portada de un vídeo enlazado, cuando la web la publica en una dirección conocida: hoy solo YouTube (su miniatura en i.ytimg.com,
 * permitida en la política de contenido). Instagram y TikTok no la ofrecen sin su API: esos vídeos muestran el nombre de la web.
 */
export function miniaturaDeEnlace(url: string | null | undefined): string | null {
  if (!url) return null;
  let u: URL;
  try { u = new URL(url); } catch { return null; }
  const host = u.hostname.replace(/^(www\.|m\.)/, "");
  let id: string | null = null;
  if (host === "youtu.be") id = u.pathname.slice(1).split("/")[0];
  else if (host === "youtube.com" || host === "music.youtube.com") id = u.searchParams.get("v") ?? u.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)/)?.[1] ?? null;
  return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

/** Nombre de la web de un vídeo enlazado, para la tarjeta sin portada. */
export function webDeEnlace(url: string | null | undefined): string {
  const host = (() => { try { return new URL(url ?? "").hostname.replace(/^www\./, ""); } catch { return ""; } })();
  return host.includes("instagram") ? "Instagram" : host.includes("tiktok") ? "TikTok" : host.includes("youtu") ? "YouTube" : host.includes("facebook") || host === "fb.watch" ? "Facebook" : "otra web";
}

/** Orden en la ficha: el destacado primero y después del más reciente al más antiguo. */
export function orderHighlights<T extends { pinned: boolean; createdAt: Date; id: string }>(list: T[]): T[] {
  return [...list].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt.getTime() - a.createdAt.getTime() || a.id.localeCompare(b.id));
}
