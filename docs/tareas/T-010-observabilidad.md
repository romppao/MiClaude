# T-010 — Observabilidad: registros, errores y salud
**Nivel:** N2 (ver [`../RANGOS.md`](../RANGOS.md): quién puede tomarla)  
**Fase:** F2 · **Estado:** lista (registros y salud) / errores **propuestos en [ADR-003](../decisiones/ADR-003-proveedores-fase-0.md): Sentry gratis (región UE) con filtro de datos personales + UptimeRobot sobre `/salud`** · **Sugerida a:** Copilot o Antigravity · **Depende de:** —

## Objetivo
Enterarnos de los fallos **antes que los usuarios** y poder diagnosticarlos: registros estructurados, identificador por petición, captura de errores del servidor y una comprobación de salud útil.

## Contexto
Hoy: `console.*` suelto; `src/app/error.tsx` y `global-error.tsx` (pantallas); `src/instrumentation.ts` (comprobación de entorno al arrancar); `src/app/salud/route.ts` (`SELECT 1`); `src/middleware.ts` (limpia parámetros).

## Pasos
1. Rama `<asistente>/T-010-observabilidad`.
2. `src/lib/common/log.ts`: `log.info/warn/error(evento, datos)` que escribe **una línea JSON** (`nivel`, `evento`, `ts`, `peticion`, datos) sin datos personales (nunca correos, contraseñas ni tokens; lista de claves prohibidas con prueba).
3. `src/middleware.ts`: añade `x-request-id` (genera uno si no viene) a la respuesta y propágalo a las acciones (cabecera).
4. `src/instrumentation.ts`: exporta `onRequestError` (Next 15) que registra errores del servidor con ruta, método, `digest` y la petición. Mantén el comportamiento actual de `process.exit(1)` por entorno inválido.
5. Hook opcional de envío a un servicio de errores: `src/lib/common/errores.ts` con `notificarError(error, contexto)`; si existe `SENTRY_DSN` (o el servicio que el fundador elija; **no añadas dependencia nueva sin su OK**) lo envía; si no, solo registra. Deja el punto de extensión y la prueba con un destino falso.
6. `/salud`: añade `version` (commit desde `RENDER_GIT_COMMIT` o `GITHUB_SHA` o «desconocida»), `baseDeDatosMs` (latencia del `SELECT 1`), y cola de correos si existe (T-008). Mantén 200/503 y `no-store`. `/salud?profundo=1` **solo con `Authorization: Bearer ${CRON_SECRET}`** hace comprobaciones más caras (conteo de sesiones activas, migración aplicada) sin exponer datos.
7. Documenta en `docs/OPERACION.md`: qué mirar cuando algo falla, formato de registros, cómo buscar por `peticion`, alertas recomendadas (tasa de errores 5xx, latencia p95, `/salud` 503, cola de correos creciente, espacio de la base).
8. Pruebas unitarias (formato, claves prohibidas) y `tests/e2e` de `/salud` y de que una petición lleva `x-request-id`. Batería completa con base vacía.

## Criterios de aceptación
- Un error 500 provocado a propósito en una prueba deja una línea JSON con `peticion` y sin datos personales.
- `/salud` informa versión y latencia; `profundo` protegido.

## No hacer
No registrar cuerpos de petición. No añadir servicios de pago ni dependencias pesadas sin RFC.

## Documentar
`docs/OPERACION.md` (nuevo), `ARQUITECTURA.md`, `PLAN.md`, `DIARIO.md`, tu registro.
