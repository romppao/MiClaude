# Textos legales de Lona

> **Borradores informados, no asesoramiento jurídico.** Los ha redactado Claude el 15-10-2026 y tiene que revisarlos un abogado antes del lanzamiento público (`LANZAMIENTO.md`, punto 5). El fundador tiene sus tareas, la investigación, el registro de tratamientos y los protocolos en la carpeta `MiProyectoAI/LEGAL-LONA/`, fuera del repositorio.

## Páginas

| Ruta | Archivo | Norma |
|---|---|---|
| `/aviso-legal` | `src/app/aviso-legal/page.tsx` | LSSI, art. 10 (identificación) y art. 16 (responsabilidad del alojador). Incluye el bloque de responsabilidad: contenido de usuarios, datos orientativos, veladas de terceros, riesgo deportivo, enlaces y disponibilidad |
| `/condiciones` | `src/app/condiciones/page.tsx` | DSA, arts. 14, 16, 17 y 20; LSSI. El ancla `#avisos` explica cómo avisar de contenido ilícito |
| `/privacidad` | `src/app/privacidad/page.tsx` | RGPD, art. 13: responsable, bases jurídicas, proveedores, transferencias, menores, plazos y derechos |
| `/cookies` | `src/app/cookies/page.tsx` | LSSI, art. 22.2. Solo hay cookies técnicas y de preferencia, así que **no hay banner** |

Enlazadas desde el pie (`layout.tsx`), el registro, «Continuar con Google» en `/entrar` y `sitemap.ts`.

## Datos del titular (variables de entorno, nunca en el código)
- `TITULAR_NOMBRE`
- `TITULAR_NIF`
- `TITULAR_DOMICILIO`
- `TITULAR_REGISTRO` (solo si es una sociedad)
- `CONTACT_EMAIL`

`RESPONSABLE_NOMBRE` se sigue aceptando como nombre. Si falta alguno fuera de la demo, `validateEnv` avisa al arrancar (`src/lib/common/titular.ts`). La fecha de revisión es `LEGAL_ACTUALIZADO`, en el mismo archivo.

## Mantenimiento: qué obliga a tocar estos textos
- **Una cookie o un uso de `localStorage`/`sessionStorage` nuevo:** tabla de `/cookies`. Si no es técnico, hará falta un banner de consentimiento.
- **Un proveedor nuevo que trate datos** (Sentry, por ejemplo): lista de `/privacidad`, el registro de tratamientos del fundador y su DPA.
- **Un dato personal nuevo o una finalidad nueva:** `/privacidad`.
- **Una función de moderación o una sanción nueva:** `/condiciones`, apartados 5 a 7.
- **Cualquier cambio de texto:** actualizar `LEGAL_ACTUALIZADO`. Si el cambio es importante, avisar a los usuarios.

## Hecho en la app (0.16.0, 15 de octubre de 2026)
- **Bloquear a un usuario** (Apple 1.2): desde su ficha, su comentario, su vídeo o foto, su propuesta o su solicitud de clase. Corta el contacto en los dos sentidos (retar, sparring, clases, seguir) y oculta a quien bloquea lo que publica la otra persona; cancela lo pendiente entre ellas. No se avisa a la bloqueada ni cambia nada para los demás. Se deshace en «Mi cuenta» → «Bloqueos». Código: `src/lib/community/bloqueos.ts`.
- **Correos de la decisión** (DSA, arts. 16.5 y 17): al cerrar un aviso, quien avisó recibe la decisión y la nota de moderación; si se retira algo (comentario, vídeo o foto, o el combate pasa a revisión), su autor recibe qué se ha hecho, el motivo, que lo ha decidido una persona y cómo reclamar (contacto del aviso legal, órgano extrajudicial o tribunales). Código: `notificarResolucionDeAviso` en `src/lib/community/notify.ts`. **La nota de moderación se envía tal cual**: escríbela pensando en que la leerán las dos personas.
- **Aviso sin cuenta** (DSA, art. 16): `/avisar`, enlazado al pie de todas las páginas y en `/condiciones#avisos`. Pide la dirección dentro de Lona, el motivo, la explicación, el nombre, el correo y la declaración de buena fe (los avisos de abuso de menores se pueden enviar sin identificarse). Acusa recibo por correo y entra en la cola de avisos de moderación. Límite: 5 avisos al día por dirección IP.

