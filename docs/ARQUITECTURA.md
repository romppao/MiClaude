# Arquitectura de Ring España

## Propósito y enfoque

Fomentar la afición al boxeo en España **empezando por el amateur** y por **Madrid**.
El boxeador amateur gestiona su ficha y su récord; el público valora lo que ve; el calendario descubre veladas.
Cada decisión técnica se toma para que esto escale a otras provincias sin rehacer nada.

Diseño gráfico: aplazado a propósito. La UI actual es funcional y provisional.

## Stack

Next.js 15 (App Router, Server Components + Server Actions) · TypeScript · PostgreSQL · Prisma.
Sin API REST separada en el MVP: las páginas leen de la base de datos en el servidor y los formularios llaman a Server Actions (`src/app/actions.ts`). Si más adelante hace falta app móvil o API pública, se extrae una capa de servicios desde `actions.ts` y `src/lib`.

## Actores y roles

| Rol | Puede |
|---|---|
| Visitante | Navegar, buscar, ver fichas, veladas y ránking |
| `FAN` | Lo anterior + valorar boxeadores |
| `BOXER` | Lo anterior + una ficha propia y registrar sus combates |
| `ORGANIZER` | (Fase siguiente) Publicar veladas y carteles oficiales |
| `ADMIN` | Verificar o rechazar combates (`/admin`). Se asigna manualmente en la base de datos |

Un boxeador sin cuenta también existe (fichas «sin reclamar», p. ej. el rival de un combate). Cuando ese boxeador se registre, podrá reclamar su ficha (pendiente, ver hoja de ruta).

## Modelo de datos (`prisma/schema.prisma`)

`User`/`Session` → `Boxer` (1:1 opcional con `User`) → `Bout` ← `Event`; `Gym`, `Trainer`; `Rating` (usuario × combate × boxeador).

Decisiones clave:

1. **El récord se calcula, no se guarda.** Sale de los `Bout` (`src/lib/record.ts`), por nivel (PRO/AMATEUR). No puede quedar desincronizado.
2. **Fiabilidad del dato (`Bout.verification`).** Un amateur se registra a sí mismo, así que hay que distinguir lo que declara de lo que está comprobado:
   `SELF_REPORTED` → `CONFIRMED` (lo confirma el rival) → `VERIFIED` (moderador/organizador/federación) · `DISPUTED` (rechazado; no cuenta).
   La ficha muestra cuántos combates del récord están sin confirmar. Es la base de la confianza, que es lo que distingue a un producto así.
3. **Valoraciones ancladas a un combate.** Una nota es «esta actuación en este combate», no «este boxeador en general». Restricciones (en `rateBoxer`):
   una por usuario+combate+boxeador (editable) · requiere cuenta · solo combates ya celebrados y no disputados · los participantes no pueden valorar · comentario ≤ 500 caracteres · casilla «lo vi en directo» guardada como señal.
4. **Ránking con media bayesiana** (`src/lib/ratings.ts`): un boxeador con una sola nota de 5 no supera a otro con 40 notas de 4,8.
5. **Madrid como plaza inicial, no como límite.** Todo se filtra por `province`; la portada usa la constante `HOME_PROVINCE`. Expandir es cambiar un parámetro o añadir un selector, no una migración.

## Autenticación

Propia y mínima, sin dependencias: contraseñas con `scrypt` + sal; sesión con token aleatorio en cookie `httpOnly`/`sameSite=lax` (`secure` en producción); en la base solo se guarda el `sha256` del token (`src/lib/auth.ts`). Caducidad de 30 días.
Se puede sustituir por Auth.js/un proveedor externo sin tocar el modelo de dominio.

## Riesgos conocidos (a resolver antes de abrir al público)

- **Manipulación de valoraciones** (cuentas falsas, brigading): falta verificación de email, límite de frecuencia por IP/usuario, detección de patrones y ponderar más las notas con «lo vi en directo» o de cuentas antiguas.
- **Ficha falsa / suplantación**: falta el flujo de *reclamar ficha* con comprobación (email + validación de gimnasio o moderador).
- **Combates inventados**: mitigado por la verificación, pero sin rival con cuenta solo puede validarlo un moderador.
- **Menores de edad**: el amateur incluye juveniles. Hace falta política de privacidad y consentimiento parental antes de publicar datos personales (RGPD).
- **Sin protección CSRF adicional** más allá de la que Next.js aplica a Server Actions (origen del mismo sitio).

## Hoja de ruta

1. **Ahora (hecho):** cuentas, ficha propia, registro de combates, confirmación por el rival, moderación, valoraciones, ránking, portada amateur/Madrid.
2. **Siguiente:** reclamar ficha existente; verificación de email; rol `ORGANIZER` y alta de veladas con cartel; tests automáticos y CI.
3. **Después:** seguir a boxeadores y avisos de veladas; fotos/vídeo; perfiles de gimnasio gestionados por su responsable; mapa de gimnasios de Madrid.
4. **Escala:** SEO/sitemaps, API pública, app móvil, importación de datos federativos (Federación Madrileña / FEB), otras provincias.
