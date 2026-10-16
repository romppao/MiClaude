# Revisión de textos de la fase 1 (entradas y carteles de veladas)

- **Fecha:** 15-10-2026.
- **De:** Antigravity.
- **Para:** Claude Code / Fundador.
- **Referencia:** `2026-10-15-claude-encargo-antigravity-tareas-sencillas.md` (Tarea 2).
- **Rama analizada:** `origin/claude-code/veladas-entradas` (PR #93).
- **Alcance:** Solo lectura y auditoría de textos visibles para la persona usuaria. Sin modificaciones en código ni ramas.

---

## Cómo se ha realizado la revisión

Para realizar esta revisión exhaustiva sin alterar el código ni crear ramas, he inspeccionado directamente la rama `origin/claude-code/veladas-entradas` mediante comandos `git show` y `git diff` sobre los 7 archivos indicados por Claude. He extraído exclusivamente los textos legibles por personas (mensajes, avisos, títulos, descripciones y ayudas de formulario), contrastándolos de forma rigurosa contra las reglas de reserva oficiales (señal del 50 % por Bizum, código `LONA-XXXXXX`, plazo de 24 h / límite de 3 h antes, 1 a 6 entradas, Lona no toca el dinero), la ortografía y puntuación de la RAE, el tuteo peninsular y la erradicación del nombre antiguo «Ring España».

---

## Resumen de la auditoría

1. **Nombre de la app:** Impecable. No existe ninguna mención a «Ring España» en los textos para la persona usuaria; todas las referencias emplean consistentemente la marca **Lona**.
2. **Formato de importes:** Correcto y coherente en todas las pantallas (`{precio} €`, `12 €`, etc.), con espacio antes del símbolo de moneda.
3. **Reglas de reserva y flujo de dinero:** El diseño conceptual de Claude es muy sólido y transparente. Se han identificado pequeñas oportunidades de mejora en la pantalla previa a la reserva para explicitar con exactitud las «3 horas antes del inicio» (en lugar de una frase vaga como «si la velada está muy cerca») y recordar el prefijo del código `LONA-XXXXXX` y que Lona no toca el dinero.
4. **Español peninsular y estilo:** Tuteo respetado de manera casi universal. Se corrigen un par de fórmulas impersonales/leístas y el régimen preposicional de «disfrutar de la velada».

---

## Tabla de propuestas de corrección

Ordenada por gravedad: primero coherencia de reglas/dinero, luego ortografía/puntuación y finalmente estilo y naturalidad en español de España.

| Archivo y línea | Texto actual | Problema | Propuesta |
|---|---|---|---|
| `src/app/components/ReservaEntradas.tsx:22` | `Después verás el número de Bizum de la promotora y tu código para el concepto. Tienes hasta 24 horas para enviar la señal (menos si la velada está muy cerca); si no llega, la reserva caduca. La promotora verá tu nombre y tu correo.` | **Regla / Dinero:** La expresión «(menos si la velada está muy cerca)» es imprecisa. La regla estricta fijada por el fundador es «nunca más tarde de 3 horas antes del inicio». Además, conviene citar el formato del concepto (`LONA-XXXXXX`), que el resto se paga en la puerta y recordar la invariante: «Lona no toca el dinero». | `Después verás el número de Bizum de la promotora y tu código (LONA-XXXXXX) para el concepto. Tienes 24 horas para enviar la señal (o hasta 3 horas antes del inicio si la velada es antes); si no llega, la reserva caduca. El resto se paga en la puerta. Lona no toca el dinero.` |
| `src/app/veladas/[slug]/page.tsx:125` | `... Reservas hasta el {cierreDeReservas(e.date, e.startMinute).toLocaleString("es-ES", { timeZone: "Europe/Madrid", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}.` | **Precisión de lectura:** En español peninsular, `toLocaleString` con día, mes y hora genera «16 de octubre, 17:00». Al ir precedido de «hasta el», queda «hasta el 16 de octubre, 17:00». Es más natural intercalar «a las». | Separar fecha y hora o redactar: `Reservas hasta el {fecha} a las {hora}.` |
| `src/lib/common/messages.ts:8` | `entradas_validadas: "Entrada validada. Ya puede pasar."` | **Tratamiento / Plural:** «Ya puede pasar» emplea tratamiento de cortesía («usted») que choca con el tuteo general de Lona. Además, una reserva puede ser de varias entradas (hasta 6), por lo que el singular desentona en accesos grupales. | `entradas_validadas: "Entrada validada. Ya pueden pasar."` (o de forma neutra y directa: `"Entrada validada correctamente."`) |
| `src/lib/common/messages.ts:7` | `entradas_senal_confirmada: "Señal recibida: la reserva está confirmada y se le ha avisado."` | **Claridad / Leísmo:** «se le ha avisado» resulta impersonal y con dativo superfluo en tercera persona. Lo lee la promotora tras pulsar el botón. Es más natural y claro decir a quién se ha avisado. | `entradas_senal_confirmada: "Señal recibida: la reserva está confirmada y se ha avisado a quien reservó."` |
| `src/lib/common/messages.ts:10` | `entradas_canceladas_promotora: "Reserva cancelada. Se le ha avisado a quien reservó."` | **Gramática:** Redundancia de pronombre («Se le ha avisado a quien reservó»). En español peninsular normativo para complemento directo de persona se prefiere pasiva refleja sin «le» o voz activa. | `entradas_canceladas_promotora: "Reserva cancelada. Se ha avisado a quien reservó."` |
| `src/lib/common/messages.ts:143` | `entradas_incompletas: "Para abrir la venta pon el precio de la entrada y tu número de Bizum."` | **Puntuación:** Falta la coma tras la proposición subordinada final antepuesta. | `entradas_incompletas: "Para abrir la venta, pon el precio de la entrada y tu número de Bizum."` |
| `src/app/organizador/[slug]/page.tsx:122` | `... Pon precio y Bizum y abre la venta para que el público reserve desde la página de la velada.` | **Puntuación y fluidez:** Repetición de la conjunción «y» («Bizum y abre») sin pausa de lectura. Conviene separar la condición previa de la acción de apertura. | `Pon precio y Bizum, y abre la venta para que el público reserve desde la página de la velada.` |
| `src/app/mis-entradas/page.tsx:56` | `Entrada validada en la puerta. ¡Que disfrutes la velada!` | **Español de España:** En la norma peninsular, el verbo disfrutar rige tradicionalmente la preposición «de» («disfrutar de la velada»). La omisión de la preposición es un calco del inglés (*enjoy the event*) o uso de otras latitudes. | `Entrada validada en la puerta. ¡Que disfrutes de la velada!` |
| `src/app/actions/entradas.ts:117` | `Han cancelado una reserva (${r.code}) de ${r.event.name}` | **Estilo:** Para eventos deportivos y veladas es más idomático indicar el destino («para la velada X») que una relación de posesión («de X»). | `Han cancelado una reserva (${r.code}) para ${r.event.name}` |

---

## Estado y siguientes pasos

- **Tarea 1 (Ajustes de móvil 375 px):** Completada, validada al 100% (848 tests unitarios pasando, TypeScript sin errores, catálogo y mapa regenerados) y comprometida en el commit local `835d815` en la rama `antigravity/ajustes-movil`.
- **Tarea 2 (Revisión de textos fase 1):** Completada en este informe. Conforme a las instrucciones, **no se ha modificado ningún archivo**; queda a disposición de Claude Code para que aplique los cambios que considere oportunos.
- **Tarea 3 (Recorrido visual móvil de entradas):** En espera. No se iniciará hasta que el fundador confirme que el PR #93 está fusionado y desplegado en la demo.
