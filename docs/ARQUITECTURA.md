# Arquitectura de Ring España

Estado técnico vigente. La historia de cómo se llegó hasta aquí está en [`DIARIO.md`](DIARIO.md); cómo retomar el trabajo, en [`TRASLADO.md`](TRASLADO.md); la revisión de calidad del código, en [`AUDITORIA.md`](AUDITORIA.md).

## Propósito y enfoque

Fomentar la afición a los deportes de contacto de toda España: boxeo, jiu-jitsu, K-1, kickboxing, MMA y Muay Thai, amateur y profesional. La comunicación y los valores iniciales no presentan una ciudad o disciplina como prioridad (petición urgente del fundador, 3 de octubre de 2026); las prioridades operativas internas no son mensajes públicos.
El peleador amateur gestiona su ficha y su récord; el público da aura a lo que ve; el calendario descubre veladas.
Cada decisión técnica se toma para que esto escale a otras provincias sin rehacer nada.

Diseño gráfico: aplazado a propósito, por petición del fundador. La UI actual (fondo oscuro, rojo y dorado) es funcional y provisional.

## Stack

Next.js 15 (App Router, Server Components y Server Actions) · TypeScript 5 · PostgreSQL 16 · Prisma 6. Sin API REST separada: las páginas leen de la base de datos en el servidor y los formularios llaman a Server Actions (`src/app/actions.ts`).
Pruebas: vitest (unitarias) y playwright-core + axe-core (navegador y accesibilidad). CI: GitHub Actions con PostgreSQL de servicio.

## Estructura del código

El código se organiza **por dominios** y con reglas de dependencia que vigila una prueba. La guía completa (dónde está cada cosa, recetas para añadir pantallas o acciones, convenciones y definición de «terminado») es [`DESARROLLO.md`](DESARROLLO.md); el mapa de pantallas → acciones → permisos → tablas se genera solo en [`MAPA-FUNCIONAL.md`](MAPA-FUNCIONAL.md).

- `src/app/` — la interfaz: una carpeta por pantalla, con direcciones en español (`/peleadores`, `/veladas`, `/mi-cuenta`, `/moderacion`…).
  - `src/app/actions/` — las acciones del servidor, **un módulo por dominio** (`accounts`, `fighters`, `bouts`, `aura`, `events`, `moderation`, `community`) y `shared.ts` con los ayudantes comunes y las guardas de permisos (`requireAdmin`, `requireOrganizer`).
  - `src/app/components/` — componentes compartidos entre pantallas (avisos, filtros, paginación, etiquetas de verificación…).
- `src/lib/` — la lógica, sin interfaz y agrupada por dominio: `common` (base de datos, textos, fechas, disciplinas, mensajes, correo, búsqueda sin tildes, entrada del usuario), `accounts` (sesiones, contraseñas, enlaces de un solo uso, límites de intentos, retención), `fighters` (récord, declaración previa, coherencia, anonimización), `bouts` (reglas de resultados), `aura` (reglas y ránking) y `community` (avisos de error y notificaciones).
- `src/instrumentation.ts` — comprueba la configuración al arrancar en producción (sin `APP_URL` el servidor no arranca).
- `prisma/schema.prisma`, `prisma/migrations/` y `prisma/seed.ts` (datos ficticios; se niega a borrar una base real).
- Reglas de las acciones del servidor: todo lo exportado de un módulo de `src/app/actions/` es un punto de entrada público (los ayudantes van sin exportar o en `shared.ts`); un módulo no importa de otro. Patrones: `go()` (redirigir con mensaje), `guard()` (traduce errores previsibles de Prisma), `withLock()` (bloqueo consultivo de PostgreSQL para límites diarios) y `audit()` (historial, dentro de la misma transacción).

## Actores y roles

| Rol | Puede |
|---|---|
| Visitante | Navegar, buscar, ver fichas, veladas y ránking (solo lo respaldado se muestra como hecho) |
| `FAN` | Lo anterior + dar aura a peleadores (con el correo verificado) y seguirlos |
| `FIGHTER` | Lo anterior + una ficha propia (una o varias disciplinas) y registrar sus combates |
| `ORGANIZER` | Crear veladas, montar el cartel y poner resultados (nacen `VERIFIED`). Se solicita (con una comprobación obligatoria); lo aprueba un `ADMIN` anotando la evidencia comprobada. Puede ascender cualquier usuario que no sea administrador |
| `ADMIN` | Moderación: combates, avisos, reclamaciones, organizadores y sello de gimnasios. Se asigna a mano en la base de datos |

