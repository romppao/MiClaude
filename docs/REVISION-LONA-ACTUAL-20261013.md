# Corrección de base: adaptación sobre la demo oficial

Fecha: 2026-10-13. Autor: Codex. Complementa y sustituye como entrega vigente a REVISION-RESPONSIVE-20261013.md. El fundador detectó correctamente que la primera revisión partía de una copia antigua.

## Base comprobada

Render, mediante su conector, confirma el servicio ring-espana-demo y el despliegue live dep-db72mh142hec73f5fdag: commit 46c17253985aaf277b2801e41a80c81c2f386b16, versión 0.9.0, rama claude/ring-espana-mvp. Coincide con GitHub. No se ha podido inspeccionar la URL pública con el navegador de este entorno: la correspondencia procede de metadatos del despliegue, no de una comparación visual con producción.

El trabajo previo quedó conservado en 3803495, rama codex/adaptacion-responsive-20261013. Rama actual: codex/adaptacion-lona-actual-20261013. Git por red está bloqueado; se importaron los archivos modificados desde GitHub, fijados al SHA oficial y verificando sus SHA de blob, y se conciliaron los cambios propios. Esto es una importación de contenido: no equivale a incorporar la ascendencia remota en Git. No publicar esta historia local directamente como PR; crear una rama desde el SHA oficial y trasladar únicamente la diferencia propia.

## Resultado

Se conservan la marca Lona, la fotografía actual, el selector de tema y las nuevas funciones oficiales. Se mantienen los ajustes de cabecera, cuadrículas, noticias completas, alturas flexibles de tarjetas, iniciales Unicode e imágenes fallidas descritos en el informe anterior. No hay migraciones nuevas propias ni cambios de datos o permisos.

El banco local /revision-ui usa componentes reales y datos ficticios; no reproduce cuentas ni el contenido de PostgreSQL. Su selector queda en el flujo de la página, sin tapar contenido, y solo existe en desarrollo. Demo visual actual: http://127.0.0.1:3139/revision-ui. La versión preparada es 0.9.1, todavía sin publicar.

## Verificación de esta base

- 106 comprobaciones correctas con tests/browser/responsive.mjs en Chromium de Windows: temas claro y oscuro; anchos 320, 390, 650, 768, 1024, 1280, 1440 y 2560; datos normales, largos, vacíos, uno y mil elementos; menú táctil, Escape, elección y persistencia del tema; iniciales con emoji y fotos ausentes. Axe sin infracciones graves/críticas en actualidad común a 320 y 1440 en ambos temas. Bienvenida, entrar, registro y ayuda responden y no desbordan.
- Capturas revisadas en test-results/responsive/lona-*.png; informe after.json. Los carruseles mantienen desplazamiento horizontal interno. No se certifican Safari, dispositivos físicos ni zoom nativo.
- Unitarias: 675/677; persisten dos fallos de multimedia por rutas POSIX bajo Windows en archivos no modificados por esta corrección.
- Cliente Prisma regenerado sin aplicar migraciones. Typecheck de esta base falla por seis importaciones de maplibre-gl ausente. npm install --offline --ignore-scripts --no-audit --no-fund falla ENOTCACHED para tinyqueue. La compilación completa queda pendiente. Los tipos/build correctos del informe anterior solo corresponden a la base antigua.
- Catálogo canónico LF comprobado: 354 fuentes; mapa: 74 pantallas, 82 acciones, 29 tablas. Para Windows, copia temporal del generador normaliza separadores; generadores originales conservados. Versión 0.9.1 comprobada frente a 0.9.0.

## Pendiente

Validar instalación, tipos, build y flujos con PostgreSQL aislado en un entorno con las dependencias completas; después revisar e integrar mediante el proceso autorizado. No se ha enviado código a GitHub ni actualizado Render. La demo oficial permanece en 0.9.0. El servidor local permite revisar las superficies comprobadas y no debe presentarse como la aplicación completa conectada.

## Autorización posterior del fundador

El fundador autoriza subir esta propuesta a GitHub y ordena esperar a que Claude termine las revisiones que está ejecutando antes de aplicarla. Se prepara una rama propia desde el SHA oficial y un PR en borrador, sin integración automática ni despliegue. Al retomar: comprobar los cambios finales de Claude, conciliar posibles conflictos, actualizar la versión si fuera necesario y verificar CI antes de plantear la integración. La subida de la propuesta no acredita que Claude haya terminado.


## Propuesta subida — espera indicada por el fundador
2026-10-13, Codex. El fundador autoriza subir la propuesta y pide esperar a que Claude termine sus revisiones antes de aplicarla. PR en borrador: https://github.com/romppao/MiClaude/pull/47, rama codex/responsive-lona-20261013, desde la base oficial 46c17253985aaf277b2801e41a80c81c2f386b16. Se verificó que la diferencia contiene solo los 23 archivos previstos (402 líneas añadidas/42 retiradas antes de esta anotación). El commit inicial de propuesta es f8c0dc7e9765940bb8d25248add7ccebf2af3e57; las anotaciones de entrega se añaden después. Sin integración, auto-merge ni despliegue. CI pendiente de resultado; no se ha confirmado que Claude termine. Siguiente paso: esperar confirmación, contrastar sus cambios finales y validar la propuesta actualizada antes de integrar.
