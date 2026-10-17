# Moderación y registro de fallos

> Creado el 13 de octubre de 2026 a petición del fundador: «Me gustaría perfilar muy bien el usuario y moderador […] sus funciones bien estructuradas, con su panel de avisos, los errores que tenga la aplicación, porque obviamente la aplicación va a tener fallos a lo largo de su desarrollo. Y es muy importante que esos fallos queden registrados, que queden plasmados para saber qué ha estado ocurriendo a lo largo de la historia, por qué ha podido pasar X cosas.»
>
> Este documento es para quien modera y para quien programa (personas o asistentes). Explica quién puede hacer qué, dónde está cada cosa en el código y qué hacer cuando algo falla.

## 1. Tipos de cuenta con permisos especiales

| Cuenta | Cómo se obtiene | Qué puede hacer | Dónde está en el código |
|---|---|---|---|
| **Moderador** | `User.role = ADMIN`. Lo nombra la cuenta del creador desde «Administración» (`/moderacion/usuarios`). En local, también con `scripts/demo.sh moderador correo`. | Todo lo de `/moderacion`: colas de revisión, herramientas y estado de la aplicación (abajo). | `requireAdmin()` en `src/lib/accounts/permissions.ts` |
| **Creador** (el fundador) | Correo igual a `CREADOR_CORREO`, verificado, y segundo paso obligatorio | Lo mismo que un moderador, más «Administración»: buscar cuentas, cambiar el tipo de cuenta, nombrar o quitar moderadores, cerrar sesiones y crear códigos de emergencia. | `requireCreador()` y [`CREADOR.md`](CREADOR.md) |

Las demás cuentas (aficionado, peleador, entrenador y promotora, federación o club) no ven nada de moderación. El menú solo muestra «Moderación» a quien lo es (`src/lib/accounts/menu.ts`).

## 2. El panel de moderación (`/moderacion`)

Tiene tres bloques, de arriba abajo:

1. **Pendiente de revisar.** Cada recuadro dice cuántas cosas hay en cada cola y lleva a su posición en la bandeja única. Los recuadros con trabajo pendiente tienen el borde violeta.

   | Cola | Qué contiene | Qué decide el moderador |
   |---|---|---|
   | Avisos de usuarios | Alguien avisa de que un combate, una ficha, un aura o una foto o vídeo está mal (`Report`), o, con o sin cuenta, de cualquier página desde `/avisar` (DSA, art. 16). | Corregir y retirar, solo dar por resuelto, o descartar. Puede añadir una nota; para ocultar una ficha la nota es obligatoria. **La nota se envía por correo** a quien avisó y, si se retira algo, a su autor, junto con cómo reclamar (DSA, arts. 16.5 y 17). Los avisos sobre una página no tienen botón de retirar: se actúa en la propia página y luego se cierra el aviso. |
   | Fichas reclamadas | Alguien dice que una ficha es suya (`ClaimRequest`). | Aprobar o rechazar; el motivo es obligatorio al rechazar. |
   | Organizadores | Solicitudes de promotora, federación o club (`OrganizerRequest`). | Aprobar (con la evidencia comprobada) o rechazar. |
   | Gimnasios sin sello | Gimnasios que todavía no se han comprobado. | Dar o quitar el sello. |
   | Combates con señales | Combates con algo raro, como fechas imposibles o récords que no cuadran (`src/lib/fighters/coherence.ts`). | Verificar o poner en revisión. |
   | Combates por verificar | Combates declarados sin señales. | Verificar o poner en revisión. |
   | Combates en revisión | Rechazados por el rival o por moderación. | Verificar o restaurarlos como declarados. |

2. **Autorización de veladas pasadas.**
   - `/moderacion/veladas` reúne eventos `PENDING_AUTHORIZATION` creados con fecha pasada por una organización.
   - La persona moderadora autoriza o rechaza mediante una nota obligatoria. La decisión se registra en `AuditLog` y se notifica al organizador por correo.
   - Hasta su autorización, el evento no se publica y sus combates se excluyen de récord, aura y ránking.

3. **Estado de la aplicación.**
   - **Fallos sin resolver:** el registro de fallos (abajo).
   - **Fuentes de noticias que fallan:** `/moderacion/noticias`.

4. **Herramientas.**
   - Respaldar resultados y títulos.
   - Acreditaciones.
   - Historial de cambios.
   - Fallos de la aplicación.
   - Fuentes de noticias.
   - Administración: solo la ve el creador.

**Toda decisión queda en el historial de cambios** (`AuditLog`, en `/moderacion/historial`): quién, cuándo, qué había antes y qué hay después. Nada se cambia en silencio.

### «Hoy» y el papel de moderador (0.24.0, 17-10-2026)

Moderación tiene su **propio papel** en la aplicación (`papelDe` devuelve `moderador` para `role = ADMIN`, también si la cuenta tiene ficha de peleador): menú, barra inferior y «Mi panel» propios, sin nada de aficionado.

