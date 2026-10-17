/**
 * Tareas de moderación para la pantalla «Hoy» (17 de octubre de 2026, petición del fundador: «cuando entro como moderador, las pantallas son
 * muy confusas»). Reglas puras, sin base de datos: qué tipos de trabajo hay, en qué orden se atienden y cómo se agrupan.
 * La lectura de los números está en `contadores.ts`.
 */
export const GRUPOS = ["Personas", "Contenido", "Datos y sistema"] as const;
export type Grupo = (typeof GRUPOS)[number];

export type Tarea = {
  clave: string;
  /** Lo que ve la persona, en lenguaje llano. */
  texto: string;
  /** Una frase que dice qué se hace aquí. */
  ayuda: string;
  grupo: Grupo;
  /** Dónde se atiende (bandeja con ancla o pantalla propia). */
  href: string;
  /** Orden de atención: el 1 es lo primero. Denuncias antes que nada (obligaciones con quien avisa), el trabajo de fondo al final. */
  prioridad: number;
};

/** Todos los tipos de trabajo de moderación, sin números. Una sola fuente para «Hoy» y para las pruebas. */
export const TAREAS: readonly Tarea[] = [
  { clave: "denuncias", texto: "Denuncias de usuarios", ayuda: "Avisos de contenido o de personas.", grupo: "Contenido", href: "/moderacion?ver=avisos", prioridad: 1 },
  { clave: "veladas", texto: "Veladas por autorizar", ayuda: "Veladas con fecha pasada que piden permiso.", grupo: "Contenido", href: "/moderacion/veladas", prioridad: 2 },
  { clave: "senales", texto: "Combates con señales", ayuda: "Resultados con datos que no cuadran.", grupo: "Datos y sistema", href: "/moderacion?ver=senales", prioridad: 3 },
  { clave: "revision", texto: "Combates en revisión", ayuda: "Resultados puestos en duda.", grupo: "Datos y sistema", href: "/moderacion?ver=revision", prioridad: 4 },
  { clave: "fallos", texto: "Fallos sin resolver", ayuda: "Lo que ha fallado en la aplicación.", grupo: "Datos y sistema", href: "/moderacion/fallos", prioridad: 5 },
  { clave: "fichas", texto: "Fichas reclamadas", ayuda: "Alguien dice que una ficha es suya.", grupo: "Personas", href: "/moderacion?ver=reclamaciones", prioridad: 6 },
  { clave: "organizaciones", texto: "Organizaciones por aprobar", ayuda: "Promotoras, federaciones y clubes que piden organizar.", grupo: "Personas", href: "/moderacion?ver=organizadores", prioridad: 7 },
  { clave: "reclamaciones-gimnasio", texto: "Gimnasios reclamados", ayuda: "Alguien dice que un gimnasio es suyo.", grupo: "Personas", href: "/moderacion?ver=reclamaciones-gimnasio", prioridad: 8 },
  { clave: "gimnasios", texto: "Gimnasios por revisar", ayuda: "Altas de gimnasios sin publicar.", grupo: "Contenido", href: "/moderacion/gimnasios", prioridad: 9 },
  { clave: "verificar", texto: "Combates por verificar", ayuda: "Resultados declarados sin señales.", grupo: "Datos y sistema", href: "/moderacion?ver=combates", prioridad: 10 },
  { clave: "noticias", texto: "Fuentes de noticias que fallan", ayuda: "Fuentes que no se pueden leer.", grupo: "Datos y sistema", href: "/moderacion/noticias", prioridad: 11 },
];

export type Contador = Tarea & { n: number };

/** Une los tipos de trabajo con sus números. Una clave sin número cuenta como 0 (nunca se inventa trabajo). */
export function contarTareas(numeros: Record<string, number>): Contador[] {
  return TAREAS.map((t) => ({ ...t, n: Number.isFinite(numeros[t.clave]) && numeros[t.clave] > 0 ? Math.floor(numeros[t.clave]) : 0 }));
}

/** La siguiente tarea: la de menor prioridad con algo pendiente, o null si no queda nada. */
export function siguienteTarea(cs: readonly Contador[]): Contador | null {
  return [...cs].filter((c) => c.n > 0).sort((a, b) => a.prioridad - b.prioridad)[0] ?? null;
}

/** Total de tareas pendientes. */
export const totalPendiente = (cs: readonly Contador[]): number => cs.reduce((s, c) => s + c.n, 0);

/** Agrupa para pintar «Hoy»: cada grupo con sus tareas, las que tienen trabajo primero y luego por prioridad. */
export function agrupar(cs: readonly Contador[]): { grupo: Grupo; tareas: Contador[] }[] {
  return GRUPOS.map((grupo) => ({
    grupo,
    tareas: cs.filter((c) => c.grupo === grupo).sort((a, b) => Number(b.n > 0) - Number(a.n > 0) || a.prioridad - b.prioridad),
  }));
}
