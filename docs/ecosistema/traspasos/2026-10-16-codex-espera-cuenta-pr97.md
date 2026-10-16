# Espera del formulario en el recorrido de cuenta

- Objetivo: corregir el único fallo del CI 38944692874 de #97, sin alterar la aplicación ni sus reglas de eliminación de cuenta.
- Base: `26bffc4`. Rama propia: `codex/pr97-espera-formulario-cuenta-20261016`. Destino previsto: rama de Claude del #97.
- Evidencia: 39/40 recorridos correctos. En cuenta.mjs:115, tras mostrar el error de contraseña incorrecta, `document.querySelector('[name=confirm]')` devuelve null y el acceso directo a removeAttribute falla. No se ha reproducido el recorrido Next completo localmente.
- Corrección: esperar la URL de error de la pantalla de eliminación; usar un locator con espera automática; desmarcar explícitamente la confirmación y retirar únicamente la validación HTML required para comprobar el rechazo del servidor. Permanecen las comprobaciones de contraseña incorrecta, falta de confirmación, eliminación válida y acceso posterior denegado.
- No se modifica código de aplicación, permisos ni datos reales. El fallo observado es compatible con la aparición del aviso antes del formulario; la reproducción integral de esa secuencia queda pendiente del CI.
- Validación: sintaxis correcta; caso aislado Chromium con CSS real y un campo que aparece después del aviso, correcto (desmarca la casilla y retira required sin acceso nulo). Fixture sintético, sin Next ni validación de servidor. Versión, catálogo 477 y mapa comprobados. No se repite batería unitaria/compilación por un cambio exclusivo de prueba y registros. Revisión y CI pendientes. Sin PostgreSQL/Docker local accesible.
- Versión: 0.21.1 por la regla de que un PR corrector supera la versión 0.21.0 de su destino. Tras su integración habrá que renumerar #90 y #91 antes de publicarlos.