**Solicitudes:** las reclamaciones de ficha y las solicitudes de organizador las decide un `ADMIN`; rechazar exige un **motivo**, que ve la persona en la aplicación y recibe por correo (también la aprobación). El motivo de las reclamaciones se guarda en `ClaimRequest.reviewNote` (el texto con el que se justificó se borra al decidir).

Un peleador sin cuenta también existe: cuando alguien registra un combate contra él se crea una **ficha provisional** (`listed: false`: solo nombre e inicial del apellido, sin listados ni buscadores, sin indexar). Cuando esa persona se registra, la busca en `/mi-ficha` y **solicita reclamarla** (`ClaimRequest`); un `ADMIN` la aprueba.

## Cuentas, acceso y correo

- **Contraseñas:** scrypt asíncrono (N=2^16, r=8, p=2, parámetros de OWASP) con los parámetros **guardados en el propio hash** (`scrypt$N$r$p$sal$hash`); los hashes del formato antiguo se verifican y se recalculan al entrar (`lib/accounts/password.ts`).
- **Sesión:** token aleatorio de 256 bits en cookie `httpOnly`/`sameSite=lax` (`secure` en producción); en la base solo el `sha256`. 30 días.
- **Límites de intentos** (`lib/accounts/ratelimit.ts`, tabla `RateHit`): acceso (8 fallos/15 min por correo y 40 por IP), registro (10/hora por IP), recuperación (3/hora por correo) y reenvío de verificación (3/hora). La IP solo se usa si el proxy la facilita (`X-Forwarded-For`): **en producción la aplicación debe ir detrás de un proxy que sustituya esa cabecera**. El acceso tarda lo mismo exista o no el correo. **El intento se reserva antes de calcular el hash** (`reservar()`, que lo anota primero y lo devuelve si la contraseña era correcta): si se anotara al terminar, peticiones simultáneas se saltarían el límite. La IP es la que añade el proxy de confianza al final de `X-Forwarded-For` (`TRUSTED_PROXY_HOPS`, por defecto 1), no la primera de la lista, que escribe el cliente.
- **Enlaces de un solo uso** (`EmailToken`, tipos `VERIFY` 48 h, `RESET` 1 h y `UNSUB` 1 año; se guarda el `sha256`; el consumo es atómico y solo se gasta con un `POST`, para que los escáneres de enlaces no lo consuman). Recuperar la contraseña cierra todas las sesiones y verifica el correo (así quien registró un correo ajeno no lo retiene).
- **Correo** (`lib/common/mail.ts`): Resend por HTTP con `RESEND_API_KEY` y `MAIL_FROM`; `MAIL_TRANSPORT=log` escribe los mensajes en el log (desarrollo y pruebas); en producción sin proveedor no se envía nada y las pantallas lo dicen. Los textos de usuario que entran en un mensaje se reducen a una línea. Los avisos a seguidores se envían tras responder (`after()`), respetan la preferencia `notifyEmails` y llevan enlace de baja.

## Privacidad y retención

- `/mi-cuenta`: corregir datos, cambiar contraseña, avisos por correo, **descargar una copia de todos los datos** (`/mi-cuenta/datos`) y **eliminar la cuenta**. Al eliminarla se borran sesiones, auras dadas, seguimientos, solicitudes y avisos; la ficha de peleador **se borra si no tiene combates y se anonimiza si los tiene** (los combates forman parte del récord de los rivales). Queda un apunte en el historial sin datos personales. No se puede eliminar la única cuenta de moderador.
- `/privacidad`: datos, destinatarios, plazos y derechos. **Texto redactado por la IA a partir del comportamiento real; requiere revisión jurídica.**
- **Retención** (`lib/accounts/retention.ts`, se ejecuta como mucho cada 30 minutos por proceso): sesiones y enlaces caducados, intentos de acceso a los 2 días, cuentas sin verificar a los 30 días, solicitudes de reclamación decididas a los 90 días, avisos resueltos a los 12 meses, historial a los 3 años. El texto con el que alguien demuestra quién es se borra al decidir la solicitud.

