# Rangos del equipo y registro de rendimiento

> **Aviso del fundador (6 de octubre de 2026): Open Code queda fuera del equipo.** Su modelo local (Ollama/Qwen) no es capaz de hacer la prueba de ingreso y se ha desinstalado. El equipo es: Claude (líder), Codex, Antigravity y GitHub Copilot. Donde este documento nombre a Open Code o al prefijo `opencode/`, ignóralo.

**Decisión del fundador (6 de octubre de 2026):** «quiero que tú, bajo tu criterio y resultados que te hayan dado en una primera toma de contacto las diferentes herramientas, designes el orden de rango […] las tareas más importantes las harán los que tengan un rango más alto». Reglas de decisión: [`decisiones/ADR-002-rangos-del-equipo.md`](decisiones/ADR-002-rangos-del-equipo.md). Reparto y flujo: [`EQUIPO.md`](EQUIPO.md).

## Orden vigente

| Rango | Quién | Papel | Nivel de tarea que puede recibir | Fundamento |
|---|---|---|---|---|
| **1** | **Claude** | Líder técnico: plan, arquitectura, métodos, fichas de tarea, revisión de todos los PR | N4 y todo lo demás | Decisión del fundador |
| **2** | **Codex** | **Ejecutor principal**: la mayor parte del código | N3 y por debajo | **Con evidencia** (ver registro): 9 PR propios integrados con CI en verde, documentación fiel y honesta, lo que afirma haber probado es cierto |
| **Sin ordenar** | Antigravity · GitHub Copilot · Open Code (Ollama / Qwen) | Ejecutores **en periodo de prueba** | N1 y N2 (tras la prueba de ingreso) | **Sin evidencia todavía.** Claude los ordenará (puestos 3, 4 y 5) cuando tenga una primera toma de contacto con el trabajo de cada uno; hasta entonces no hay jerarquía entre ellos |

**Decisión del fundador (6 de octubre de 2026, después):** «cuando ya tengas pruebas del trabajo de las otras herramientas, ya decidirás […] ahora todavía no hace falta». Por eso **no se ordenan los puestos 3–5 hasta tener resultados reales**. **El modelo que cada herramienta usa pesa más que la herramienta.** **Pendiente del fundador:** decir qué modelo ejecuta cada herramienta y si Codex dispone de PostgreSQL y navegador locales (hoy valida solo con el CI).

## Niveles de tarea

| Nivel | Qué es | Ejemplos (ver `PLAN.md`) | Quién |
|---|---|---|---|
| **N1** mecánica | Un fichero o configuración, sin lógica nueva ni datos | T-013 (T-002 ya hecha) | Cualquiera |
| **N2** acotada | Varios ficheros, lógica simple, con pruebas claras | T-003, T-007, T-009, T-010, T-012 | Rangos 2–4 (y 5 tras superar la prueba) |
| **N3** compleja | Base de datos, permisos, flujos de usuario, varias capas | T-004, T-005, T-006, T-008 (T-001 y T-011 ya hechas) | Rango 2 (y quien lo alcance por mérito) |
| **N4** crítica | Arquitectura, seguridad, privacidad, migraciones destructivas, reglas de aura/verificación | (no se delega) | Claude, con decisión del fundador cuando afecte a personas |

## Prueba de ingreso (para los puestos 3–5, y para subir de nivel)

**Protocolo completo y vigente: [`PRUEBA-DE-INGRESO.md`](PRUEBA-DE-INGRESO.md)** y su complemento objetivo [`PRUEBA-ESCALERA.md`](PRUEBA-ESCALERA.md) (retos con pruebas ocultas, trampas de honestidad y calibración) (autodeclaración, especialidad elegida por cada asistente, prueba común en modo máximo y en modo medio, y revisión a ciegas). Lo que sigue es el resumen inicial; si difiere, manda el protocolo completo.

