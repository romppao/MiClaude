# Arquitectura de Ring España

Estado técnico vigente. La historia de cómo se llegó hasta aquí está en [`DIARIO.md`](DIARIO.md); cómo retomar el trabajo, en [`TRASLADO.md`](TRASLADO.md); la revisión de calidad del código, en [`AUDITORIA.md`](AUDITORIA.md).

## Propósito y enfoque

Fomentar la afición a los deportes de contacto de toda España: boxeo, jiu-jitsu, K-1, kickboxing, MMA y Muay Thai, amateur y profesional. La comunicación y los valores iniciales no presentan una ciudad o disciplina como prioridad (petición urgente del fundador, 3 de octubre de 2026); las prioridades operativas internas no son mensajes públicos.
El peleador amateur gestiona su ficha y su récord; el público da aura a lo que ve; el calendario descubre veladas.
Cada decisión técnica se toma para que esto escale a otras provincias sin rehacer nada.

Identidad visual vigente: violeta #BE33F5 y perfiles personalizables, integrados en #12. El menú se organiza por actividades por petición del fundador; se conserva el diseño aprobado.

## Stack

Next.js 15 (App Router, Server Components y Server Actions) · TypeScript 5 · PostgreSQL 16 · Prisma 6. Sin API REST separada: las páginas leen de la base de datos en el servidor y los formularios llaman a Server Actions (`src/app/actions.ts`).
Pruebas: vitest (unitarias) y playwright-core + axe-core (navegador y accesibilidad). CI: GitHub Actions con PostgreSQL de servicio.

## Estructura del código

El código se organiza **por dominios** y con reglas de dependencia que vigila una prueba. La guía completa (dónde está cada cosa, recetas para añadir pantallas o acciones, convenciones y definición de «terminado») es [`DESARROLLO.md`](DESARROLLO.md); el mapa de pantallas → acciones → permisos → tablas se genera solo en [`MAPA-FUNCIONAL.md`](MAPA-FUNCIONAL.md).

- `src/app/` — la interfaz: una carpeta por pantalla, con direcciones en español (`/peleadores`, `/veladas`, `/mi-cuenta`, `/moderacion`…).
  - `src/app/actions/` — las acciones del servidor, **un módulo por dominio** (`accounts`, `fighters`, `bouts`, `aura`, `events`, `moderation`, `community`, `trajectory`) y `shared.ts` con los ayudantes comunes y las guardas de permisos (`requireAdmin`, `requireOrganizer`).
  - `src/app/components/` — componentes compartidos entre pantallas (avisos, filtros, paginación, etiquetas de verificación…).
- `src/lib/` — la lógica, sin interfaz y agrupada por dominio: `common` (base de datos, textos, fechas, disciplinas, mensajes, correo, búsqueda sin tildes, entrada del usuario), `accounts` (sesiones, contraseñas, enlaces de un solo uso, límites de intentos, retención), `fighters` (récord, declaración previa, coherencia, anonimización), `bouts` (reglas de resultados), `aura` (reglas y ránking) y `community` (avisos de error y notificaciones).
- `src/instrumentation.ts` — comprueba la configuración al arrancar en producción (sin `APP_URL` el servidor no arranca).
- `prisma/schema.prisma`, `prisma/migrations/` y `prisma/seed.ts` (datos ficticios; se niega a borrar una base real).
- Reglas de las acciones del servidor: todo lo exportado de un módulo de `src/app/actions/` es un punto de entrada público (los ayudantes van sin exportar o en `shared.ts`); un módulo no importa de otro. Patrones: `go()` (redirigir con mensaje), `guard()` (traduce errores previsibles de Prisma), `withLock()` (bloqueo consultivo de PostgreSQL para límites diarios) y `audit()` (historial, dentro de la misma transacción).

## Actores y roles

| Rol | Puede |
|---|---|
| Visitante | Navegar, buscar, ver fichas, veladas y ránking (las declaraciones se muestran identificadas por su respaldo) |
| `FAN` | Lo anterior + dar aura a peleadores (con el correo verificado) y seguirlos |
| `FIGHTER` | Lo anterior + una ficha propia (una o varias disciplinas) y registrar sus combates |
| *Alta por paneles* | **6 oct 2026:** `/registro` ofrece tres paneles (usuario, peleador, promotora o federación); el tercero crea la cuenta (rol `FAN`) y una `OrganizerRequest` con `kind` (`PROMOTORA`\|`FEDERACION`) y `website` en la misma transacción. Al aprobar una federación se crea su `Profile kind="federacion"` con la solicitante como `ownerId`. El aterrizaje tras entrar sale de `src/lib/accounts/landing.ts`. |
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