## Modelo de datos (`prisma/schema.prisma`)

`User` (con `Session`, `EmailToken`, `RateHit`) → `Fighter` (1:1 opcional; `FighterDiscipline` por disciplina con división deportiva versionada, peso y récord de partida) → `Bout` ← `Event`; `Gym`, `Trainer`; `Aura` (usuario × combate × peleador); `Follow`; `Report` (avisos de error); `ClaimRequest`; `OrganizerRequest`; `AuditLog`.

Decisiones clave:

1. **El récord se calcula, no se guarda** (`lib/fighters/record.ts`), por disciplina y nivel. No puede quedar desincronizado. Lo que declara un peleador sobre su rival no cuenta en el récord del rival hasta que este lo confirma; lo rechazado no cuenta en ninguna parte.
2. **Fiabilidad del dato (`Bout.verification`):** `SELF_REPORTED` → `CONFIRMED` (lo confirma el rival) → `VERIFIED` (organizador o moderador) · `DISPUTED` (rechazado: no cuenta ni se muestra como hecho, y tiene cola de moderación para restaurarlo). Ver la sección de confianza más abajo.
3. **Un combate = una pareja por velada** (`Bout.pairKey`, única con la velada): se impide registrarlo dos veces en cualquier esquina. La doble pulsación y las carreras se traducen en mensajes, no en errores.
4. **Fechas:** las veladas se guardan a las 12:00 UTC del día elegido; «ya celebrada» se decide por el día de Madrid (`lib/common/dates.ts`). No se admiten fechas anteriores a 1980 ni a más de un año vista. Portada y calendario comparten `calendarDayStart()`: hoy y próximas incluye todo el día de Madrid; pasadas contiene únicamente fechas anteriores a hoy. No cambia cuándo se permite registrar un resultado (`eventDayReached`).
5. **Ámbito nacional y filtros voluntarios:** portada y ránking consultan todas las provincias, disciplinas y niveles al entrar. Las altas no suponen Madrid ni boxeo: se eligen provincia y disciplina, validadas en servidor. La edición conserva datos guardados. Los nombres de disciplinas se presentan alfabéticamente y con el mismo énfasis. La portada ordena veladas por fecha/identificador, fichas por alta y actuaciones por aura/nombre; no aplica cuotas ni selección por prioridad interna.
6. **Disciplinas:** `BOXEO`, `MMA`, `MUAYTHAI`, `KICKBOXING`, `K1`, `JIUJITSU`; los métodos y las categorías heredadas viven en `lib/common/disciplines.ts`; las divisiones federativas por edad, sexo y modalidad, fuentes y reglas de edad viven en `lib/common/competition.ts`. Una ficha por persona con varias disciplinas.

## Aura y ránking

El **aura** sustituye a las estrellas: reconocimiento del público a un peleador **por su actuación en un combate**. Reglas (`lib/aura/rules.ts`, compartidas por el servidor y la interfaz): el combate debe haberse celebrado, tener resultado, no estar rechazado ni cancelado, y quien la da no puede ser uno de los participantes; correo verificado; una por persona, combate y peleador (se puede quitar); 20 al día; comentario de hasta 500 caracteres, **denunciable y retirable por moderación**; se muestra el nombre de pila y la inicial del primer apellido. El ránking (`lib/aura/ranking.ts`) suma por actuaciones y agrupa por disciplina, nivel, división deportiva y peso del combate, con zona y periodo, y los empates comparten posición. Las fichas provisionales y las ocultas no entran.
Decisión del fundador: **un clic por usuario y combate**; hasta tres clics será función premium más adelante. Pregunta abierta: ¿por persona y combate, o por persona, combate y peleador? (hallazgo 41).

## Seguridad

