import type { HighlightKind } from "@prisma/client";
import { safeHttpUrl } from "../common/url";

/** Lo mejor de un peleador, publicado por él mismo. Un vídeo es un enlace (YouTube, Instagram, TikTok…); una foto se sube y se guarda normalizada. */
export const HIGHLIGHT_TITLE_MAX = 60;
export const MAX_HIGHLIGHTS = 12;
export const HIGHLIGHT_KIND_LABEL: Record<HighlightKind, string> = { VIDEO: "Vídeo", PHOTO: "Foto" };

export type HighlightInput = { kind: string; title: string; videoUrl: string; hasImage: boolean };
export type HighlightParsed = { ok: true; kind: HighlightKind; title: string; videoUrl: string | null } | { ok: false; problema: string };

/** Valida lo que llega del formulario «Publicar un highlight». Los códigos de problema tienen su texto en `messages.ts`. */
export function parseHighlight(input: HighlightInput): HighlightParsed {
  const kind = input.kind === "VIDEO" || input.kind === "PHOTO" ? input.kind : null;
  if (!kind) return { ok: false, problema: "highlight_tipo" };
  const title = input.title.replace(/\s+/g, " ").trim();
  if (!title) return { ok: false, problema: "highlight_titulo" };
  if (title.length > HIGHLIGHT_TITLE_MAX) return { ok: false, problema: "highlight_titulo_largo" };
  if (kind === "VIDEO") {
    const url = safeHttpUrl(input.videoUrl);
    if (!url || !url.startsWith("https://")) return { ok: false, problema: "highlight_enlace" };
    return { ok: true, kind, title, videoUrl: url };
  }
  if (!input.hasImage) return { ok: false, problema: "highlight_foto" };
  return { ok: true, kind, title, videoUrl: null };
}

/** Orden en la ficha: el destacado primero y después del más reciente al más antiguo. */
export function orderHighlights<T extends { pinned: boolean; createdAt: Date; id: string }>(list: T[]): T[] {
  return [...list].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt.getTime() - a.createdAt.getTime() || a.id.localeCompare(b.id));
}
