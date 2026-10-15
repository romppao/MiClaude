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

## Pendiente en la app (programación)
1. T-013, aviso al salir hacia enlaces externos: implementado en 0.16.1 (rama de Codex, pendiente de revisión e integración). Reglamentos y moderación anuncian la pestaña nueva; los vídeos externos lo avisan visiblemente y condiciones/privacidad explican la salida. `tests/e2e/enlaces.mjs` vigila el aviso y `rel` en las pantallas recorridas.
2. T-014, menores. El proyecto de ley de menores (121/000052), en tramitación, subiría la edad a 16 años y exigiría verificarla.