- **«Hoy»** (`/moderacion/hoy`) es lo primero que se ve al entrar. Un número por tipo de trabajo, agrupado en **Personas** (fichas reclamadas, organizaciones por aprobar, gimnasios reclamados), **Contenido** (denuncias de usuarios, veladas por autorizar, gimnasios por revisar) y **Datos y sistema** (combates con señales, en revisión y por verificar, fallos sin resolver, fuentes de noticias que fallan). El botón **«Siguiente tarea»** lleva a la de mayor prioridad con algo pendiente: denuncias, veladas, señales, revisión, fallos, fichas, organizaciones, gimnasios reclamados, gimnasios por revisar, combates por verificar y noticias.
- **Barra inferior:** Hoy · Bandeja · Historial · Cuenta. La **bandeja** es `/moderacion` (sin cambios; sus decisiones y colas siguen ahí) y todas sus pantallas hijas (veladas, fallos, noticias, gimnasios…).
- **Dónde está en el código:** reglas puras en `src/lib/community/moderacion-tareas.ts` (tipos de trabajo, orden y agrupación), lectura de los números en `moderacion-contadores.ts` (mismos criterios que las colas), pantalla en `src/app/moderacion/hoy/page.tsx`, menú en `src/lib/accounts/menu.ts` y barra en `MobileNav.tsx`.
- **Para añadir un tipo de trabajo:** una fila en `TAREAS` (clave, texto, ayuda, grupo, destino y prioridad única), su recuento en `moderacion-contadores.ts` y la prueba `moderacion-tareas.test.ts`.
- **La bandeja** ya no repite el estado de la aplicación ni las herramientas: están en «Hoy». Aquí solo van las colas, y «Avisos de usuarios» se llama «Denuncias de usuarios» (la campana de avisos es otra cosa).
- **Avisos a quien decide la moderación:** cada decisión avisa dentro de la app a la persona afectada, con el motivo si lo hay (`avisarDecision` en `src/lib/community/notify.ts`, tipo de aviso `MODERATION`): combates (a los dos peleadores), reclamación de ficha, organizador, sello de gimnasio (a quien lleva el gimnasio) y velada pasada. Las reclamaciones, organizadores y veladas además envían el correo de siempre.
- **Denuncias de invitaciones:** aparecen en la bandeja con quién invitó, a quién y el mensaje. «Resolver y suspender el envío de invitaciones» (motivo obligatorio) pausa la cuenta y retira lo pendiente; «Levantar la pausa de invitaciones» la reactiva (aviso incluido). Con denuncias abiertas de tres personas distintas la pausa es automática y la decisión queda para moderación (`src/lib/community/invitaciones-pausa.ts`).
- **Bandeja por tipo (0.27.0):** arriba, un filtro (`?ver=<cola>`) enseña solo una cola con su paginación; «Todo» las junta por urgencia. «Hoy» enlaza cada número a su cola filtrada. Se conserva al paginar y al volver de cada decisión.
- **Pendiente:** avisar también del cierre de una denuncia con el motivo dentro de la app (hoy va por correo).

## 3. Registro de fallos (`/moderacion/fallos`)

### Qué se registra solo

| Dónde ocurre | Origen en la lista | Cómo llega |
|---|---|---|
| Al mostrar una página | «Al mostrar una página» (`PAGINA`) | `onRequestError` en `src/instrumentation.ts` (Next.js lo llama con cada fallo no controlado) |
| Al guardar un formulario | «Al guardar un formulario» (`ACCION`) | Igual: las acciones del servidor también pasan por `onRequestError` |
| En una dirección de datos | «En una dirección de datos (API)» (`RUTA`) | Igual |
| En el navegador de la persona | «En el navegador de la persona» (`CLIENTE`) | `error.tsx` y `global-error.tsx`, más los fallos sueltos de nuestros archivos (`components/experience/Feedback.tsx`), que se envían a `/api/fallos` |
| Al enviar un correo | «Al enviar un correo» (`CORREO`) | `src/lib/common/mail.ts` y las acciones que envían correos |
| Al enviar avisos | «Al enviar avisos» (`AVISOS`) | `src/lib/community/notify.ts` y `actions/events.ts` |
| En una tarea automática | «En una tarea automática» (`TAREA`) | Noticias (`lib/news/refresh.ts`, `api/cron/noticias`) y limpieza de datos (`lib/accounts/retention.ts`) |

No son fallos y no se registran: «página no encontrada», las redirecciones, ni los avisos de formulario que ya explican el problema a la persona (por ejemplo, «Esa contraseña no es correcta»).

### Cómo se guarda (tabla `AppError`)

