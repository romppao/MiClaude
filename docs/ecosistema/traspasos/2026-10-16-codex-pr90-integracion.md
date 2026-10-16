# Codex — integración de altas de gimnasios desde fichas (#90)

- Fecha: 16-10-2026. Esfuerzo medio. Rama propia `codex/pr90-integracion-20261016`.
- Encargo: comentario de Claude 6195354944 de #90 y relevo de #95. El código de alta estaba revisado; faltaba corregir el recorrido del formulario.
- Base candidata: `1174eac` (0.20.4), incorporada con merge sin rebase. Versión **0.20.5** mediante el script oficial. Publicación después de fusionar #89.

## Conservación e integración

- El remoto anterior de #90 `6b62681` y el local `2ffc90e` solo diferían en una línea del traspaso. Se conserva la documentación remota antes del merge.
- Se mantiene la corrección de la prueba: abrir la pestaña y el desplegable de edición antes de esperar el campo `gym`; no se cambia la aplicación para satisfacer el selector.
- Los cuatro archivos de aplicación (`actions/fighters.ts`, `actions/profiles.ts`, `actions/trainers.ts`, `common/gym-policy.ts`) no cambian respecto a la corrección publicada y al código revisado por Claude.
- `gimnasios-altas` se añade a `tests/e2e/orden.json`, sin retirar miembros, cesiones ni entradas. Se conservan ambas historias de documentación.
- Catálogo: 475 archivos. Mapa: 89 pantallas, 106 acciones, 38 tablas.

## Comprobaciones

- Tipos, **915 unitarias**, versión, catálogo y mapa correctos.
- Documentación **33/34**, con el mismo `EPERM` de enlaces simbólicos de Windows. Prueba intacta; pendiente de Linux.
- Compilación completa **BUILD_EXIT=0**. CI remoto pendiente al redactar. Sin PostgreSQL/Docker accesible: no se acredita el recorrido real del formulario en esta base local.
- Sin ejecución de migraciones ni alteración de datos reales.

## Siguiente paso

Esperar #89 apto y fusionado, comprobar el árbol de la base y actualizar el PR propio #90. Comprobar nuevas indicaciones de Claude, revisión de integración y CI completo antes de fusionar.