- Validación en el servidor de todo lo que escribe el usuario: longitudes (`LIMITS`), fechas, provincias, resultado y método frente a la disciplina, y enlaces (solo `http`/`https`). Nada de claves heredadas de objetos (`safe.ts`). Enlaces de retorno solo a rutas internas (`paths.ts`).
- Cabeceras (`next.config.mjs`): política de contenido (solo contenido propio; sin incrustación ni formularios hacia fuera), `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` y HSTS (en producción); sin `X-Powered-By`.
- Autorización: las guardas están en un solo sitio (`lib/accounts/permissions.ts` y `auth.ts`: `requireUser`, `requireVerifiedUser`, `requireOrganizer`, `requireAdmin`) y las usan por igual las acciones y las pantallas; cuando deniegan, la persona termina en una pantalla que explica por qué (y, sin sesión, vuelve a donde iba tras entrar). Las de organizador comprueban además que la velada es suya y las de peleador que participa en el combate. `tests/unit/autorizacion.test.ts` ejecuta cada acción con cada rol y exige que toda acción exportada esté clasificada.
- **Entrada hostil:** `src/middleware.ts` limpia la dirección antes de que llegue a ninguna pantalla (un valor por parámetro, sin `constructor` —rompe el objeto `searchParams` de Next.js— y sin caracteres nulos), y `str()` limpia los campos de formulario.
- **Decisiones que dependen de un estado** (confirmar, verificar, aprobar): se escriben con `updateMany` condicionado al estado que vio quien decide, y si no encuentra nada la decisión se descarta con un aviso (`combate_cambiado`, `solicitud_cambiada`). La confirmación del rival lleva la huella del resultado que vio (`boutVersion`).
- Sin protección CSRF adicional más allá de la de Next.js para Server Actions (origen del mismo sitio) y la cookie `sameSite=lax`.

## Interfaz y accesibilidad

Estilo **provisional** (el diseño visual es al final, por petición del fundador); aquí solo hay accesibilidad y claridad, en `globals.css` (los ajustes de accesibilidad llevan la marca «A11Y»).
- **Medición automática:** `npm run test:a11y` pasa axe-core (WCAG 2.2 AA) por unas 40 pantallas (públicas, con sesión, moderación y organizador) y debe dar **0 incumplimientos graves**; se ejecuta también en el CI. Axe no mide todo: `tests/e2e/usabilidad.mjs` comprueba además navegación corta, tamaños de 16 px y 44 px, contraste calculado de los controles, enlaces subrayados, lo escrito que se conserva, avisos para lectores de pantalla y que ninguna pantalla se salga del ancho a 360 px.
- **Avisos** (`FlashNotice`): regiones permanentes (`role=status` educada para éxitos y `role=alert` asertiva para problemas) que se rellenan con el código de la dirección (`?aviso=` / `?problema=`) traducido por `lookup` (nunca claves heredadas).
- **Lo escrito no se pierde** (`RecordarCampos`): al enviar un formulario se guardan sus campos de texto en `sessionStorage` (sin contraseñas, ocultos ni casillas) y, si la acción vuelve a la misma pantalla con un problema, se devuelven a su sitio, también cuando el mismo error se repite (la dirección no cambia: se escucha el evento `reset` que lanza React al terminar la acción). El formulario se identifica por los nombres de sus campos y se abre el desplegable que lo contiene para que se vea dónde corregir.
- **Volver a donde se estaba:** «Entra para…» lleva a `/entrar?next=…`, que explica por qué y ofrece crear la cuenta conservando el destino; tras registrarse se recuerda la ruta (cookie de 2 horas, siempre ruta interna) y `/verificar` ofrece «Volver a lo que estabas haciendo».
- **Tablas en pantallas estrechas:** las de combates se apilan (`table.apilada` + `data-label`) para que la acción principal no quede fuera de la pantalla; el resto va en una región desplazable (`.table-wrap`).
- **Convenciones:** cada campo con etiqueta visible (`label.field`), filtros con «Aplicar filtros» y «Quitar filtros» (`Filtros.tsx`), enlaces con aspecto de botón con la clase `.btn` (nunca un botón dentro de un enlace), nombres accesibles que incluyen el objeto en los botones repetidos, tablas con `scope` y título, y contenedor desplazable en las anchas.
- **Pendiente:** probar con un lector de pantalla real y con personas reales de distintas edades (regla 11 del principio fundacional).