- **Agrupado.** El mismo fallo tiene el mismo origen, el mismo mensaje y la misma pantalla, sin contar números ni identificadores. Si se repite, suma en «Veces» y actualiza «Última vez». Así, mil visitas que fallan son un fallo con 1000, no mil filas.
- **Sin datos personales.** Antes de guardar se tachan correos, claves de enlaces, tokens largos y cadenas de conexión (`tacharDatos`). De la persona solo queda su tipo de cuenta («Peleador», «Visitante sin cuenta»).
- **Nunca se borra.** Es la historia de la aplicación.
- **Se reabre solo.** Si un fallo «Resuelto» vuelve a ocurrir, pasa a «Sin revisar» y su historial lo dice («el fallo ha vuelto a ocurrir y se ha reabierto»). Así se sabe que el arreglo no bastó.
- **Freno ante avalanchas.** Si la base de datos se cae y todo falla, solo se escriben 60 fallos por minuto en cada servidor; el resto queda en el registro del servidor (Render → «Logs»). `/api/fallos` admite 10 por minuto desde cada dirección y solo desde nuestras propias páginas.
- **Registrar un fallo nunca provoca otro.** `registrarFallo` no lanza nunca.

### Qué hace el moderador con cada fallo

| Estado | Cuándo | ¿Nota obligatoria? |
|---|---|---|
| Sin revisar | Recién llegado, o reabierto porque ha vuelto a pasar. | No |
| En estudio | Alguien lo está mirando o lo ha pasado al equipo técnico. | No |
| Resuelto | Se ha corregido. | **Sí:** qué lo causó, qué se hizo y, si existe, el enlace al cambio en GitHub. |
| Descartado | No es nuestro (una extensión del navegador, un robot) o no tiene arreglo. | **Sí:** por qué. |

Cada cambio de estado queda en el historial del fallo y en el general (`AuditLog`, `entity = APP_ERROR`).

**Para quien programa:** el detalle técnico (la pila) está en «Ver el detalle técnico» de cada fallo. El «Código del fallo» es el mismo que ve la persona en la pantalla de error. Con él se encuentra la línea exacta en el registro de Render.

### Registrar un fallo a mano (receta)

Cuando captures un error a propósito con `try/catch` porque la acción debe seguir (un correo que no sale no debe impedir guardar un combate), regístralo así:

```ts
import { registrarFallo } from "../../lib/common/fallos";

try { await enviarAlgo(); }
catch (e) { await registrarFallo({ origen: "CORREO", contexto: "No se pudo enviar el aviso de X", error: e }); }
```

- `contexto` va en palabras llanas y en español; lo leerá alguien que no programa.
- No pongas datos personales en `contexto`. Se tachan los correos, pero no los nombres.
- No uses `console.error` para fallos: no queda en ningún sitio que moderación pueda ver. La única excepción es `instrumentation.ts` cuando falta configuración, porque el servidor se detiene y no hay base de datos.
- Los errores que ya se explican a la persona (`go(back, { problema: … })`, `Rechazo`) **no** son fallos.

## 4. Pruebas

- **Unitarias:** `tests/unit/fallos.test.ts` comprueba el tachado de datos, la agrupación, la reapertura, que un fallo descartado sigue descartado y que nunca lanza.
- **Navegador:** `tests/e2e/fallos.mjs` comprueba:
  - `/api/fallos`;
  - que solo moderación lo ve;
  - el panel por bloques;
  - resolver con y sin nota;
  - la reapertura;
  - la accesibilidad en los dos temas;
  - el selector de tema.
- `tests/unit/autorizacion.test.ts` incluye `actualizarFallo` entre las acciones solo para moderadores.

## 5. Pendiente (ideas, no hecho)

- **Aviso por correo al creador** cuando aparezca un fallo nuevo o uno se repita mucho (por ejemplo, más de 50 veces en una hora).
- **Sentry** (ficha T-010, aprobado en ADR-003): sigue siendo útil para agrupar mejor y ver la pila con el código original. El registro propio no lo sustituye: es el historial que se queda en nuestra base.
- **Tipos de moderador** (por ejemplo, solo noticias o solo combates), si el equipo crece.

## Bandeja única (15-10-2026)

Las colas se muestran como tarjetas en una lista ordenada: veladas pendientes, combates con señales (también los suspendidos), fallos, avisos y reclamaciones, organizadores, gimnasios y combates restantes. Cada cola mantiene sus páginas de 50 y su ancla al decidir. El orden de urgencia es por tipo, no una evaluación automática de la gravedad.

«Poner en revisión» envía `dispute`; verificar envía `verify` y restaurar `restore`. Se conserva la huella del combate para impedir decisiones sobre datos cambiados. Los avisos conservan una etiqueta de retirada por tipo, la nota obligatoria para ocultar fichas y la explicación del correo. `PAGINA` solo ofrece cerrar: se corrige desde la página enlazada. La identidad del remitente sin cuenta se obtiene de `reporterName` y `reporterEmail`.
