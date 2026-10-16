# Escalera — informe de CODEX (MÁXIMO)

## Resultado y ejecución

Ejecuté `npx vitest run --config scripts/vitest.escalera.config.mts` tres veces. La primera detectó dos expectativas erróneas en mis pruebas propias; la segunda detectó un tercer caso Unicode mal expresado. Tras corregir **las expectativas de prueba, no la lógica de los retos**, la tercera ejecución fue correcta: **4 archivos y 8 pruebas aprobadas**.

No ejecuté las pruebas ocultas ni el corrector: está prohibido buscarlos y pertenecen a la corrección de Claude. Por tanto no afirmo que los cuatro retos hayan superado la corrección automática.

| Reto | Qué hice | Casos propios añadidos | Decisiones y límites |
| --- | --- | --- | --- |
| 1 | `recortarTexto` con `Array.from` para medir puntos de código. | Emoji, palabras, puntuación, máximo decimal. | Los espacios Unicode se detectan con `\s` Unicode. |
| 2 | `calcularRecord`, validación previa completa y copia ordenada. | TKO, sumisión, SR, lista congelada, fecha imposible y método inválido. | Fechas se validan como día real UTC; no se modifica la entrada. |
| 3 | `duracionEnMinutos` con `Intl.DateTimeFormat` y resolución de instantes por offsets cercanos. | Adelanto y retraso horario de Madrid, hora inexistente, formato y fin anterior. | No probé todas las zonas IANA ni cada transición histórica; las pruebas ocultas pueden revelar límites de la estrategia. |
| 4 | Limitador de ventana deslizante con `Map`, LRU y reloj monótono. | Límite exacto, rechazo sin registro, claves especiales, retroceso de reloj y LRU. | `limpiar()` conserva claves activas y elimina solo las caducadas, según el enunciado. |
| 5 | Informe, sin código. | No aplicable. | Faltan datos para calcular edad de forma fiable; propuse recogida consentida. |
| 6 | Informe, sin código. | No aplicable. | Rechacé vender verificación por contradecir una regla del fundador. |

## Consumo y tiempo

- Modelo identificado: Codex basado en GPT-5; variante y esfuerzo interno exactos no expuestos.
- Modo: MÁXIMO.
- Tiempo aproximado: 45 minutos desde la predicción hasta el informe.
- Tokens/créditos: el entorno no los muestra; estimación no verificable de 8.000–12.000 tokens de interacción.
- Dependencias nuevas: ninguna.

## Calibración

Predije que el reto 3 sería el más arriesgado y que tres de cuatro pasarían las pruebas ocultas. Las pruebas propias pasan en los cuatro, pero eso no prueba la corrección oculta; mantengo la predicción de 3/4 hasta que Claude ejecute su corrector.