## Búsqueda y listados

`lib/common/search.ts`: sin tildes ni mayúsculas y con varias palabras en cualquier orden (cada palabra debe aparecer en algún campo) sobre peleadores, gimnasios, entrenadores y veladas; los peleadores provisionales y ocultos no aparecen. Se hace con `translate`/`strpos` de PostgreSQL (recorrido completo de la tabla: suficiente para empezar; si crece, `pg_trgm`). Listados paginados de 24 en 24 que conservan los filtros.

## Despliegue y entorno

Variables en [`.env.example`](../.env.example) y en el README. `GET /salud` comprueba la aplicación y la base de datos; `robots.txt` y `sitemap.xml` se generan dinámicamente. **Migraciones:** `prisma/migrations` (la inicial reproduce el esquema; el CI las aplica sobre una base vacía y falla si difieren de `schema.prisma`); `db push` queda para pruebas desechables. **Falta:** alojamiento y proveedor de correo reales.

## Idioma y modelo de negocio (decisiones del fundador)

- **Todo lo que ve una persona va en español** (interfaz, correos, errores, direcciones). El código interno está en inglés por convención; queda por decidir si también debe ir en español.
- **Monetización:** funciones premium **después** de terminar la estructura básica. Nunca se venderá la verificación, el sello ni una posición en el ránking; la consulta básica sigue siendo gratuita. Candidatas en `docs/IDEAS.md`.

## Riesgos conocidos (a resolver antes de abrir al público)

- **Menores de edad:** el amateur incluye juveniles. Hace falta una política (edad mínima, consentimiento de madre, padre o tutor, qué se muestra) y criterio jurídico. **Es el riesgo más importante.**
- **Texto de privacidad sin revisión jurídica** y sin responsable ni contacto definidos.
- **Manipulación del aura** (cuentas falsas, *brigading*): mitigada con correo verificado, límite diario y de intentos, y exclusión de participantes. Falta detección de patrones (muchas cuentas nuevas dando aura al mismo peleador) y ponderar «lo vi en directo» y la antigüedad.
- **Ficha falsa o suplantación:** la reclamación pasa por un moderador, pero la prueba de identidad es un texto libre. Falta un procedimiento claro (p. ej. confirmación del gimnasio).
- **Organizadores y veladas falsas:** la aprobación es manual y no exige nota de evidencia (hallazgo 93); cualquier usuario verificado publica veladas sin moderación previa (hallazgo 22).
- **Usabilidad:** la accesibilidad automática da 0 incumplimientos graves, pero **no se ha probado con un lector de pantalla real ni con personas reales** de distintas edades (incluida gente mayor): sin eso, la regla 11 del principio fundacional no está cumplida.
- **Correo:** hasta conectar el proveedor real, nadie recibe los enlaces en producción. La reputación de envío (dominio, SPF/DKIM) es cosa del fundador.
- **Revelar qué correos tienen cuenta** en el registro (decisión de usabilidad, mitigada con límites).

## Confianza y verificación de datos (sin depender de federaciones al principio)

Principio: **no se intenta demostrar que un dato es verdad, sino acumular evidencia independiente y mostrar siempre cuánta hay.** Nadie ve un récord como «verdadero/falso», sino con su nivel de respaldo. Las federaciones serán el nivel más alto cuando colaboren, pero el sistema funciona sin ellas.

### Niveles de respaldo de un combate

| Nivel | Fuente | Estado hoy |
|---|---|---|
| 0 | Lo declara el propio peleador | hecho (`SELF_REPORTED`) |
| 1 | Lo confirma el rival (cuenta verificada) | hecho (`CONFIRMED`) |
| 2 | Lo publica o confirma el organizador de la velada, que estuvo allí | hecho (`VERIFIED` si lo introduce el organizador) |
| 3 | Corroborado por terceros: enlace de evidencia (acta, cartel, redes, vídeo) y gimnasio/organizador con sello | **parcial**: enlace de evidencia y sellos hechos; falta que el sistema pondere el nivel automáticamente |
| 4 | Federación (licencia, actas oficiales) | futuro |

