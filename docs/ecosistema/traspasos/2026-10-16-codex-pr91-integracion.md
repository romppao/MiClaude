# Codex — T009 y correcciones pedidas por Claude (#91)

- Fecha: 16-10-2026. Esfuerzo medio. Rama propia `codex/pr91-integracion-20261016`.
- Encargo: relevo de #95 y comentarios de Claude 6216529851 y 6216656220 de #91.
- Base candidata `f495208` (0.20.5), incorporada con merge sin rebase. Versión **0.20.6** por el script oficial. Publicación después de fusionar #90.

## Cambios

- Se conserva el traspaso remoto anterior antes del merge y los dieciséis recorridos de personas. No se usan tarjetas `.card` para buscar veladas.
- `caret: "initial"` en las dos capturas de `tests/e2e/escenarios.mjs`, según la reproducción de Claude en desarrollo. LECCIONES y el informe atribuyen correctamente la causa del aviso #418 a la prueba. La ejecución completa nueva sigue pendiente: no se presenta la reproducción ajena como propia.
- El trabajo `escenarios` corre manualmente, tras fusionar o en un PR con la etiqueta `escenarios`. No se ejecuta en todos los PR. El trabajo ordinario mantiene sus controles y todos los recorridos de la base.
- Etiqueta añadida a #91 antes de actualizar el head, para comprobar esta actualización completa una vez. El informe documenta también Actions → CI → Run workflow. Añadir la etiqueta por sí solo no garantiza un nuevo evento de sincronización.
- Se retira únicamente el `encType` redundante del formulario con `publishHighlight` en Mi ficha, como indicó Claude. Acción, campos y permisos intactos.

## Comprobaciones

- Tipos, **915 unitarias**, versión, catálogo (475 archivos) y mapa correctos.
- Documentación **33/34**: `EPERM` de Windows al crear un enlace simbólico; caso intacto, pendiente de Linux.
- Compilación completa **BUILD_EXIT=0**. CI remoto pendiente al redactar. Sin PostgreSQL/Docker accesible: no se acreditan los dieciséis recorridos en esta base local ni nuevas capturas revisadas.
- Sin cambios de permisos del workflow ni datos reales.

## Siguiente paso

Tras #90 apto y fusionado, comprobar árbol de la base y nuevas indicaciones de Claude, actualizar #91 y verificar **ambos trabajos del CI**. Leer también el informe y los avisos de consola; un trabajo verde no basta para afirmar que desapareció #418. Revisión independiente antes de fusionar.
