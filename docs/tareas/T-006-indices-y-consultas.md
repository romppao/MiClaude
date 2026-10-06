# T-006 — Índices y consultas de listados
**Fase:** F2 · **Estado:** lista · **Sugerida a:** Open Code / Copilot (necesita PostgreSQL local) · **Depende de:** —

## Objetivo
Que los listados y el ránking sigan rápidos con mucho volumen (100 000 peleadores, 1 000 000 de combates) con índices y consultas revisadas con datos reales.

## Contexto
Índices actuales: ver `prisma/schema.prisma` (p. ej. `Fighter`: `gymId`, `trainerId`, `listed`, `[lastName, firstName]`, `province`; `FighterDiscipline`: `[discipline, level, divisionId, weightClass]`; `Aura`: `fighterId`, `boutId`). Consultas críticas: `src/app/peleadores/page.tsx` (filtros por disciplina/nivel/división/categoría/provincia + búsqueda `searchIds`), `src/lib/common/search.ts` (búsqueda por nombre sin tildes, usa SQL con `translate`/`regexp_replace`), `src/lib/aura/ranking.ts` (agrupa por aura en periodo), listados de veladas y colas de moderación (`src/app/moderacion/*`, paginadas).

## Pasos
1. Rama `<asistente>/T-006-indices`. Base local vacía + el script `scripts/entorno-aislado.sh iniciar t006 3330`.
2. Script `scripts/datos-de-carga.mjs` (nuevo): genera de forma determinista **100 000 fichas, 300 000 combates, 5 000 veladas, 1 000 000 de auras** en bloques con `createMany` (datos claramente ficticios, prefijo `carga-`), con opción `--limpiar`. Solo funciona en bases locales (mismo control que `prisma/seed.ts`).
3. Para cada consulta crítica ejecuta `EXPLAIN (ANALYZE, BUFFERS)` (con Prisma `$queryRawUnsafe` en un script o `psql`) y guarda las salidas en `docs/rendimiento/EXPLAIN-<fecha>.md` con **antes y después**.
4. Busca: `Seq Scan` sobre tablas grandes, `OFFSET` altos (paginación: valora paginación por clave si `OFFSET` degrada), ordenaciones sin índice, `OR` que impiden índices, búsqueda por nombre (valora `pg_trgm` + índice GIN sobre una columna normalizada; migración aditiva que cree la extensión solo si el proveedor la permite — si no, documenta la alternativa).
5. Añade **solo** los índices que mejoren una consulta real medida (migración aditiva `<fecha>_indices_listados`). Cada índice con comentario `-- por qué` y la mejora medida.
6. Presupuesto: listado filtrado y ficha < 100 ms en la base de carga, ránking < 300 ms, búsqueda < 150 ms. Si no se alcanza, abre RFC con las cifras en vez de improvisar.
7. `npm run test:e2e` completo con base vacía (los índices no cambian resultados) y las migraciones deben reproducir `schema.prisma` exactamente (el CI lo comprueba).

## Criterios de aceptación
- Informe con EXPLAIN antes/después y presupuesto cumplido o RFC.
- Migración aditiva; ninguna prueba cambia de resultado.

## No hacer
No añadir índices «por si acaso» (cuestan escritura). No cargar los datos de carga en Render ni en producción.

## Documentar
`docs/rendimiento/`, `ARQUITECTURA.md`, `PLAN.md`, `DIARIO.md`, `LECCIONES.md`, tu registro.