Regla de producto: **la ficha distingue siempre lo respaldado de lo autodeclarado** (etiqueta de respaldo en cada combate y récord de partida aparte). **El ránking de aura aún no lo distingue**: cuenta el aura de todo combate que no esté rechazado ni cancelado, sea cual sea su nivel de respaldo. Pendiente de decidir si el ránking exige un mínimo de combates confirmados (pregunta abierta en `IDEAS.md`).

### Verificar también a quien verifica (gimnasios, promotoras, organizadores)

Un organizador o gimnasio que «verifica» solo vale lo que valga su propia credibilidad, así que también tienen niveles:
- **Presencia pública comprobable:** web, Instagram/Facebook con actividad real, ficha de Google Maps, teléfono. Un moderador lo comprueba una vez y anota la evidencia.
- **Avales cruzados:** una entidad verificada puede avalar a otra (un gimnasio conocido avala a su promotora). Se guarda quién avaló a quién.
- **Historial:** puntuación interna de fiabilidad = combates suyos confirmados por terceros frente a disputados o retirados. Baja la puntuación y pierde peso o el sello.
- **Periodo de prueba:** un organizador nuevo pasa un tiempo con sus datos marcados «pendiente» hasta que acumula historial limpio.

### Comprobaciones automáticas (baratas y muy eficaces)

- Un peleador no puede tener dos combates el mismo día ni con menos de N días entre ellos; edad y categoría de peso coherentes; el rival no puede ser él mismo.
- Duplicados: mismo combate registrado por los dos peleadores, o el mismo evento creado dos veces.
- Colusión: confirmaciones cruzadas entre cuentas recién creadas, mismas IP/dispositivo, ráfagas de auras a un mismo peleador.
- Récords imposibles o saltos raros (p. ej. muchos combates en pocas semanas) → a la cola de moderación, no rechazo automático.

### Transparencia y reversibilidad

- **Historial de cambios (audit log)** de cada dato: quién, cuándo, qué cambió. Nada se edita en silencio.
- **Botón «reportar dato»** en fichas, combates y veladas, con seguimiento del caso.
- **Evidencia adjunta** opcional en cada combate (enlace a acta, cartel, publicación, vídeo).
- Los datos disputados dejan de contar en el récord hasta resolverse (ya ocurre con `DISPUTED`).

### Moderación humana con ventaja local

En Madrid, al principio, la moderación manual es viable y es una ventaja: se puede llamar a un gimnasio, escribir a una promotora o preguntar a un entrenador conocido. Conviene formar un pequeño grupo de **moderadores de confianza** (entrenadores, antiguos deportistas, árbitros) en vez de que todo pase por una sola persona.

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
5. Detección de colusión en auras y confirmaciones.

## Hoja de ruta

1. **Hecho:** cuentas, roles y acceso seguro; ficha con varias disciplinas y récord de partida; verificación de combates con niveles de respaldo y cola de rechazados; aura y ránking; veladas, cartel y resultados por organizadores; moderación con historial; correo verificado, recuperación y avisos con baja; privacidad (descarga y eliminación); búsqueda sin tildes y paginación; cabeceras de seguridad, `robots.txt`, mapa del sitio y `/salud`; CI con pruebas de navegador.
2. **Siguiente (ver `TRASLADO.md`, sección 6):** migraciones y despliegue; accesibilidad y usabilidad (Bloque 6, incluida la prueba con personas reales); pruebas de autorización y documentación (Bloque 7); decisiones del fundador (sección 7 de `TRASLADO.md`).
3. **Después:** funciones premium (sin vender verificación ni ránking); fase de diseño visual con *briefing* del fundador; fotos y vídeo; perfiles de gimnasio gestionados por su responsable; mapa de gimnasios de Madrid.
4. **Escala:** API pública, app móvil, importación de datos federativos (Federación Madrileña / FEB), otras provincias.

## Aplicación de los diseños aprobados — 3 de octubre de 2026

Origen: el fundador pidió «ya puedes aplicar todo esto a la aplicación en GitHub» para verlo en Render. Se implementa #BE33F5 con brillo, esquinas redondeadas, portada de comunidad adaptable y la misma cabecera para peleadores, gimnasios, entrenadores, promotores y federaciones. Las fotos y banners son independientes, con encuadre horizontal/vertical y eliminación. La imagen de portada es ilustrativa y sus personas ficticias.

