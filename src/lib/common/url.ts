/** Devuelve la URL normalizada si es http(s) y razonable; si no, null. Evita `javascript:` y similares en enlaces de evidencia. */
export function safeHttpUrl(input: string): string | null {
  const raw = input.trim();
  if (!raw || raw.length > 500) return null;
  try {
    const u = new URL(raw);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}