## Invitaciones a peleadores (0.23.0, 17 de octubre de 2026)
- **Quién puede escribir:** solo organizaciones con solicitud aprobada y entrenadores, con el correo verificado. Los aficionados no. 10 invitaciones al día como máximo, una pendiente por peleador y tipo, y 30 días de espera tras un rechazo.
- **Qué dato se comparte y cuándo:** ninguno hasta que el peleador **acepta**; entonces, solo el canal que él eligió (correo de la cuenta, teléfono o Instagram) y solo con quien invitó. Queda anotado en la invitación y en el registro de actividad. Rechazar no comparte nada.
- **Menores:** no se puede invitar a personas menores de 18 años ni a fichas sin titular. Hasta resolver T-014, la edad de la ficha es la que declara su titular.
- **Control del peleador:** puede cerrar las invitaciones, rechazar sin explicar y bloquear (el bloqueo cierra las pendientes y no se comunica a la otra persona).
- **Para el abogado:** contacto no solicitado entre cuentas, base jurídica del tratamiento del teléfono o Instagram compartidos y texto de `/privacidad` (finalidad «invitaciones»). Hasta entonces, solo en la demo.

## Logotipos de gimnasios (0.23.1, 17 de octubre de 2026)
- **Qué se muestra:** el logotipo del propio gimnasio, tomado de su página de inicio y solo para enseñar su ficha. No es una foto de personas ni de instalaciones.
- **De dónde sale:** de su web oficial (una petición a la página de inicio, con identificación y respetando `robots.txt`); nunca de Instagram ni de otras redes. Cada logotipo anota su origen en `docs/datos/gimnasios-logos.json`.
- **Control del gimnasio:** el que sube el propio gimnasio (al reclamar su ficha) sustituye siempre al hallado. Si un gimnasio pide retirarlo: se quita su fila del registro y su archivo de `public/gimnasios/logos/`.
- **Para el abogado:** uso de un logotipo ajeno (marca y derechos de autor) para identificar a su titular en un directorio, y si hace falta aviso previo o consentimiento antes de lanzar. Hasta entonces, solo en la demo.

## Denuncia de invitaciones y pausa del envío (0.25.0, 17 de octubre de 2026)
- **Quién denuncia:** solo el peleador que recibe la invitación. Al hacerlo, la invitación se cierra y no se comparte ningún contacto.
- **Pausa automática:** con denuncias abiertas de tres personas distintas sobre una misma cuenta, su envío de invitaciones queda en pausa y se retiran las pendientes hasta que lo revise moderación. No se comunica a quien envía quién denunció.
- **Decisión de moderación:** suspender el envío exige un motivo, que se comunica a la persona afectada por aviso y por correo, con cómo reclamar (mismo criterio que la retirada de contenido, DSA arts. 16 y 17). Moderación puede levantar la pausa con otro aviso. Todo queda en el registro de actividad.
- **Para el abogado:** si la pausa automática, sin revisión humana previa, es proporcionada; plazo en que moderación debe revisarla; y si hace falta un procedimiento de reclamación propio para cuentas pausadas.

## Acceso anticipado (0.26.0, 17 de octubre de 2026)
- **Qué se guarda:** los correos que moderación apunta en la lista de invitados (y una nota opcional para quien modera). Sirven solo para dejar crear cuenta a esas personas mientras Lona no está abierta a todo el mundo.
- **Quién lo ve:** solo moderación. En el registro de actividad queda cuántos correos se añadieron o se quitaron, nunca los correos.
- **Cuándo se borra:** se puede quitar a cualquiera de la lista en cualquier momento; al abrir Lona a todo el mundo conviene vaciarla.
- **Para el abogado:** base jurídica para guardar el correo de una persona invitada que todavía no ha creado su cuenta (interés legítimo de quien la invita, que se lo ha pedido), y si hay que avisarle al invitarla.


## Pendiente en la app (programación)
1. T-013, aviso al salir hacia enlaces externos: implementado en 0.17.1 (rama de Codex, pendiente de revisión e integración). Reglamentos, moderación y autoría del mapa anuncian la pestaña nueva; los vídeos externos lo avisan visiblemente y condiciones/privacidad explican la salida. `tests/e2e/enlaces.mjs` vigila el aviso y `rel` en las pantallas recorridas.
2. T-014, menores. El proyecto de ley de menores (121/000052), en tramitación, subiría la edad a 16 años y exigiría verificarla.
