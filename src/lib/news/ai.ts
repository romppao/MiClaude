import { safeHttpUrl } from "../common/url";

/**
 * Módulo de Inteligencia Artificial («Nano Banano» / Gemini 2.5 Flash gratuito)
 * para enriquecimiento y generación de portadas de combates de Ring España.
 * Utiliza la API gratuita de Google Gemini (15 peticiones/minuto, 0 € de coste).
 * Si no hay clave configurada (GEMINI_API_KEY), opera de forma segura sin interrumpir el flujo.
 */

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

/**
 * Genera un prompt artístico en inglés optimizado para generadores de imágenes (Imagen / Midjourney / Stable Diffusion)
 * centrado en la disciplina y el titular del combate.
 */
export async function generarPromptImagenCombate({
  titulo,
  disciplina = "BOXEO",
}: {
  titulo: string;
  disciplina?: string;
}): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return `Cinematic close-up combat sports photography, intense arena lighting, ${disciplina} action atmosphere, dramatic shadows, realistic sweat and canvas textures, 8k resolution, editorial sports magazine cover style, no text`;
  }

  try {
    const res = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are an elite sports art director for Ring España.
Create a detailed image generation prompt (in English, 35 words max) for a dramatic, cinematic cover photo about this combat sports news:
Title: "${titulo}"
Discipline: ${disciplina}
Guidelines: focus on dramatic arena lighting, gloves/canvas texture, high adrenaline, athletic fighters silhouette, hyperrealistic sports photography, no text, no logos.`,
              },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) throw new Error(`Gemini status ${res.status}`);
    const data = await res.json();
    const promptGenerado = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return promptGenerado || `Cinematic ${disciplina} arena photography, dramatic lighting, high adrenaline, 8k`;
  } catch {
    return `Cinematic ${disciplina} arena photography, dramatic lighting, high adrenaline, 8k`;
  }
}

/**
 * Genera un titular corto o resumen en español cuando el medio no incluye entradilla.
 */
export async function sintetizarTitularConIA(titularLargo: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || titularLargo.length <= 100) return titularLargo;

  try {
    const res = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Resume este titular deportivo en una sola frase concisa en español (máximo 80 caracteres), directa y atractiva para la portada de Ring España:
"${titularLargo}"`,
              },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return titularLargo;
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || titularLargo;
  } catch {
    return titularLargo;
  }
}
