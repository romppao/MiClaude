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
| `FAN` | Lo anterior + dar aura a peleadores |
| `FIGHTER` | Lo anterior + una ficha propia (con una o varias disciplinas) y registrar sus combates |
| `ORGANIZER` | Crear veladas, montar el cartel y poner resultados (nacen `VERIFIED`). Se obtiene solicitándolo; lo aprueba un `ADMIN` |
| `ADMIN` | Verificar o rechazar combates (`/moderacion`). Se asigna manualmente en la base de datos |

Un boxeador sin cuenta también existe (fichas «sin reclamar», p. ej. el rival de un combate). Cuando ese boxeador se registra, la busca en `/mi-ficha` y **solicita reclamarla** (`ClaimRequest`); un `ADMIN` la aprueba. Al aprobar, la ficha pasa a su cuenta y las demás solicitudes sobre ella se rechazan.

## Verificación de email

Toda acción que publica contenido (valorar, crear ficha, registrar/confirmar combates, reclamar, pedir ser organizador) exige email verificado (`requireVerifiedUser`). El enlace del correo solo muestra un botón; la verificación se hace por POST para que los escáneres de enlaces no consuman el token. Tokens de un solo uso, 48 h, guardados como `sha256`.
El envío está tras `src/lib/mail.ts`: hoy escribe en el log del servidor; **hay que conectar un proveedor real (Resend/SES/SMTP) y definir `APP_URL` antes de producción**.

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

## Modelos añadidos después del MVP

`AuditLog` (historial), `Report` (avisos de error), `Follow` (seguir boxeadores), `EmailToken`, `ClaimRequest`, `OrganizerRequest`. `Bout` incorpora `verification`, `evidenceUrl` y `flags` (señales de coherencia). Los avisos al usuario viajan como códigos en la URL y se traducen en `src/lib/messages.ts`.

## Peleadores, disciplinas, récord de partida y aura (implementado)

*Nota de vocabulario:* el proyecto empezó hablando de «boxeadores»; desde que se amplió a otros deportes de contacto, todo (modelo, código, rutas e interfaz) usa **«peleador»** (`Fighter`, rol `FIGHTER`, `/peleadores`). Los apartados anteriores de este documento conservan la palabra original.

- **Disciplinas** (`Discipline`: BOXEO, MMA, KICKBOXING, K1, JIUJITSU). Una sola ficha por persona con varias disciplinas (`FighterDiscipline`: nivel, categoría de peso y récord de partida por disciplina). `Event` lleva la disciplina y `Bout` la hereda del evento. Todo lo específico de cada deporte (orden de presentación con el boxeo primero, categorías de peso, formas de terminar, si es deporte de torneo) vive en `src/lib/disciplines.ts`. Para añadir una disciplina: valor en el enum de Prisma y entradas en ese fichero.
- **Récord calculado por disciplina y nivel** (`computeRecords`). Se añade `sub` (victorias por sumisión). En disciplinas de torneo (jiu-jitsu) no se aplican las señales de combates muy seguidos.
- **Récord de partida:** total de combates anteriores y, si se recuerdan, victorias/derrotas/empates (`parsePrior`). La cifra principal solo lo suma si tiene detalle; siempre se muestra aparte y etiquetado como declarado por el propio deportista. Los cambios quedan en `AuditLog`.
- **Aura** (`Aura`) sustituye a las estrellas: una por persona, combate y peleador (se puede quitar), con las mismas reglas anti-manipulación (correo verificado, combate celebrado y no disputado, participantes excluidos, 20 al día). El **ránking** (`lib/aura.ts`) agrupa por disciplina y categoría de peso, con zona y periodo, y empates en la misma posición.
- **Categorías de peso** orientativas, pendientes de validar con las federaciones.

## Riesgos conocidos (a resolver antes de abrir al público)

- **Manipulación de valoraciones** (cuentas falsas, brigading): mitigado con email verificado y límite de 20 valoraciones/día por usuario. Falta límite por IP, detección de patrones (p. ej. muchas cuentas nuevas votando al mismo boxeador) y ponderar más «lo vi en directo» y las cuentas antiguas.
- **Ficha falsa / suplantación**: la reclamación pasa por un moderador, pero hoy la prueba de identidad es un texto libre. Falta un procedimiento claro (p. ej. confirmación del gimnasio o de la federación) y documentar qué se pide.
- **Organizadores falsos**: mismo caso; la aprobación es manual.
- **Correo a seguidores:** hoy solo escribe en el log. Antes de enviar correos reales hay que dar la opción de no recibirlos (baja/preferencias) y un proveedor con buena reputación de envío. Solo se avisa de combates publicados por organizadores para evitar spam por combates inventados.
- **Usabilidad (principio F9)** aplicada a los flujos principales; falta el resto de pantallas, medición automática de accesibilidad y pruebas con usuarios reales.
- **Combates inventados**: mitigado por la verificación, pero sin rival con cuenta solo puede validarlo un moderador.
- **Menores de edad**: el amateur incluye juveniles. Hace falta política de privacidad y consentimiento parental antes de publicar datos personales (RGPD).
- **Sin protección CSRF adicional** más allá de la que Next.js aplica a Server Actions (origen del mismo sitio).

## Confianza y verificación de datos (sin depender de federaciones al principio)

Principio: **no se intenta demostrar que un dato es verdad, sino acumular evidencia independiente y mostrar siempre cuánta hay.** Nadie ve un récord como «verdadero/falso», sino con su nivel de respaldo. Las federaciones serán el nivel más alto cuando colaboren, pero el sistema funciona sin ellas.

