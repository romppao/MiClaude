# Consumo — CODEX

> La interfaz de Codex no expone en esta sesión un contador de tokens, créditos, coste, nombre exacto de variante ni un nivel numérico de razonamiento. Las cifras de tiempo son aproximadas y los tokens son una estimación, no una medición.

| Parte | Modo | Modelo y ajustes | Consumo visible | Estimación | Tiempo aproximado | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| 0 — Autodeclaración | MÁXIMO | Codex basado en GPT-5 según el entorno; esfuerzo interno no expuesto; terminal y herramientas habilitadas | No disponible | ~2.000–3.000 tokens de interacción | 10 min | Completada y confirmada en `412bc72`. |
| 1 — Especialidad | MÁXIMO | Mismo modelo y ajustes | No disponible | ~5.000–7.000 tokens de interacción | 25 min | Completada en `0ed3c49`. |
| 2 — T-005 | MÁXIMO | Mismo modelo y ajustes | No disponible | ~8.000–12.000 tokens de interacción | 50 min | Parcial, ampliada con listado público de peleadores e invalidaciones; detalle en `20-comun-maximo.md`. |
| 4 — revisión a ciegas | MÁXIMO | Mismo modelo y ajustes | No disponible | ~3.000–5.000 tokens de interacción | 20 min | Completada estáticamente en `40-revision-maximo.md`; no se ejecutó ni editó el cambio. |
| Escalera | MÁXIMO | Mismo modelo y ajustes | No disponible | 0 para implementación | 0 min | No iniciada: pendiente de una sesión que pueda completar sus pasos 0–3. |
| Modo MEDIO | MEDIO | No iniciado; requiere sesión separada | No disponible | 0 | 0 min | Pendiente por instrucción de la prueba. |

## Herramientas y ajustes usados

- PowerShell, Git, npm, Prisma, Vitest, TypeScript, Next.js y GitHub CLI.
- No usé skills especializadas, generación de imágenes ni herramientas de diseño.
- Instalé dependencias reproducibles con `npm ci` y generé Prisma antes de repetir el chequeo de tipos.

## Límites de esta contabilidad

- El rango de tokens estima la interacción necesaria para leer, razonar y ejecutar la parte; no es un contador del proveedor.
- El tiempo no incluye la espera de CI, que sigue siendo responsabilidad de GitHub y no se ha verificado por mí.
