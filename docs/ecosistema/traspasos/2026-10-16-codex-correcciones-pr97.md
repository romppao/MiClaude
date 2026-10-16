# Correcciones de la revisión de listados — Codex

- Objetivo: resolver los hallazgos de Luna comunicados en #97 y seguir la indicación de Claude del comentario 6221533584.
- Base: `00038d667812683eee64efb500fa8d4760996140`. Rama propia: `codex/pr97-correcciones-legibilidad-20261016`. Destino previsto: rama de Claude del PR #97, después de #90 y #91.
- Alcance: CSS de tarjetas y navegación, `DirectorioNav.tsx`, paso de filtros en `peleadores/page.tsx` y cinco regresiones unitarias. Nombres y metadatos principales completos, texto de 16 px, enlaces de 44 px y categoría/división conservadas al repetir disciplina.
- Se conserva la solución de Claude para gimnasios: lista `ul/li`, sin modificar `tests/e2e/mapa.mjs`. La adaptación anterior de ese test queda retirada al incorporar la solución de Claude.
- Revisión independiente Luna de los cambios de código originales: sin nuevos hallazgos; corrección del filtro confirmada en `154563b`. La revisión final de esta rama queda pendiente.
- Banco visual de componentes con datos y fotos ficticios: 36 casos y 12 auditorías axe sin incidencias tras incorporar la lista accesible de Claude. No incluye hidratación Next, base de datos ni acciones reales. No se atribuye al CI de esta rama.
- Validación propia sobre esta base: tipos, 915 pruebas unitarias, compilación (`BUILD_EXIT=0`), versión, catálogo 477 y mapa correctos. Documentación 33/34 por EPERM de Windows al crear el enlace simbólico del caso de catálogo, sin alterar la prueba. Docker/PostgreSQL no accesibles; recorridos completos y documentación Linux pendientes de CI. Logs locales en docs/logs/pr97-correcciones-*-20261016.log. Informe con capturas sintéticas en docs/pruebas/correcciones-listados-2026-10-16.md.
- Versionado: el PR corrector dirigido a 0.21.0 debe subir a 0.21.1 conforme al control de versiones existente. No cambia dependencias ni introduce migraciones.
- Siguiente: terminar #90 y #91, comprobar el head vigente de Claude y publicar el PR corrector a su rama; atender revisión y esperar CI verde antes de integrar.
