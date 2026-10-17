# T-009 — revisión de evidencias y compatibilidad con carteles

Revisión de Codex, 16-10-2026, solicitada en el encargo de Claude del 15-10. **No equivale a aprobar el lanzamiento ni a probar la fase de entradas.**

## Ejecución comprobada

- PR #91, código `b1597d4e1ed262866b245fea54c141050c445b5f`.
- [CI 38748985341](https://github.com/romppao/MiClaude/actions/runs/38748985341): trabajos `test` y `escenarios` correctos. Se consultaron los pasos y el registro del trabajo de escenarios mediante el conector de GitHub; no se volvió a ejecutar la batería.
- Los registros confirman 16 personas, 93 pasos y cero pasos fallidos. Tipos, unitarias, compilación, extremo a extremo, accesibilidad y experiencia gráfica figuran correctos en ese mismo CI.
- Base de esa ejecución: demo 0.18.7 (`5625f68`). No acredita la compatibilidad completa con #93 ni con la principal futura.

| Recorrido | Pasos | Pasos fallidos |
|---|---:|---:|
| Visitante | 8 | 0 |
| Aficionado | 10 | 0 |
| Peleador | 9 | 0 |
| Promotora | 10 | 0 |
| Federación | 6 | 0 |
| Rival | 6 | 0 |
| Reclamación | 4 | 0 |
| Entrenador titular | 4 | 0 |
| Gimnasio titular | 4 | 0 |
| Moderadora | 7 | 0 |
| Persona mayor | 5 | 0 |
| Cuenta | 5 | 0 |
| Peleador completo | 5 | 0 |
| Club | 3 | 0 |
| Sin verificar | 3 | 0 |
| Creador | 4 | 0 |

## Selectores de veladas

En `tests/e2e/escenarios.mjs`, el recorrido de visitante llega a `/veladas` desde el enlace visible del menú. El de promotora comprueba la velada corregida con `getByText`. Ninguno busca tarjetas `.card` en `/veladas`.

Las tres referencias a `main a.card` corresponden a fichas de `/peleadores`. La otra referencia a `.card` localiza una fila de moderación. El cambio de #93 a `a.velada-cartel` no exige sustituirlas. Esta conclusión procede de la lectura del guion; queda pendiente ejecutarlo sobre la base integrada.

## Hallazgos y límites

- El resumen registra avisos de React #418 en **rival**, **persona mayor** y **peleador completo**. Sus pasos no fallaron, pero el propio guion conserva los errores de página como fricciones. **Causa: prueba, no aplicación**, según reproducción de Claude en desarrollo (comentario6216656220 de #91): la captura añade caret-color:transparent antes de hidratar. Se aplica caret:initial en las dos capturas del guion. La reproducción de tres recorridos es de Claude; la nueva ejecución completa de Codex sobre la base integrada está pendiente del CI.
- No se han revisado nuevas capturas. El artefacto `escenarios-por-persona` existe (ID 11980183674, 23.015.920 bytes), y el conector generó su referencia de descarga, pero la red de ejecución impidió descargarlo al disco. La revisión visual parcial anterior sigue en `escenarios-2026-10-15.md`; sus pendientes visuales continúan abiertos.
- No se han usado cuentas reales ni modificado datos, permisos, producto o protecciones del creador.

## Siguiente

Claude revisa #91. Tras integrar #93, #88, #89 y #90, actualizar #91 mediante merge, renumerar con `scripts/version.mjs` y ejecutar una vez las comprobaciones de la base final. Completar entonces la revisión visual de las capturas y mantener los hallazgos de React para su diagnóstico.


## Ejecución selectiva aprobada por Claude
En GitHub: Actions -> CI -> Run workflow, seleccionar la rama y ejecutar. También corre tras fusionar. Para comprobar un PR concreto antes de fusionarlo, añadir la etiqueta `escenarios` **antes de subir su commit**: el evento de sincronización arranca el trabajo; la etiqueta sola no garantiza una ejecución nueva. #91 se etiqueta para validar una sola vez esta actualización completa. El trabajo ordinario mantiene todos sus controles y recorridos.