1. **El récord se calcula, no se guarda** (`lib/fighters/record.ts`), por disciplina y nivel. No puede quedar desincronizado. Los resultados declarados se muestran en ambas esquinas, etiquetados como no confirmados. Solo una decisión de moderación los suspende; el aviso del rival solicita revisión.
2. **Fiabilidad del dato (`Bout.verification`):** `SELF_REPORTED` → `CONFIRMED` (lo confirma el rival) → `VERIFIED` (organizador o moderador) · `DISPUTED` (suspendido por moderación: no cuenta y tiene cola para restaurarlo; no lo impone el rival). Ver la sección de confianza más abajo.
3. **Un combate = una pareja por velada** (`Bout.pairKey`, única con la velada): se impide registrarlo dos veces en cualquier esquina. La doble pulsación y las carreras se traducen en mensajes, no en errores.
4. **Fechas:** las veladas se guardan a las 12:00 UTC del día elegido; «ya celebrada» se decide por el día de Madrid (`lib/common/dates.ts`). No se admiten fechas anteriores a 1980 ni a más de un año vista. Portada y calendario comparten `calendarDayStart()`: hoy y próximas incluye todo el día de Madrid; pasadas contiene únicamente fechas anteriores a hoy. No cambia cuándo se permite registrar un resultado (`eventDayReached`).
5. **Ámbito nacional y filtros voluntarios:** portada y ránking consultan todas las provincias, disciplinas y niveles al entrar. Las altas no suponen Madrid ni boxeo: se eligen provincia y disciplina, validadas en servidor. La edición conserva datos guardados. Los nombres de disciplinas se presentan alfabéticamente y con el mismo énfasis. La portada ordena veladas por fecha/identificador, fichas por alta y actuaciones por aura/nombre; no aplica cuotas ni selección por prioridad interna.
6. **Disciplinas:** `BOXEO`, `MMA`, `MUAYTHAI`, `KICKBOXING`, `K1`, `JIUJITSU`; los métodos y las categorías heredadas viven en `lib/common/disciplines.ts`; las divisiones federativas por edad, sexo y modalidad, fuentes y reglas de edad viven en `lib/common/competition.ts`. Una ficha por persona con varias disciplinas.

## Aura y ránking

El aura total combina **trayectoria + respaldo opcional + comunidad**. La política v1 vive en `lib/aura/trajectory.ts` y el cálculo en `lib/aura/ranking.ts`. El desglose se muestra en ficha y ránking. Los votos mantienen sus reglas (`lib/aura/rules.ts`): combate celebrado con resultado, sin suspensión ni cancelación; cuenta con correo confirmado; no participantes; una aura por persona, combate y peleador, reversible; máximo 20 al día; comentario denunciable hasta 500 caracteres. Se conserva la decisión de un clic y no se adelanta premium.

Títulos: autonómico 20, nacional 50, internacional 80 puntos declarados. Se toma el mayor aporte de **un único título** en cada disciplina/nivel/división/peso históricos. Documentación comprobada añade 25 % (redondeo hacia abajo), entrenador u organizador acreditado 50 %, federación acreditada 100 %. El respaldo superior sustituye el anterior. Por resultado de combate respaldado: documento 1, entrenador/organizador 2, federación 3; máximo 40 puntos de respaldos de combates por categoría. La comunidad suma un punto por voto elegible. No hay puntuación deportiva tipo Elo en esta fase; se requiere estudiar datos suficientes antes de presentarla.

El filtro de 90 días afecta a los votos recibidos, manteniendo trayectoria y respaldos históricos; las categorías históricas no cambian al editar la ficha. Cancelaciones, suspensiones y eventos futuros se excluyen de las consultas. Fichas provisionales/ocultas no entran. Las verificaciones antiguas y la confirmación del rival no reciben automáticamente nuevas bonificaciones: no se inventa un documento ni un aval federativo.

## Seguridad

