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


## Hallazgo de la revisión independiente
Luna detectó que la guarda final aún admitía doce personas. Se refuerza para exigir las dieciséis identidades esperadas, sin omisiones, duplicados ni sustituciones. La ejecución parcial conserva su comportamiento anterior. Comprobación de sintaxis y catálogo actualizados; la ejecución real del nuevo control sigue pendiente del CI.

## Actualización tras adelantar listados (#97)
- Claude comunicó en comentario6221715692 la autorización del fundador para adelantar #97 e incorporó las correcciones en26bffc4. #90 se prepara sobre esa base como0.21.1 (3812d33), conservando la corrección visible de Boxeo.
- #91 integra esa candidata con merge y se renumera con el script a0.21.2. Se conservan ambas capturas caret:initial, condición de escenarios manual/push/etiqueta, guarda de las dieciséis personas y retirada de encType redundante. No se modifica la lógica de listados ni de altas.
- Esta combinación pasa tipos,920 unitarias, versión, catálogo478 y mapa. Documentación33/34 por EPERM Windows, caso intacto. Compilación nueva en curso al registrar. Sin navegador con DB local; CI definitivo pendiente.
- La candidata es preparatoria, sin actualizar todavía el PR91 remoto. Esperar #97 apto y fusionado, publicar #90 actualizado, y después #91 cuando #90 esté apto.


## 17-10-2026 — Reconciliación con Claude
- #97, #99 y #100 ya están fusionados; #98 cerrado como superado tras comprobar que cuenta.mjs coincide con la corrección incorporada.
- #91 incorpora la candidata del menú #101 sin cambiar la carpeta ni el índice de Claude: preparación con objetos Git e índice aislado, sin clon ni node_modules duplicados.
- Conserva guías de acción, carteles y popularidad de gimnasios, cambio de papel en demo y refresco automático. Mantiene los dieciséis escenarios, caret:initial, ejecución manual/push/etiqueta y la guarda exacta de dieciséis personas.
- La versión se renumera por encima de 0.22.2. No se publica hasta contrastar el resultado de #101 y la principal real.
- Se comprueban sintaxis y documentación desde una copia temporal de fuentes bajo docs/logs, sin ejecutar navegador ni base de datos. Tipos, unitarias, build y escenarios completos de esta combinación quedan pendientes del CI.

## 17-10-2026 — Ejecución actual y espera de navegación
- Cabeza inicial publicada c6c19b7, versión0.22.3: tipos y961 unitarias correctos, catálogo483 y mapa89/106/38 correctos. Documentación local33/34 por EPERM Windows en symlink; el CI de Linux supera ese bloque sin cambiar la prueba.
- CI39010980585: escenarios completos correctos,16 personas,93 pasos y0 fallos. El informe registra React#418 en peleador y moderadora; no se oculta ni se da por resuelto. Se verificó la existencia y lectura de las93 capturas y se inspeccionó la captura final de cada persona, sin afirmar revisión de cada paso.
- Diagnóstico con base ficticia propia: ambos recorridos pasan normalmente en desarrollo. Con CPUx4 y carga de JavaScript retrasada, la comprobación inmediata de Mis combates puede leer la pestaña antes de estar lista; el diagnóstico Linux39011664196 reproduce ese fallo de la prueba, sin avisos React. No se cambió el producto ni se descartó una aserción.
- La prueba abre Combates como una persona y espera a que la fila de su velada sea visible antes de verificar nombre, declaración y regla de24 horas. Los9 pasos pasan bajo la misma ralentización tras el ajuste. Los errores de página incluyen ahora la ruta y más detalle en el informe para investigar los avisos pendientes.
- La instrumentación de CPU y registro completo solo existe en copias temporales o la rama manual de diagnóstico, no en el PR. Nueva ejecución CI necesaria para la cabeza que incorpora esta espera; no se confunde el resultado anterior con el de esa cabeza.
