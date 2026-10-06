# T-007 — Prueba de carga (k6) y presupuesto de rendimiento
**Nivel:** N2 (ver [`../RANGOS.md`](../RANGOS.md): quién puede tomarla)  
**Fase:** F2 · **Estado:** lista · **Sugerida a:** Antigravity (puede ejecutar el servidor) o Copilot · **Depende de:** T-006 (datos de carga)

## Objetivo
Saber con números cuántos usuarios simultáneos aguanta la aplicación y dónde se rompe primero, y poder repetir la medición después de cada mejora (T-004, T-005, T-006).

## Contexto
No existe ninguna prueba de carga. La aplicación se arranca con `scripts/entorno-aislado.sh iniciar <nombre> <puerto> [--semilla]` (producción local: `next start`). Rutas públicas representativas: `/`, `/peleadores`, `/peleadores?disciplina=BOXEO&level=PRO`, `/peleadores/<slug>`, `/ranking`, `/veladas`, `/buscar?q=…`, `/imagenes/...`, `/salud`.

## Pasos
1. Rama `<asistente>/T-007-carga`. Instala k6 (<https://k6.io>; si no se puede, usa `autocannon` por `npx` y dilo).
2. `tests/carga/publico.k6.js`: escenarios por etapas (10 → 50 → 200 → 500 usuarios virtuales, 1 min cada una) con la mezcla: 40 % ficha, 20 % listados con filtros, 15 % portada, 10 % ránking, 10 % búsqueda, 5 % imágenes. Umbrales: p95 < 800 ms, errores < 1 %.
3. `tests/carga/con-sesion.k6.js` (aficionado: entrar, ver ficha, dar aura, seguir): 5–20 usuarios, para detectar cuellos en escrituras.
4. `scripts/carga.sh`: levanta entorno aislado con los datos de T-006, ejecuta k6, guarda el resumen en `docs/rendimiento/CARGA-<fecha>.md` (versión/commit, máquina, cifras, cuello observado: CPU del servidor, conexiones a la base, consultas lentas).
5. Ejecútalo **antes** de T-005/T-004/T-006 si aún no están integradas (línea base) y **después** de cada una; la tabla comparativa vive en `docs/rendimiento/README.md`.
6. Nunca contra la demo de Render ni producción. Documenta los límites de la máquina local (la prueba solo es comparable consigo misma).

## Criterios de aceptación
- Scripts reproducibles con un comando (`scripts/carga.sh`), informe con línea base y umbrales.
- El informe dice cuál es el primer recurso que se agota.

## No hacer
No lanzar carga contra servicios ajenos o públicos. No subir datos de carga a Render.

## Documentar
`docs/rendimiento/`, `PLAN.md`, `DIARIO.md`, tu registro.