1. **Prueba 1 (N1):** ejecutar **T-013** exactamente como está escrita (T-002 se hizo antes de que ningún aspirante la tomara). **Cada aspirante la hace en su propia rama (`<asistente>/T-013-prueba`) sin ver las de los demás**; Claude las compara con la misma tabla de puntuación y solo se integra una (la mejor); las demás se descartan sin penalizar: es una prueba, no trabajo útil duplicado. Se valora: ¿entiende y cumple la ficha?, ¿se ciñe al alcance?, ¿CI en verde?, ¿su informe dice la verdad sobre qué ejecutó y qué no?
2. **Prueba 2 (N2):** una parte acotada de **T-009** (dos personas nuevas de los escenarios, con informe visual) o **T-003**. Se valora además: ¿mira lo que produce?, ¿añade pruebas con esperas a estados visibles?
3. Cada PR recibe una **puntuación de 0 a 5** en cada criterio (abajo) en la revisión de Claude. Superar un nivel = en **tres PR seguidos** de ese nivel: media ≥ 4, ningún criterio con 0, como mucho una ronda de cambios por PR.

## Criterios de puntuación (cada PR)

| Criterio | Qué mide |
|---|---|
| **Cumplimiento de la ficha** | Hace lo pedido, ni más ni menos; pasos y criterios de aceptación |
| **Calidad técnica** | Correcto, sin regresiones, sigue la estructura y reglas del proyecto, seguro |
| **Pruebas** | Añade pruebas que fallan sin el cambio; no relaja ni salta ninguna |
| **Verdad del informe** | Lo que dice haber ejecutado y comprobado es cierto; separa «lo ejecuté» de «lo valida el CI» |
| **Autonomía y cuidado** | CI en verde a la primera, pocas rondas de revisión, mira capturas, avisa si la ficha no se puede cumplir |
| **Documentación** | Registro, diario, lecciones, mapa al día |

## Reglas de ascenso y descenso

- **Ascenso:** por la regla de «tres PR seguidos» del nivel; lo propone Claude con la tabla y lo confirma el fundador.
- **Descenso inmediato de nivel:** afirmar que algo pasa sin haberlo ejecutado (**verdad del informe = 0**), saltar o relajar una prueba para ponerla en verde, tocar datos o permisos fuera de la ficha, subir credenciales. Se anota en `LECCIONES.md`; se puede volver a subir por mérito.
- **Revisión proporcional:** Claude revisa **todos** los PR; los de rangos 3–5 y los de un nivel recién alcanzado se revisan línea a línea y con la batería completa; los de rango 2 en N3 se revisan por riesgo (datos, permisos, pruebas).
- **Reasignación por falta de disponibilidad:** si un asistente no puede ejecutar algo (sin PostgreSQL, sin créditos), la ficha pasa al siguiente rango que pueda, sin bajar de nivel mínimo.
- **El orden se revisa** cada vez que un asistente completa un PR (Claude actualiza este fichero) y siempre por decisión del fundador.

## Registro de rendimiento

| Fecha | Asistente | PR / trabajo | Cumpl. | Calidad | Pruebas | Verdad | Autonomía | Doc. | Notas de Claude |
|---|---|---|---|---|---|---|---|---|---|
| 2026-10-06 | **Codex** | 9 PR (#8–#16, 2–4 oct), revisados en conjunto | 4 | 4 | 4 | 5 | 3 | 5 | Todo lo que afirma haber ejecutado se verificó cierto (tipos, 406 unitarias, 16 guiones de navegador y axe en verde en mi ejecución con base vacía; CI en verde). Documentación muy buena y honesta (reconoce lo que no pudo ejecutar y los fallos intermitentes sin causa). Descuentos: cabecera de escritorio apilada y enlaces muertos sin detectar (sus pruebas miden accesibilidad, no «¿hace algo?» ni la maqueta), varias rondas de CI en rojo por selectores de pruebas (no ejecuta el navegador en local), instrucciones de `CLAUDE.md` contradictorias («diseño aplicado» y «implementación pendiente»), PR duplicada (#9) sin cerrar |
| — | Antigravity (sin ordenar) | sin trabajo en el repositorio | — | — | — | — | — | — | Pendiente de prueba de ingreso |
| — | GitHub Copilot (sin ordenar) | sin trabajo en el repositorio | — | — | — | — | — | — | Pendiente de prueba de ingreso |
| 2026-10-06 | Open Code | descartado por decisión del fundador (el modelo local no puede hacer la prueba) | — | — | — | — | — | — | Fuera del equipo |
