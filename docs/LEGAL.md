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

## Pendiente en la app (programación)
1. Bloquear a un usuario (Apple 1.2).
2. Avisar por correo a quien denuncia y al afectado, con los motivos (DSA, arts. 16.5 y 17). Hoy se hace a mano.
3. Formulario de aviso sin cuenta. Hoy la vía es el correo de contacto.
4. T-013, aviso al salir hacia enlaces externos.
5. T-014, menores. El proyecto de ley de menores (121/000052), en tramitación, subiría la edad a 16 años y exigiría verificarla.