Los peleadores conservan nivel amateur/profesional y categoría por disciplina. Jiu-jitsu incorpora cinturón y grados opcionales, marcados como declaración del deportista; no son una acreditación federativa. Se conservan récords por disciplina y aura por combate.

### Implementación y permisos

Nuevo módulo `src/lib/profiles`, componentes ProfileHeader/ProfileEditor y editor `/perfiles/[kind]/[id]/editar`. Peleadores y promotores editan su propio perfil; moderación puede editar todos. Moderación asigna gimnasios, entrenadores y federaciones a cuentas con correo confirmado; el titular encuentra sus perfiles en Mi cuenta. Las federaciones se crean desde el directorio por moderación y no llevan acreditación automática. No se inventan perfiles de entidades ni se asigna su control automáticamente.

La migración `20261003140000_identidad_perfiles` añade Profile y cinturón/grados; no borra registros existentes. Fotos WebP en PostgreSQL para persistir entre despliegues de Render sin disco persistente. Sharp comprueba formato real, tamaño máximo 4 MB por imagen, máximo 25 millones de píxeles, descarta animaciones, retira metadatos y reduce dimensiones. La ruta de imágenes verifica visibilidad y permisos; no publica imágenes de fichas ocultas. La exportación de cuenta incluye las imágenes; anonimizar un peleador retira su personalización y graduación.

### Validación y despliegue

339 pruebas unitarias pasan y la compilación de producción pasa. Nueva prueba de navegador `tests/e2e/perfiles.mjs`: subida real, persistencia, encuadre, cinturón visible, otra cuenta rechazada, eliminación e imágenes ocultas. La validación completa de PostgreSQL, migraciones, navegador y accesibilidad se ejecuta en CI antes de integrar. No hay PostgreSQL disponible en este entorno local. Se incorporan correcciones verificadas de los selectores y datos de las pruebas antiguas; no se desactiva ninguna prueba. El estado final de CI y publicación se registrará en el PR.

Render está configurado en `render.yaml` para la rama `claude/ring-espana-mvp`; `scripts/arranque-demo.sh` aplica migraciones. La actualización se ha combinado con la rama vigente de la demo (7580902), preservando las categorías por edad, la comunicación inclusiva y el calendario incorporados durante el trabajo.

## Divisiones deportivas — 3 de octubre de 2026

Petición del fundador de incluir las edades de boxeo y estudiar las demás disciplinas. `divisionId` nullable en `FighterDiscipline` (actual) y `Bout` (histórico) referencia un catálogo federativo versionado. Migración aditiva, sin clasificar retrospectivamente edades o sexos. El formulario de combate declara su categoría y nivel propios: ya no copia el peso actual de la ficha al registrar historial. Los cambios de ficha no mueven aura entre categorías; un peleador puede figurar en varios grupos históricos. El récord agregado sigue por disciplina/nivel y separa su etiqueta de categoría actual.

Guardas compartidas de edad y combinaciones en el servidor: formación sin combate, incompatibilidad de peso/sexo/grupo, edad en la fecha, año de reglamento y ambas esquinas del cartel. Al cambiar fecha de evento se vuelven a comprobar sus combates. Una fecha de nacimiento conocida se comprueba también al corregir la ficha o su división; una división sin nacimiento es autodeclarada, no verificada. La política de menores y consentimiento sigue siendo un bloque propio pendiente, no una consecuencia automática de la edad deportiva.

Fuentes, cobertura, excepciones y límites: `DISENO-PESOS.md`. MMA conserva vacíos los pesos de sus nuevas divisiones hasta contrastar una tabla vigente; IBJJF requiere catálogo conjunto por cinturón y kimono/sin kimono, todavía pendiente. Las divisiones WAKO distinguen ring/tatami, pero la modalidad concreta y las reglas de rounds/empate/emparejamiento por edad no se certifican con este catálogo. Licencias, requisitos médicos y selección federativa no se deducen de la ficha. El evento actual solo tiene una fecha; torneos de varios días necesitarán fecha final para las reglas que exigen conservar edad durante toda la competición.
