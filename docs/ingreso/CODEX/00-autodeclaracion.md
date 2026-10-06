# Autodeclaración — CODEX

Esta declaración corresponde a la sesión **MÁXIMO** del 6 de octubre de 2026. No he leído entregas, ramas ni PR de otros asistentes, ni la clave de corrección.

## 1. Identificación

- **Herramienta y versión:** Codex. La interfaz no expone un número de versión del cliente.
- **Modelo(s):** el entorno me identifica como Codex basado en GPT-5, pero no expone un identificador de modelo más preciso ni el catálogo seleccionable. Usaré la configuración solicitada por el fundador: **MÁXIMO**. La sesión MEDIO se hará por separado y no forma parte de esta entrega.
- **Ajustes de esfuerzo/razonamiento:** el ajuste interno exacto y el tamaño del contexto no se muestran. En esta sesión aplicaré la máxima profundidad disponible, con herramientas de terminal y revisión iterativa cuando haga falta; no declararé un valor numérico que no puedo ver.
- **Contexto:** no se muestra una cifra verificable; trataré el contexto como limitado y documentaré las decisiones y resultados en ficheros.
- **Skills, extensiones y herramientas disponibles:** terminal PowerShell, Git, acceso de red a GitHub sujeto a autorización y el catálogo de skills de Codex. No preveo usar una skill especializada para T-005 ni para la escalera; si uso una, la anotaré expresamente.

## 2. Qué puedo y qué no puedo ejecutar en este entorno

| Capacidad | Estado al declarar | Límite o evidencia actual |
| --- | --- | --- |
| Terminal | Sí | He usado PowerShell y Git en esta sesión. |
| Acceso a GitHub | Sí, sujeto a autorización | He actualizado la rama autorizada desde `origin`. |
| Abrir PR | Por comprobar | Depende de que `gh` esté autenticado; aún no lo he verificado. |
| Ejecutar CI de GitHub | No directamente | Puedo desencadenarlo mediante un PR o push si las credenciales lo permiten; GitHub lo ejecuta, no yo. |
| Node 22 / `npm ci` | Por comprobar | No lo he ejecutado aún. |
| PostgreSQL 16 local | Por comprobar | No he detectado ni iniciado una instancia. |
| Docker | Por comprobar | No lo he ejecutado aún. |
| Navegador con Playwright / capturas | Por comprobar | No lo he ejecutado aún. |

## 3. Lo que mejor se me da (según yo)

1. **Desarrollo y revisión de TypeScript con pruebas.** Suelo poder traducir contratos detallados a implementaciones pequeñas, validar casos límite y no mutar entradas. En esta prueba lo demostraré con T-005 y los retos de la escalera.
2. **Análisis técnico y documentación verificable.** Puedo separar con precisión lo ejecutado, lo que solo puede validar el CI y lo pendiente. Esta autodeclaración ya evita afirmar capacidades no comprobadas.
3. **Automatización y Git.** Puedo crear cambios acotados, commits y PR en borrador cuando la autenticación lo permita. Ejemplo de esta sesión: creé una rama aislada desde la rama permitida, sin modificar la de origen.
4. **Accesibilidad y calidad de interfaces.** Puedo revisar semántica, teclado, contraste y flujos, aunque no debo cambiar el diseño del producto en esta prueba salvo que una ficha lo pida.

## 4. Lo que peor se me da o me da miedo

- No controlo la configuración interna del modelo, el contador real de tokens ni la disponibilidad de credenciales; los registraré como no expuestos y estimaré solo cuando sea necesario.
- Las comprobaciones que exigen PostgreSQL, navegador real o servicios locales pueden no ser ejecutables aquí. No las sustituiré por afirmaciones.
- Las tareas largas de varias capas pueden revelar convenciones del repositorio que debo leer en los documentos y la ficha autorizados, sin inspeccionar trabajo ajeno.
- No adjudico a la IA un diseño de identidad propio sin un briefing del fundador; el diseño visual está fuera del alcance actual.

## 5. Predicciones (para medir mi calibración)

- **Nota esperada (0–100):** especialidad 80; común máxima 78; común media no aplicable en esta sesión; revisión a ciegas 85.
- **T-005:** espero cubrir los criterios estáticos y unitarios que puedan ejecutarse localmente; no prometo las comprobaciones que dependan de servicios sin haberlos arrancado. Estimo que pasarán la mayoría de las pruebas si la ficha es suficientemente concreta.
- **T-003 en MEDIO:** se realizará en otra sesión y espero priorizar el manifiesto, instalación y pruebas esenciales antes que iteraciones visuales o de navegador.
- **Consumo previsto:** la interfaz no muestra tokens ni créditos. Estimo 60–120 minutos para esta sesión MÁXIMO y registraré el tiempo aproximado y las peticiones/herramientas visibles en `consumo.md`.
- **Parte 1 elegida:** una mejora de calidad/pruebas útil y acotada que identificaré tras leer las instrucciones permitidas necesarias para elegirla. La escogeré por impacto verificable, no por aspecto visual.

## 6. Compromisos

- [x] No leeré el trabajo de otros asistentes hasta entregar mi informe final.
- [x] No leeré la clave de la Parte 4.
- [x] No fusionaré ningún PR.
- [x] Diré siempre qué ejecuté y qué no.
