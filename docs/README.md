# Documentación de Ring España

Una página para saber **qué documento abrir según lo que quieras hacer**. Todo lo que está aquí se mantiene al día como parte del trabajo (regla del fundador: se documenta cada bloque de trabajo, para poder contarlo y retomarlo).

## Si quieres…

| Quiero… | Abro |
|---|---|
| **Retomar el proyecto** en otro ordenador o con Claude Code: ponerlo en marcha y saber en qué punto está | [`TRASLADO.md`](TRASLADO.md) |
| **Saber dónde está cada cosa en el código** y por qué ruta ir para hacer algo (añadir una pantalla, una acción, un mensaje, cambiar la base de datos…) | [`DESARROLLO.md`](DESARROLLO.md) |
| **Ver qué pantalla lanza qué acción**, quién puede ejecutarla y en qué tablas escribe | [`MAPA-FUNCIONAL.md`](MAPA-FUNCIONAL.md) (se genera solo con `npm run mapa`) |
| **Entender las decisiones técnicas**: modelo de datos, roles, flujos, seguridad, riesgos y hoja de ruta | [`ARQUITECTURA.md`](ARQUITECTURA.md) |
| **Saber qué se sabe roto** o mejorable (los 99 hallazgos de la auditoría y su estado) | [`AUDITORIA.md`](AUDITORIA.md) |
| **Probar la aplicación como lo haría una persona real** (guiones por perfil: visitante, peleador, organizador, moderación, móvil, persona mayor…) | [`pruebas/personas.md`](pruebas/personas.md) |
| **Ver qué han encontrado las pruebas por personas y qué se hizo con cada cosa** | [`pruebas/hallazgos-2026-10-01.md`](pruebas/hallazgos-2026-10-01.md) |
| **Saber cómo hemos llegado hasta aquí**, sesión a sesión | [`DIARIO.md`](DIARIO.md) |
| **Ver las ideas** (y las descartadas, con su porqué) | [`IDEAS.md`](IDEAS.md) |
| **Evitar repetir un error** ya cometido | [`LECCIONES.md`](LECCIONES.md) |
| **Conocer a la competencia** (incompleto: falta acceso a internet para comprobarlo) | [`COMPETENCIA.md`](COMPETENCIA.md) |
| **Saber las reglas del fundador** (usabilidad para todos, idioma, diseño al final, aura, monetización) | [`../CLAUDE.md`](../CLAUDE.md) |
| **Poner en marcha, probar y desplegar** (comandos, variables de entorno) | [`../README.md`](../README.md) |

## Reglas para mantener la documentación

1. **Al terminar cada bloque de trabajo**, antes de dar la sesión por cerrada: una entrada **al final** de `DIARIO.md` (no se reescriben las anteriores), `IDEAS.md` al día, cada error nuevo en `LECCIONES.md` con su causa real y la regla resultante, y `ARQUITECTURA.md` si cambia el estado técnico.
2. **Lo que se puede generar, se genera:** el mapa funcional sale del código y el CI falla si está desfasado. No se copia a mano lo que el código ya dice.
3. **Un dato, un sitio:** cada hecho vive en un solo documento y los demás lo enlazan.
4. **Lo que salió mal se cuenta tal cual.** El valor de estos documentos es que sean fiables.
5. **Las decisiones que no son técnicas las toma el fundador** (están listadas en `TRASLADO.md`, sección 7). Aquí se registran, no se adelantan.
