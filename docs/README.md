# Documentación de Ring España

> **Entrada para un programador nuevo (8 oct 2026):** [manual de mantenimiento](mantenimiento/README.md), con contratos por módulo, flujos completos, modelo de datos, motivos técnicos, diagnóstico y [catálogo de cada archivo mantenido](mantenimiento/CATALOGO.md). Las actualizaciones vigentes de diseño se consultan en [DISENO.md](DISENO.md); el relevo de abajo conserva contexto histórico.

> **Relevo de Codex (3 de octubre de 2026):** antes de continuar, lee [APORTACIONES-CODEX.md](APORTACIONES-CODEX.md) para conocer los cambios, las pruebas y los pendientes de integración. El violeta y los perfiles aprobados están integrados en #12. La continuación incorpora trayectoria, respaldo opcional y navegación por actividades, conservando ese diseño. Consulta [DISENO.md](DISENO.md).

Una página para saber **qué documento abrir según lo que quieras hacer**. Todo lo que está aquí se mantiene al día como parte del trabajo (regla del fundador: se documenta cada bloque de trabajo, para poder contarlo y retomarlo).

## Si quieres…

| Quiero… | Abro |
|---|---|
| **Entender el proyecto sin conversaciones previas y mantenerlo como programador nuevo** | [Manual de mantenimiento](mantenimiento/README.md) |
| **Localizar la responsabilidad de cualquier archivo, sus exportaciones directas y su contexto** | [Catálogo del código](mantenimiento/CATALOGO.md) |
| **Retomar el proyecto** en otro ordenador o con Claude Code: ponerlo en marcha y saber en qué punto está | [`TRASLADO.md`](TRASLADO.md) |
| **Saber dónde está cada cosa en el código** y por qué ruta ir para hacer algo (añadir una pantalla, una acción, un mensaje, cambiar la base de datos…) | [`DESARROLLO.md`](DESARROLLO.md) |
| **Probar la aplicación en el navegador** con datos ficticios | [`DEMO.md`](DEMO.md) |
| **Saber qué se hace, en qué orden y por qué** (plan maestro) · rangos y rendimiento de los asistentes | [`PLAN.md`](PLAN.md) · [`RANGOS.md`](RANGOS.md) |
| **Tomar una tarea y ejecutarla** (fichas) · revisar un PR · discutir una decisión | [`tareas/`](tareas/README.md) · [`REVISION.md`](REVISION.md) · [`decisiones/`](decisiones/README.md) |
| **Hacer la prueba de ingreso** (primera vez de un asistente) | [`PRUEBA-DE-INGRESO.md`](PRUEBA-DE-INGRESO.md) y, después, la [«escalera»](PRUEBA-ESCALERA.md) (retos con corrección automática) |
| **Retomar el proyecto desde el portátil** (crear cuentas, migrar la demo, lanzar las pruebas) | [`RELEVO-PORTATIL.md`](RELEVO-PORTATIL.md) |
| **Elegir proveedores y saber cuánto cuesta** (base de datos, imágenes, correo, errores, menores) | [`decisiones/ADR-003-proveedores-fase-0.md`](decisiones/ADR-003-proveedores-fase-0.md) |
| **Colaborar con el resto de asistentes** (reglas, ramas, plantilla de relevo) | [`EQUIPO.md`](EQUIPO.md) |
| **Mantener las fuentes de noticias** (reglas: solo español, panorama español y cada disciplina lo suyo) | [`NOTICIAS.md`](NOTICIAS.md) |
| **Entrar como creador desde cualquier sitio** y gestionar cuentas y moderadores | [`CREADOR.md`](CREADOR.md) |
| **Móvil primero y camino a App Store / Google Play** | [`MOVIL.md`](MOVIL.md) · proceso de publicación y costes: [`PUBLICACION.md`](PUBLICACION.md) |
| **Ver qué pantalla lanza qué acción**, quién puede ejecutarla y en qué tablas escribe | [`MAPA-FUNCIONAL.md`](MAPA-FUNCIONAL.md) (se genera solo con `npm run mapa`) |
| **Entender las decisiones técnicas**: modelo de datos, roles, flujos, seguridad, riesgos y hoja de ruta | [`ARQUITECTURA.md`](ARQUITECTURA.md) |
| **Saber qué se sabe roto** o mejorable (los 99 hallazgos de la auditoría y su estado) | [`AUDITORIA.md`](AUDITORIA.md) |
| **Saber qué queda antes del rediseño** y qué se está corrigiendo | [`PULIDO-FUNCIONAL.md`](PULIDO-FUNCIONAL.md) |
| **Probar la aplicación como lo haría una persona real** (guiones por perfil: visitante, peleador, organizador, moderación, móvil, persona mayor…) | [`pruebas/personas.md`](pruebas/personas.md) |
| **Ver qué han encontrado las pruebas por personas y qué se hizo con cada cosa** | [`pruebas/hallazgos-2026-10-01.md`](pruebas/hallazgos-2026-10-01.md) |
| **Saber cómo hemos llegado hasta aquí**, sesión a sesión | [`DIARIO.md`](DIARIO.md) |
| **Conocer las propuestas visuales y el requisito de colores opuestos a Raunder** | [`DISENO.md`](DISENO.md) |
| **Ver las ideas** (y las descartadas, con su porqué) | [`IDEAS.md`](IDEAS.md) |
| **Evitar repetir un error** ya cometido | [`LECCIONES.md`](LECCIONES.md) |
| **Conocer la competencia** (fuentes contrastadas y límites de la revisión) | [`COMPETENCIA.md`](COMPETENCIA.md) |
| **Saber las reglas del fundador** (usabilidad para todos, idioma, diseño al final, aura, monetización) | [`../CLAUDE.md`](../CLAUDE.md) |
| **Poner en marcha, probar y desplegar** (comandos, variables de entorno) | [`../README.md`](../README.md) |

## Reglas para mantener la documentación

1. **Al terminar cada bloque de trabajo**, antes de dar la sesión por cerrada: una entrada **al final** de `DIARIO.md` (no se reescriben las anteriores), `IDEAS.md` al día, cada error nuevo en `LECCIONES.md` con su causa real y la regla resultante, y `ARQUITECTURA.md` si cambia el estado técnico.
2. **Lo que se puede generar, se genera:** el mapa funcional sale del código y el CI falla si está desfasado. No se copia a mano lo que el código ya dice.
3. **Un dato, un sitio:** cada hecho vive en un solo documento y los demás lo enlazan.
4. **Lo que salió mal se cuenta tal cual.** El valor de estos documentos es que sean fiables.
5. **Las decisiones que no son técnicas las toma el fundador** (están listadas en `TRASLADO.md`, sección 7). Aquí se registran, no se adelantan.
