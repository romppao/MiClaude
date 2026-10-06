# T-005 — Caché de lecturas públicas
**Fase:** F2 · **Estado:** lista · **Sugerida a:** Codex / Open Code · **Depende de:** idealmente T-007 (medir antes y después)

## Objetivo
Que ver fichas, ránking, calendario, gimnasios y entrenadores (lo que cualquiera ve sin cuenta y casi no cambia) **no golpee la base de datos en cada visita**, sin enseñar nunca datos desactualizados de forma visible tras una escritura.

## Contexto
35 ficheros declaran `export const dynamic = "force-dynamic"` y todas las lecturas van directas a Prisma. Las páginas mezclan datos públicos (ficha, récord, ránking) con partes por usuario (seguir/dejar de seguir, «dar aura», avisos), así que **no se cachea la página entera**: se cachean las **consultas** públicas. Lecturas candidatas: `src/app/peleadores/page.tsx` (listado) y `[slug]/page.tsx` (ficha), `src/app/ranking/page.tsx` (`src/lib/aura/ranking.ts`), `src/app/veladas/page.tsx` y `[slug]`, `gimnasios`, `entrenadores`, `federaciones`, `promotores`, portada `src/app/page.tsx`, `src/lib/common/search.ts`.
Next.js 15: `unstable_cache(fn, claves, { tags, revalidate })` y `revalidateTag(tag)` (de `next/cache`). Las acciones ya llaman `revalidatePath("/", "layout")` tras escribir.

## Pasos
1. Rama `<asistente>/T-005-cache`.
2. Crea `src/lib/common/cache.ts` con un ayudante `leerCacheado(clave, tags, segundos, fn)` sobre `unstable_cache` y las **etiquetas** (`fichas`, `ranking`, `veladas`, `gimnasios`, `entrenadores`, `perfiles`). Importante: `unstable_cache` serializa a JSON → las **fechas llegan como texto**; convierte de vuelta en el ayudante o devuelve datos ya preparados (strings/números).
3. Envuelve **solo** las consultas públicas y de coste real (listados con filtros, ficha completa con récords y combates, ránking, portada). Clave = consulta + parámetros normalizados (los filtros ya se validan). `revalidate` 60 s como red de seguridad.
4. En cada acción que cambie datos públicos (`src/app/actions/*`: fichas, combates, veladas, moderación, perfiles, trayectoria, aura) añade `revalidateTag` de las etiquetas afectadas **además** de lo que ya haya. Hazlo desde un único sitio (`src/app/actions/shared.ts`, `invalidar(...tags)`) para no olvidar ninguna.
5. **No cachear**: nada que dependa de la sesión, colas de moderación, «Mi cuenta», «Mi ficha», búsquedas del propio usuario ni datos de fichas ocultas o no listadas (mantén los filtros `listed: true, hiddenAt: null` dentro de la consulta cacheada).
6. Prueba unitaria del ayudante (fechas, claves distintas por parámetros). Prueba de navegador `tests/e2e/cache.mjs`: (a) una ficha pública refleja un cambio **inmediatamente** después de la acción que lo causa (renombrar, nuevo combate verificado, aura nueva en el ránking); (b) una ficha oculta deja de verse sin esperar 60 s; (c) dos visitas seguidas ejecutan menos consultas (cuenta consultas con el evento `query` de Prisma o un contador de depuración activado por variable `DEBUG_QUERIES=1`).
7. Compara con k6 (T-007) antes y después y anota las cifras en el PR.
8. `npm run typecheck && npm test && npm run build` y **toda** la batería `npm run test:e2e` con base vacía.

## Criterios de aceptación
- Lecturas públicas servidas de caché; tras cualquier escritura que las afecte, el cambio es visible en la siguiente carga (probado).
- Ninguna página privada ni dato oculto cacheados.
- Mejora medida (consultas por visita y latencia) anotada en el PR.

## No hacer
No usar `revalidate` largo sin etiquetas. No cachear respuestas con cookies. No cambiar la interfaz.

## Documentar
`ARQUITECTURA.md` (política de caché y etiquetas), `PLAN.md`, `DIARIO.md`, `LECCIONES.md`, tu registro.