- Validación en el servidor de todo lo que escribe el usuario: longitudes (`LIMITS`), fechas, provincias, resultado y método frente a la disciplina, y enlaces (solo `http`/`https`). Nada de claves heredadas de objetos (`safe.ts`). Enlaces de retorno solo a rutas internas (`paths.ts`).
- Cabeceras (`next.config.mjs`): política de contenido (solo contenido propio; sin incrustación ni formularios hacia fuera), `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` y HSTS (en producción); sin `X-Powered-By`.
- Autorización: las guardas están en un solo sitio (`lib/accounts/permissions.ts` y `auth.ts`: `requireUser`, `requireVerifiedUser`, `requireOrganizer`, `requireAdmin`) y las usan por igual las acciones y las pantallas; cuando deniegan, la persona termina en una pantalla que explica por qué (y, sin sesión, vuelve a donde iba tras entrar). Las de organizador comprueban además que la velada es suya y las de peleador que participa en el combate. `tests/unit/autorizacion.test.ts` ejecuta cada acción con cada rol y exige que toda acción exportada esté clasificada.
- **Entrada hostil:** `src/middleware.ts` limpia la dirección antes de que llegue a ninguna pantalla (un valor por parámetro, sin `constructor` —rompe el objeto `searchParams` de Next.js— y sin caracteres nulos), y `str()` limpia los campos de formulario.
- **Decisiones que dependen de un estado** (confirmar, verificar, aprobar): se escriben con `updateMany` condicionado al estado que vio quien decide, y si no encuentra nada la decisión se descarta con un aviso (`combate_cambiado`, `solicitud_cambiada`). La confirmación del rival lleva la huella del resultado que vio (`boutVersion`).
- Sin protección CSRF adicional más allá de la de Next.js para Server Actions (origen del mismo sitio) y la cookie `sameSite=lax`.

## Interfaz y accesibilidad

El estilo aprobado y la accesibilidad se conservan en `globals.css`. El nuevo menú usa `dialog.showModal()`, foco nativo, Escape y enlaces agrupados; las acciones se pasan como propiedades al componente compartido.
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

La demo pública vive en <https://ring-espana-demo.onrender.com/>, servicio Render enlazado a `claude/ring-espana-mvp` según `render.yaml`. El 3 de octubre se integró #11 (commit funcional `7580902d63f4deec42c41f1cb29c5b913e009451`), con el mismo árbol que la propuesta validada. El arranque aplica migraciones aditivas y conserva los datos de una base existente; los datos ficticios solo se cargan en una base vacía. Se comprobaron públicamente portada/ránking/ayuda y `/salud` tras la actualización.

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

### Niveles de respaldo de un combate — vigente desde el 3 de octubre de 2026

| Respaldo | Cómo se concede | Participación |
|---|---|---|
| Declarado | El deportista cuenta el hecho; no puede autoasignarse una verificación | Válida desde el primer día, identificada como declaración |
| Confirmado por rival | Confirmación voluntaria; su discrepancia solo abre un aviso | Opcional, sin bonus nuevo |
| Documentación comprobada | Moderación anota fuente y qué demuestra | Opcional |
| Entrenador/organizador acreditado | Cuenta acreditada para esa disciplina revisa el hecho concreto | Opcional |
| Federación acreditada | Igual comprobación concreta, con mayor bonus | Opcional |

El rol de organizador conserva sus permisos del cartel; no equivale a una acreditación para conceder bonus. Los avales externos pueden revisarse manualmente por moderación aunque sus representantes no tengan cuenta. No se concede respaldo propio, fuera de disciplina ni con acreditación retirada. Un perfil visual de federación tampoco concede permisos.

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
- Los datos suspendidos por moderación dejan de contar hasta resolverse (`DISPUTED`). Una reclamación del rival no impone esa suspensión.

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

## Trayectoria y acreditación opcional — implementación del 3 de octubre de 2026

Migración aditiva `20261003160000_trayectoria_respaldo_aura`: `FighterAchievement`, `SupportAccreditation`, enums de ámbito y respaldo, y metadatos de respaldo en `Bout`. Se conservan perfiles, votos, resultados y categorías existentes. Los antiguos `DISPUTED` se mantienen para revisión: no hay información suficiente para restaurar indiscriminadamente todas las suspensiones históricas.

- `/mi-ficha/trayectoria`: declarar/corregir/retirar y deshacer retirada, fuente opcional, solicitar revisión. Máximo 30 declaraciones; unicidad por peleador/campeonato/entidad/año/categoría normalizados. El ámbito no elude la unicidad. Retirados/excluidos no cuentan ni se recrean como duplicados. Títulos desde 1920 hasta el día actual; el reglamento de la división debe ser válido en la fecha histórica o quedar sin confirmar.
- `/respaldar`: moderación o cuentas acreditadas; fuentes/notas obligatorias para el respaldo y motivo para excluir/restaurar. Búsqueda por campeonato o velada, 100 resultados por consulta, solicitudes primero. El entrenador no excluye ni restaura declaraciones rechazadas, no rebaja un respaldo superior y solo verifica sus disciplinas. Moderación puede revisar fuentes externas y decisiones motivadas.
- `/moderacion/acreditaciones`: comprobar identidad/representación y disciplinas, conceder, retirar y reactivar. Una acreditación usada conserva su identidad. La retirada o eliminación de su cuenta elimina sus bonus, sin borrar la trayectoria declarada.
- Versiones comparadas al escribir, bloqueo de la ficha para límites y duplicados y bloqueo de la acreditación durante revisión. Un cambio simultáneo no sobreescribe datos ni permite respaldar después de una retirada.
- Corregir un título, cambiar el resultado/fuente de un combate o nombre/fecha de la velada invalida el respaldo anterior. Nueva solicitud de fuente conserva el respaldo previo hasta la decisión. Fuente y alcance son públicos; notas y motivos son privados para revisión.
- Exportación incluye trayectoria/acreditación propias. Eliminación/anonimización retira los títulos y sus datos personales del historial; revoca y limpia la acreditación. No se exponen correos o notas de comprobación en fichas públicas.