### Niveles de respaldo de un combate

| Nivel | Fuente | Estado hoy |
|---|---|---|
| 0 | Lo declara el propio boxeador | hecho (`SELF_REPORTED`) |
| 1 | Lo confirma el rival (cuenta verificada) | hecho (`CONFIRMED`) |
| 2 | Lo publica o confirma el organizador de la velada, que estuvo allí | hecho (`VERIFIED` si lo introduce el organizador) |
| 3 | Corroborado por terceros: enlace de evidencia (acta, cartel, redes, vídeo) y gimnasio/organizador con sello | **parcial**: enlace de evidencia y sellos hechos; falta que el sistema pondere el nivel automáticamente |
| 4 | Federación (licencia, actas oficiales) | futuro |

Regla de producto: **la ficha y el ránking distinguen siempre lo respaldado de lo autodeclarado** («12-2, 9 verificados»). El ránking de valoraciones puede exigir un mínimo de combates de nivel ≥ 1 para aparecer.

### Verificar también a quien verifica (gimnasios, promotoras, organizadores)

Un organizador o gimnasio que «verifica» solo vale lo que valga su propia credibilidad, así que también tienen niveles:
- **Presencia pública comprobable:** web, Instagram/Facebook con actividad real, ficha de Google Maps, teléfono. Un moderador lo comprueba una vez y anota la evidencia.
- **Avales cruzados:** una entidad verificada puede avalar a otra (un gimnasio conocido avala a su promotora). Se guarda quién avaló a quién.
- **Historial:** puntuación interna de fiabilidad = combates suyos confirmados por terceros frente a disputados o retirados. Baja la puntuación y pierde peso o el sello.
- **Periodo de prueba:** un organizador nuevo pasa un tiempo con sus datos marcados «pendiente» hasta que acumula historial limpio.

### Comprobaciones automáticas (baratas y muy eficaces)

- Un boxeador no puede tener dos combates el mismo día ni con menos de N días entre ellos; edad y categoría de peso coherentes; el rival no puede ser él mismo.
- Duplicados: mismo combate registrado por los dos boxeadores, o el mismo evento creado dos veces.
- Colusión: confirmaciones cruzadas entre cuentas recién creadas, mismas IP/dispositivo, ráfagas de valoraciones a un mismo boxeador.
- Récords imposibles o saltos raros (p. ej. muchos combates en pocas semanas) → a la cola de moderación, no rechazo automático.

### Transparencia y reversibilidad

- **Historial de cambios (audit log)** de cada dato: quién, cuándo, qué cambió. Nada se edita en silencio.
- **Botón «reportar dato»** en fichas, combates y veladas, con seguimiento del caso.
- **Evidencia adjunta** opcional en cada combate (enlace a acta, cartel, publicación, vídeo).
- Los datos disputados dejan de contar en el récord hasta resolverse (ya ocurre con `DISPUTED`).

### Moderación humana con ventaja local

En Madrid, al principio, la moderación manual es viable y es una ventaja: se puede llamar a un gimnasio, escribir a una promotora o preguntar a un entrenador conocido. Conviene formar un pequeño grupo de **moderadores de confianza** (entrenadores, exboxeadores, árbitros) en vez de que todo pase por una sola persona.

### Vía hacia las federaciones

- No hace falta su permiso para empezar: solo se publican datos aportados por los propios interesados y organizadores.
- Se les ofrece algo que hoy no tienen: **un calendario y unos resultados limpios y visibles**. Con tracción demostrable en Madrid, la conversación con la Federación Madrileña pasa a ser una colaboración (acceso a actas o licencias como nivel 4), no una petición.
- El campo de **nº de licencia** se puede añadir de forma opcional y sin verificar hasta que exista acuerdo.
- Datos sensibles: cualquier documento de identidad o licencia debe tratarse conforme al RGPD (mínimos datos, borrado tras la comprobación) y con especial cuidado con menores.

### Orden de implementación sugerido

1. ~~Enlace de evidencia en el combate y audit log~~ **hecho** (`Bout.evidenceUrl`, `AuditLog`, `/moderacion/historial`).
2. ~~Sello de verificado para gimnasios y organizadores~~ **hecho** con nota de evidencia interna; **falta el aval cruzado** (necesita cuentas de responsable de gimnasio).
3. Comprobaciones automáticas de coherencia (fechas, duplicados) que envíen casos a moderación.
4. Botón «reportar dato» y puntuación de fiabilidad de organizadores.
5. Detección de colusión en valoraciones y confirmaciones.

## Hoja de ruta

1. **Hecho:** cuentas y roles, ficha propia, registro y confirmación de combates, moderación, valoraciones, ránking, portada amateur/Madrid, **verificación de email, reclamar ficha, rol organizador con cartel y resultados**.
2. **Siguiente:** proveedor de correo real; tests automáticos (hoy solo hay pruebas de navegador ad hoc) y CI; despliegue con base de datos gestionada y migraciones (`prisma migrate`) en vez de `db push`; límites por IP y detección de patrones en valoraciones; edición/borrado de veladas y combates por el organizador.
3. **Después:** seguir a boxeadores y avisos de veladas; fotos/vídeo; perfiles de gimnasio gestionados por su responsable; mapa de gimnasios de Madrid.
4. **Escala:** SEO/sitemaps, API pública, app móvil, importación de datos federativos (Federación Madrileña / FEB), otras provincias.
