# T-008 — Cola de correos (outbox)
**Fase:** F2 · **Estado:** lista (cola y reintentos) / bloqueada (envío real: proveedor de correo, decisión del fundador) · **Sugerida a:** Codex · **Depende de:** —

## Objetivo
Que enviar un correo nunca ralentice ni haga fallar una petición, y que un fallo del proveedor no pierda avisos: los correos se guardan en una cola y un proceso aparte los envía con reintentos.

## Contexto
`src/lib/common/mail.ts` (`sendMail`, transportes `log` y Resend). Se llama desde `src/app/actions/accounts.ts` (verificación, recuperación), `src/lib/community/notify.ts` (avisos de combates, decisiones, respuesta del rival; se invoca con `after()`), `src/lib/accounts/auth.ts`. Hoy cada llamada envía en el momento.

## Pasos
1. Rama `<asistente>/T-008-cola-correo`.
2. Migración **aditiva** `EmailOutbox`: `id`, `to`, `subject`, `body`, `kind`, `dedupeKey String? @unique`, `status` (`PENDING|SENT|FAILED`), `attempts Int`, `nextAttemptAt DateTime`, `lastError String?`, `createdAt`, `sentAt`. Índice `[status, nextAttemptAt]`.
3. `src/lib/common/outbox.ts`: `enqueueMail({ to, subject, body, kind, dedupeKey })` (guarda y vuelve) y `processOutbox(limit = 20)` (toma `PENDING` con `nextAttemptAt <= now` usando `FOR UPDATE SKIP LOCKED` para que dos procesos no envíen el mismo; envía con el transporte actual; en éxito `SENT`; en error `attempts+1`, espera exponencial 1 min → 5 → 30 → 2 h → 12 h y `FAILED` tras 6 intentos).
4. Sustituye las llamadas a `sendMail` de las acciones y de `notify.ts` por `enqueueMail`. Los correos de **verificación y recuperación** se intentan además enviar inmediatamente en el `after()` (para que la persona no espere el siguiente ciclo), pero siempre pasan por la cola (si falla, queda para reintento). `dedupeKey` evita duplicados (p. ej. `verif:<userId>:<tokenId>`).
5. Proceso: ruta `src/app/api/cola-correo/route.ts` (`POST`) protegida con cabecera `Authorization: Bearer ${CRON_SECRET}` (sin la variable, responde 404), que llama a `processOutbox`. Añade `CRON_SECRET` a `.env.example` y `src/lib/common/env.ts` (advertencia en producción). En local/demo con transporte `log`: `after()` también procesa.
6. Pantalla de moderación **no** (fuera de alcance). Sí: contador de pendientes/fallidos en `/salud` (solo número, sin direcciones).
7. Pruebas: unitarias (reintentos, dedupe, bloqueo `SKIP LOCKED` con dos llamadas simultáneas, ruta sin secreto → 404); `tests/e2e` existentes siguen en verde (leen el correo del log: comprueba que el log sigue recibiendo los correos).
8. `npm run typecheck && npm test && npm run build` y batería completa con base vacía.

## Criterios de aceptación
- Ningún flujo envía correo dentro de la petición salvo el intento rápido en `after()`; ninguna pérdida si el proveedor falla (reintento visible en la tabla).
- Dos procesos a la vez no duplican envíos.
- Retención: filas `SENT` de más de 30 días se borran en la limpieza que ya existe (`src/lib/accounts/retention.ts`).

## No hacer
No cambiar textos de correos. No elegir proveedor ni subir claves.

## Documentar
`ARQUITECTURA.md`, `.env.example`, `README`, `DIARIO.md`, `LECCIONES.md`, tu registro.