La escala es una configuración inicial, pendiente de calibración con uso real. La honestidad declarada es una decisión expresa del fundador; no se presenta como verificación oficial. La política de menores y las pruebas con personas siguen siendo los pendientes anteriores.

## Navegación por actividades — 3 de octubre de 2026

Referencia: captura del menú de Raunder aportada por el fundador; no una comprobación de sus funciones. `NavigationMenu` conserva los cinco enlaces rápidos de escritorio y añade un panel lateral en móvil/escritorio: deportistas, clubes/entrenadores, promotores, cuenta/ayuda. Cada grupo tiene hasta cinco enlaces reales. Cuenta/moderación/respaldos dependen de sesión y permisos; cerrar sesión funciona dentro del panel. Escape, devolución del foco, bloqueo del fondo y cierre al navegar. Se preservan portada, fotos, banners y paleta de ChatGPT Work; no se añaden promesas de sparring, aprendizaje o reservas.

## Pulido de colas y decisiones — 3 de octubre de 2026

Colas de moderación, títulos/resultados, acreditaciones e historial usan ventanas de 50 con recuento total, desempate estable y parámetros independientes. Las búsquedas y páginas se conservan al decidir. `returnTo` solo admite la propia pantalla; `go` transporta sección en consulta, reemplaza mensajes antiguos y no mezcla un fragmento con la búsqueda. La respuesta se enfoca y permite retomar la sección validada por ruta.

La verificación básica de moderación no concede bonus de respaldo. Su formulario lleva la huella del resultado, comprobada antes de escribir y en la condición de actualización. Resolver avisos reserva el estado OPEN dentro de la transacción antes de modificar el dato. Editar evidencia exige conservar estado, resultado, fuente y fecha de respaldo leídos. Opciones desconocidas se rechazan explícitamente. La cola de respaldo usa el grado efectivo y muestra categoría histórica; obtiene la última solicitud de cada título con SQL parametrizado, sin mezclar límites de otros historiales.

No hay migración ni cambios de política de aura. Pendientes vigentes y diseño provisional: PULIDO-FUNCIONAL. Un diseño publicado no se considera definitivo cuando el fundador lo ha rechazado expresamente.

Las guardas `requireVerifiedUser(next?)` y `requireSupportActor(next?)` admiten el destino de una página protegida. `/respaldar` lo indica explícitamente; las acciones conservan sus llamadas y permisos. La ruta de vuelta sigue validada por `loginPath`/`internalPath`, sin sustituir las comprobaciones de sesión, correo ni acreditación.


## Infraestructura prevista para la fase 0 (6 de octubre de 2026, propuesta pendiente de aprobación)
Detalle, costes y fuentes en [ADR-003](decisiones/ADR-003-proveedores-fase-0.md). Resumen: **base de datos** Neon (PostgreSQL estándar, Fráncfort) con `DATABASE_URL` agrupada y `DIRECT_URL` para migraciones, más copia nocturna `pg_dump` a un cubo de R2; **web** Render (Starter al abrir); **imágenes** Cloudflare R2 en jurisdicción UE detrás de una interfaz `ImageStore` (drivers `db` y `s3`), servidas por la propia aplicación para ocultar al instante lo que modere un moderador; **correo** Resend (ya integrado en `src/lib/common/mail.ts`) con dominio propio; **errores** Sentry (UE) con filtro de datos personales; **vigilancia** UptimeRobot sobre `/salud`. Criterio: coste inicial ≈ 0, estándares abiertos y cambio de proveedor sin reescribir.

**Cambios técnicos ya hechos hoy:** la ruta de imágenes (`src/app/imagenes/[kind]/[id]/[slot]/route.ts`) comprueba antes la visibilidad, lee solo la versión (`updatedAt`) y responde 304 con ETag si la persona ya tiene la imagen; `Cache-Control: private, no-cache`. `OrganizerRequest` gana `kind` (`PROMOTORA`|`FEDERACION`) y `website`. El aterrizaje por papel vive en `src/lib/accounts/landing.ts`.
