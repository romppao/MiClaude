# Funciones aprobadas de Lona: lo que no se puede romper

> **Para qué sirve (petición del fundador, 16-10-2026):** «Es muy importante usar algún framework para evitar romper cosas que ya funcionaban o ya habíamos aprobado al hacer una actualización.» Esta página es el registro de lo aprobado. **Cada fila apunta a la prueba que lo vigila**, y la prueba `tests/documentacion/aprobado.test.mjs` falla si la prueba citada desaparece o si ya no contiene esa comprobación (por ejemplo, porque alguien la borró o la reescribió «para que pase»).
>
> **Reglas:**
> 1. Una función aprobada por el fundador se apunta aquí **en el mismo PR** que la crea. Sin fila, no cuenta como aprobada.
> 2. **Cambiar o quitar una fila exige la aprobación expresa del fundador**, y el PR lo dice («cambio aprobado el AAAA-MM-DD»). Un asistente no puede quitar una comprobación porque le estorbe.
> 3. Si una actualización hace fallar una de estas pruebas, **se corrige la actualización, no la prueba**, salvo que el fundador haya aprobado el cambio de comportamiento.
> 4. La columna «Se comprueba en» lleva el archivo entre comillas invertidas y, tras `—`, el texto exacto de la comprobación entre «».

| ID | Función aprobada | Se comprueba en |
|---|---|---|
| APR-001 | El récord amateur de un peleador es privado hasta que él lo publica: el visitante ve el número de combates, no el resultado. | `tests/e2e/respaldo.mjs` — «antes de publicarlo, el visitante ve el número de combates amateur y no el resultado» |
| APR-002 | Un combate autodeclarado no cuenta en el récord propio hasta pasadas 24 horas, y mientras tanto la ficha enseña cuándo empezará a contar. | `tests/e2e/record-24h.mjs` — «la declaración reciente no suma todavía en el récord propio» |
| APR-003 | Al cumplir las 24 horas el combate se incorpora al récord y deja de mostrar la cuenta atrás. | `tests/e2e/record-24h.mjs` — «al incorporarse al récord deja de mostrar la cuenta atrás» |
| APR-004 | Las veladas ya pasadas necesitan la autorización de un moderador; mientras no la tienen, el público recibe un 404. | `tests/e2e/veladas-pasadas.mjs` — «una velada pendiente da 404 al público» |
| APR-005 | Quien crea una velada pasada recibe antes el aviso de que requiere autorización. | `tests/e2e/veladas-pasadas.mjs` — «antes de crear, se advierte que las veladas pasadas requieren autorización» |
| APR-006 | Se puede entrar con Google, pidiendo solo nombre y correo. | `tests/e2e/google.mjs` — «con el cliente, la vuelta a Lona y solo nombre y correo» |
| APR-007 | Reclamar un gimnasio no da la propiedad hasta que un moderador lo revisa; al aprobar, la ficha queda protegida frente a importaciones. | `tests/e2e/gimnasios-reales.mjs` — «la reclamación no asigna propiedad antes de revisión» |
| APR-008 | Los datos profesionales de un gimnasio editados por su dueño se publican y se conserva la atribución de OpenStreetMap (ODbL). | `tests/e2e/gimnasios-reales.mjs` — «el dato profesional editado se publica y se conserva la atribución ODbL» |
| APR-009 | Quien recibe una propuesta de combate puede bloquear a quien la envía; la propuesta pendiente se rechaza y el bloqueo queda en el historial. | `tests/e2e/bloqueos.mjs` — «al bloquear, la propuesta pendiente queda rechazada» |
| APR-010 | Los organizadores ofrecen plazas por categoría de peso y la página pública las enseña con cuántas están cubiertas. | `tests/e2e/plazas.mjs` — «la página pública enseña las categorías que busca el organizador y las plazas» |
| APR-011 | Una velada pendiente de autorizar no se puede abrir a inscripciones. | `tests/e2e/veladas-pasadas.mjs` — «la inscripción de una velada pendiente no se puede abrir» |
| APR-012 | La cola de correo reintenta a 1 min, 5 min, 30 min, 2 h y 12 h, y los correos de la cuenta tienen reservado el final del cupo diario. | `tests/unit/cola-correo.test.ts` — «los correos de la cuenta tienen reservado el final del cupo» |
| APR-013 | Los límites de frecuencia leen la dirección que añadió el proxy de confianza, no la que escribe el cliente. | `tests/unit/ratelimit.test.ts` — «toma la que añadió el proxy de confianza (la última), no la que escribe el propio cliente (la primera)» |
| APR-014 | La accesibilidad se mide con las reglas WCAG 2.2 AA en el navegador real. | `tests/e2e/accesibilidad.mjs` — «wcag22aa» |
| APR-015 | La app se llama Lona: «Ring España» no aparece en ningún texto del código (14-10-2026). | `tests/unit/nombre-lona.test.ts` — «Ring España» |
