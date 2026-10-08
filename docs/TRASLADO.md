# Traslado del proyecto a Claude Code (en tu ordenador)

> **Relevo al portátil (6 de octubre de 2026): empieza por [RELEVO-PORTATIL.md](RELEVO-PORTATIL.md)** — comprobaciones, cuentas que crear (Neon, Cloudflare R2, Sentry, UptimeRobot, dominio, Resend), orden de trabajo y qué no hacer sin el fundador. Herramientas aprobadas: [ADR-003](decisiones/ADR-003-proveedores-fase-0.md). Pruebas de ingreso para los demás asistentes: [PRUEBA-DE-INGRESO.md](PRUEBA-DE-INGRESO.md) y [PRUEBA-ESCALERA.md](PRUEBA-ESCALERA.md).

> **Relevo vigente (3 de octubre de 2026):** empezar por [PULIDO-FUNCIONAL.md](PULIDO-FUNCIONAL.md) y el cierre de [APORTACIONES-CODEX.md](APORTACIONES-CODEX.md). El fundador considera la composición actual desorganizada y saturada; el diseño es provisional y se retoma al final. No iniciar otro rediseño ni integrar automáticamente la propuesta móvil #13.

Guía para retomar Ring España fuera de la sesión de la aplicación móvil, con Claude Code instalado en tu ordenador.
Está escrita para que la pueda seguir una persona y también para que la lea Claude Code al empezar.
Redacción original: **30 de septiembre de 2026**. El estado se actualiza con los bloques posteriores; el cierre de APORTACIONES-CODEX identifica los commits y las comprobaciones vigentes.

## 1. Dónde está todo

- **Repositorio:** <https://github.com/romppao/MiClaude>
- **Rama de trabajo:** `claude/ring-espana-mvp`, fuente del despliegue de Render. Los cambios se comprueban en ramas aisladas y pull requests antes de integrar; #13 sigue abierta.
- **Integración continua:** GitHub Actions (`.github/workflows/ci.yml`): tipos, pruebas unitarias, compilación y pruebas de navegador con un PostgreSQL de servicio. En el momento del traslado, los últimos commits verificados estaban en verde.
- **Lo que NO viaja con el repositorio:** la base de datos de pruebas del entorno anterior (era desechable; el `seed` crea datos ficticios de demostración), el fichero `.env` (se crea de nuevo) y la transcripción de la conversación. Lo importante de esa conversación está en `docs/DIARIO.md`, `docs/LECCIONES.md` y en este documento.

## 2. Puesta en marcha en tu ordenador

Requisitos: **Git, Node 22, PostgreSQL 16 (con `psql`)** y, para las pruebas de navegador, Chromium (`npx playwright-core install chromium`).

```bash
git clone https://github.com/romppao/MiClaude.git
cd MiClaude
git checkout claude/ring-espana-mvp
npm ci
cp .env.example .env            # edita DATABASE_URL (y deja APP_URL y MAIL_TRANSPORT=log para trabajar en local)
npx prisma migrate deploy       # aplica las migraciones existentes
npm run db:seed                 # datos FICTICIOS (solo si la base está vacía)
npm run dev                     # http://localhost:3000
```

Sin PostgreSQL instalado: `docker run --name ring-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16`.

Comprobar tipos, unitarias, build y recorridos con base de pruebas. Las cifras actuales y la medición de accesibilidad están en el cierre de APORTACIONES-CODEX:

```bash
npm run typecheck && npm test
npm run build
APP_URL=http://localhost:3111 MAIL_TRANSPORT=log npx next start -p 3111 > /tmp/next.log 2>&1 &
DATABASE_URL="tu-url" MAIL_LOG=/tmp/next.log npm run test:e2e
```

Más detalle (variables de entorno, pruebas, rutas) en el [`README.md`](../README.md).

## 3. Cómo empezar la primera sesión con Claude Code

Abre Claude Code dentro de la carpeta del proyecto (`cd MiClaude && claude`). Claude Code lee `CLAUDE.md` automáticamente al empezar: ahí están las reglas del fundador.
Un primer mensaje útil:

> Lee `CLAUDE.md`, `docs/TRASLADO.md` y la última entrada de `docs/DIARIO.md`. Comprueba que el proyecto arranca y que pasan las pruebas.
> Después continúa con el siguiente bloque pendiente (sección 6 de `docs/TRASLADO.md`). Al terminar cada bloque, documenta como indica `CLAUDE.md`.

### Reglas globales del fundador (cópialas a `~/.claude/CLAUDE.md` de tu ordenador)

En la sesión anterior estaban también en el fichero global de instrucciones del usuario, que **no** viaja con el repositorio
(las del proyecto, en `CLAUDE.md`, sí). Si quieres que valgan para cualquier aplicación que desarrolles, pega esto en `~/.claude/CLAUDE.md`:

```markdown
# Principio del fundador para TODA aplicación que desarrollemos

Las aplicaciones deben ser **muy intuitivas para cualquier persona** (niños, jóvenes, adultos y personas mayores, con cualquier nivel tecnológico) y entenderse sin ayuda. Botones claros y de color, enlaces e información fáciles de encontrar, lenguaje llano y sin jerga, mensajes que confirman cada acción y errores que explican cómo arreglarlos, accesibilidad (contraste, tamaños, teclado, móvil). **Siempre con tono serio y profesional**: nada vulgar ni coloquial. Se prueba con personas reales de distintas edades. Distinguir usabilidad (se aplica siempre) de diseño visual (consultar al fundador antes de cambios notables de estilo).

# Diseño visual (regla del fundador, para toda aplicación)

El diseño gráfico/visual se hace **al final**, cuando lo pida el fundador. Al fundador **no le gustan los diseños que genera Claude** (siempre iguales, mismos colores y patrones) y no quiere que sus aplicaciones se asocien con una IA. Al llegar ese momento: empezar por un briefing con referencias suyas, ofrecer varias direcciones claramente distintas, evitar los tics genéricos (degradados morado/índigo, tipografía por defecto, tarjetas redondeadas idénticas, hero + 3 tarjetas, glassmorphism), buscar identidad propia justificada por escrito, recomendar un diseñador humano para la marca y documentar las decisiones. Hasta entonces, la interfaz es provisional y no se pule.
```

## 4. Estado del proyecto

**Producto actual:** cuentas, recuperación, perfiles con foto/banner, carreras multidisciplina, categorías de edad/sexo versionadas, combates, veladas, búsqueda, comunidad, exportación/eliminación y moderación. #14 está integrada y visible en Render: trayectoria histórica, respaldos opcionales y acreditaciones separadas de perfiles. El rival pide revisión sin suspender automáticamente. Aura = trayectoria + respaldo + comunidad por categoría histórica; el récord permanece separado.

**Pulido en esta continuación:** paginación de colas/historial, contexto tras acciones, categoría y respaldo efectivo en revisión, decisiones concurrentes y opciones desconocidas. No cambia diseño, escala o esquema. Estado y pendientes vigentes: [PULIDO-FUNCIONAL.md](PULIDO-FUNCIONAL.md). La interfaz actual es provisional por la última petición expresa del fundador; no retomar ahora otro rediseño.

**Continuación del 6 de octubre de 2026 (noche):** CI en verde hasta `490cfd2`. Hecho por Claude: registro por tres paneles (T-011, con migración aditiva `OrganizerRequest.kind`/`website`, aterrizaje por papel y perfil de federación al aprobar), arreglo de la auditoría móvil (paginación y enlaces de tabla a 44 px), aportes del PR #13 (barra móvil con iconos), PRs de Dependabot cerrados y sin saltos mayores, imágenes con ETag/304 y la prueba de ingreso rehecha (T-005 y T-013). Propuesta de proveedores de coste casi cero en [ADR-003](decisiones/ADR-003-proveedores-fase-0.md) **pendiente de aprobación**. **Aviso: la base de datos gratuita de la demo en Render caduca a los 30 días de crearse (14 de gracia) y luego se borra: migrarla (T-012).**

**Auditoría histórica:** el cuadro de 99 hallazgos se ha revalidado donde existían estados obsoletos; los parciales y decisiones siguen abiertos. Consultar [AUDITORIA.md](AUDITORIA.md), no asumir que sus citas antiguas de fichero/línea siguen vigentes. Los defectos nuevos de este pulido están en PULIDO-FUNCIONAL.

**Validación:** #14 pasó CI #131 con 393 unitarias, 365 comprobaciones de navegador y axe sin incumplimientos. El pulido #15 y el retorno a respaldos #16 pasan CI final #142 con 406 unitarias, 395 comprobaciones de navegador (30 del guion nuevo de volumen/integridad/acceso) y axe en 37 pantallas sin incumplimientos; publicación y referencias exactas en APORTACIONES-CODEX. Una batería verde no sustituye a probar con personas ni resuelve los requisitos de producción.

**Organización del código (1 de octubre):** acciones en módulos por dominio, lógica en `src/lib/<dominio>`, reglas de dependencias comprobadas por prueba y un mapa funcional generado. Guía en [`DESARROLLO.md`](DESARROLLO.md); mapa en [`MAPA-FUNCIONAL.md`](MAPA-FUNCIONAL.md).

**Pruebas por personas y revisión de código (1 de octubre):** dos flujos de agentes que se cortaron por el límite de uso; los hallazgos disponibles (19 de la persona «visitante», 44 de tres revisores) están **corregidos o clasificados** en [`pruebas/hallazgos-2026-10-01.md`](pruebas/hallazgos-2026-10-01.md), que también cuenta qué quedó sin ejecutar.

## 5. Reglas técnicas que conviene no olvidar

- **TypeScript debe seguir en 5.x** (Next 15 no es compatible con la 7) y las importaciones son **relativas** (no hay alias `@/`).
- **Todo lo que se exporta de un módulo de `src/app/actions/` es un punto de entrada público (POST).** Los ayudantes van sin exportar o en `shared.ts`, y la lógica en `src/lib`. Un módulo de acciones no importa de otro (lo vigila `tests/unit/arquitectura.test.ts`).
- Los mensajes al usuario viajan como **códigos en la URL** (`?aviso=…` / `?problema=…`) y se traducen en `src/lib/common/messages.ts`. Las acciones usan `go()`, `guard()` (traduce errores de Prisma), `withLock()` (bloqueo consultivo) y `audit()`.
- **Nunca uses `in` ni `obj[clave]` con claves que vengan del usuario**: usa `hasOwn`/`lookup` de `src/lib/common/safe.ts`.
- **No uses `cache()` de React en `getUser`:** con acciones que cierran la sesión y redirigen, devolvería una sesión obsoleta en la misma petición.
- **Prisma se niega a ejecutar `db push --force-reset` cuando lo lanza una IA** (es una protección deliberada). No la sortees: ejecuta tú esos comandos destructivos. `--accept-data-loss` sin reinicio sí se usó, solo en la base local de pruebas.
- **Pruebas de navegador:** espera siempre a un estado visible (`seen(locator)`), no leas nada justo después de una acción, no uses `networkidle`, usa datos únicos por ejecución y **acota las consultas por nombre** (los listados están paginados y la base de pruebas crece).
- **Al reiniciar el servidor local**, comprueba que el arranque no termina en `EADDRINUSE`: un servidor antiguo sigue sirviendo la compilación vieja y las pruebas fallan de formas confusas. Mata el proceso `next-server`, no solo el envoltorio `npx`. Y no uses `pkill -f` con un patrón que aparezca en tu propia línea de comandos.
- **Fechas:** las veladas se guardan a las 12:00 UTC del día elegido; «ya celebrada» se decide con el día de Madrid (`lib/common/dates.ts`).
- Todo lo que ve una persona va **en español** («correo electrónico», no «email»); los identificadores del código, en inglés.

## 6. Lo que queda por hacer, en orden

Prioridad actual del fundador: pulir funciones y claridad; el diseño publicado le parece desorganizado y saturado y se reconsiderará al final. El orden vigente está en [PULIDO-FUNCIONAL.md](PULIDO-FUNCIONAL.md): carreras y catálogo deportivo; mantenimiento de entidades y carteles; errores/correos/conexiones/dispositivos reales; preparación del servicio real; integridad y rendimiento. Los guiones y pendientes de personas están en `pruebas/personas.md`.

La demo de Render está publicada; eso no implica servicio real preparado. Mantener datos ficticios y correo de demostración hasta configurar proveedor/dominio, responsable/contacto, copias y recuperación, y resolver menores/privacidad. El análisis comprobado de competencia ya está en COMPETENCIA; no figura como tarea sin empezar. Premium y rediseño permanecen al final de la fase básica.

## 7. Decisiones que necesitan al fundador

1. **Aura:** ¿una por persona y combate, o por persona, combate **y peleador**? Hoy vale la segunda (en un combate se puede dar aura a los dos). Hallazgo 41.
2. **Tuteo o «usted»:** hoy la aplicación tutea. Conviene decidirlo y mantenerlo en toda la app.
3. **Récord de partida:** ¿se puede editar después del primer combate registrado, o lo revisa un moderador? ¿Se descuenta lo registrado en la app? Hallazgo 36.
4. **Menores de edad — DECIDIDO EN PARTE (6 oct):** el alta de cuenta **no** pide fecha de nacimiento ni sexo y no se impide el uso a nadie por su edad; la fecha de nacimiento se pide solo al crear la **ficha** (para la categoría). Las limitaciones a menores se aplican **al final, después del diseño** (T-014). Falta decidir si la fecha de nacimiento será obligatoria en la ficha y los límites concretos (comentarios, fotos, aura de desconocidos). Mientras tanto, no abrir a menores reales. Contexto anterior: el amateur incluye juveniles. **Hay un borrador de política en el [ADR-003](decisiones/ADR-003-proveedores-fase-0.md)** (edad mínima 14 como parámetro, sin cuenta propia por debajo, perfiles de menores sin foto y con apellido abreviado) y la ficha [T-014](tareas/T-014-politica-de-menores.md). **Es lo más importante antes de abrir al público** y necesita criterio jurídico; faltan dos respuestas de producto del fundador (aura/comentarios de desconocidos a menores; fecha de nacimiento y sexo en el alta).
5. **Texto de privacidad:** lo redactó la IA a partir de lo que la aplicación hace de verdad; **debe revisarlo una persona con conocimientos jurídicos** antes de publicarse. Faltan el responsable del tratamiento y el correo de contacto (`RESPONSABLE_NOMBRE` y `CONTACT_EMAIL`).
6. **Veladas de cualquier usuario:** hoy cualquier usuario verificado publica veladas sin moderación previa (llevan distintivo de organizador oficial solo si lo son). ¿Se modera antes de publicar? Hallazgo 22.
7. **Registro y privacidad de los correos:** el formulario de registro dice «ya hay una cuenta con ese correo» (claro para la persona, pero revela quién tiene cuenta). Se limita por IP. ¿Se acepta ese riesgo?
8. **Aura:** ¿se normaliza por número de combates o se pondera (lo vi en directo, antigüedad)? Hoy es el total absoluto.
9. **Categorías de peso:** son orientativas; validarlas con las federaciones.
10. **Nombre de la marca** («Ring España» encaja peor ahora que hay MMA, K-1…) y **si el código también debe ir en español** (supone un renombrado grande).
11. **Alojamiento y correo — APROBADO el 6 de octubre:** [ADR-003](decisiones/ADR-003-proveedores-fase-0.md) (Neon, Render, Cloudflare R2, Resend, Sentry, UptimeRobot), con segunda verificación hecha. El fundador crea las cuentas gratuitas en su portátil siguiendo [`RELEVO-PORTATIL.md`](RELEVO-PORTATIL.md); **sin dominio propio (~7 €/año) no hay correos reales**.
12. **Personas para probar la usabilidad** (edades y familiaridad con la tecnología).
13. **Correo de contacto y responsable** (`CONTACT_EMAIL`, `RESPONSABLE_NOMBRE`): hoy, sin ellos, la privacidad no ofrece ningún medio de contacto a quien no tiene cuenta. Hay que decidir cuál es.
14. **Carteles oficiales y fichas provisionales:** cuando un organizador añade a un cartel una ficha que creó otra persona al registrar un combate, esa ficha pasa a ser pública con nombre completo (hoy se acepta porque un cartel de una velada es público). Revisión pendiente: ¿debe confirmar antes la persona afectada?
15. **Ocultar una ficha** (moderación) borra sus datos personales de forma irreversible: hoy exige anotar el motivo y solo vale para fichas sin titular. ¿Debe existir una forma de restaurarla durante unos días?
16. **Categorías deportivas:** la ficha ya guarda nacimiento y división versionada, separada de la del combate. Boxeo, IFMA y WAKO tienen sus categorías documentadas en `DISENO-PESOS.md`; siguen pendientes pesos IMMAF e IBJJF con cinturón/modalidad y reglas específicas. No volver a implementar categorías schoolboys como si no existieran.

## 8. Competencia

El análisis revisado y sus fuentes comprobadas están en [COMPETENCIA.md](COMPETENCIA.md). Las limitaciones de sesiones anteriores no describen el estado actual. Las hipótesis de usabilidad se mantienen como hipótesis hasta probarlas con personas; no afirmar nada que no se haya comprobado.

## 9. Cómo se documenta (petición expresa del fundador)

Al terminar cada bloque de trabajo: entrada nueva **al final** de `docs/DIARIO.md` (antes de la plantilla; sin reescribir las anteriores), actualizar `docs/IDEAS.md` (con el origen de cada idea), añadir a `docs/LECCIONES.md` cada error con su causa real y su regla, y actualizar `docs/ARQUITECTURA.md` si cambia el estado técnico. Sé honesto con lo que salió mal: el valor de esos documentos es que sean fiables.

17. **Principio de coste (6 de octubre de 2026):** «quiero utilizar el mínimo capital posible y que me funcione la aplicación […] herramientas gratuitas o de mínimo coste, muy top, fiables, escalables y **fáciles de modificar en un futuro**». Toda elección de proveedor se justifica por coste inicial, escalado y facilidad de cambio, y se registra en un ADR. Ver [ADR-003](decisiones/ADR-003-proveedores-fase-0.md).
18. **Nombres de los resultados amateur** (RSC, RSC-I, W/O…, propuestos por el diseño v3): decidido el 8 oct mantener por ahora la lista del repositorio y ocultar solo lo que no corresponde a cada disciplina. Falta confirmarlos con cada federación antes de ampliar el enum `Method`.
19. **Clases de entrenadores:** ¿reservas y cobro dentro de la aplicación? Hoy solo se muestran clase y precio (sin pagos). Afecta a costes, comisiones y obligaciones legales.
20. **Vídeos de highlights — HECHO (8 oct, fase 2a):** se suben de verdad (Cloudflare R2, aprobado en el ADR-003) o, si no hay almacén, por enlace. **Falta que el fundador cree el cubo de R2 y ponga sus claves en Render** siguiendo [`VIDEOS.md`](VIDEOS.md); hasta entonces la demo guarda los vídeos en su disco, que se borra en cada despliegue.
21. **Plantilla del club:** al aprobar un club, ¿se crea su gimnasio en el directorio y quién confirma a los peleadores que lo integran?
22. **Récord amateur privado** se aplicó también a las fichas que ya existían. Si el fundador prefiere respetar lo publicado antes, basta con una migración que marque `recordPublic` en las fichas anteriores al 8 de octubre.
23. **Fuentes de noticias de la portada (8 oct, fase 2a):** la portada común reúne titulares de canales de vídeo (UFC, ONE, GLORY), búsquedas de **Google Noticias** en español por disciplina (muchos medios distintos) y una de federaciones. Desde el entorno de desarrollo **no se pudo abrir ninguna fuente**: hay que mirar en `/moderacion/noticias` de la demo cuáles funcionan. **Riesgo a decidir:** las condiciones de uso de Google Noticias para un uso comercial; la alternativa es añadir uno a uno los canales RSS de cada medio y federación (se puede hacer desde esa misma página, sin tocar el código). ¿Qué medios y federaciones quiere el fundador?
24. **Vídeos y fotos del público (8 oct, fase 2a):** el texto de consentimiento (lo grabé yo, puedo compartirlo, los peleadores pueden descargarlo, permiso de la familia si aparecen menores) es una primera versión prudente: **debe revisarlo una persona con conocimientos jurídicos** (derecho de imagen, menores en veladas amateur) antes de abrir al público. ¿Se pide moderación previa antes de que se vea, o basta con los avisos y la retirada?
25. **Entrenadores organizadores (8 oct):** por decisión del fundador crean veladas e interclubs **sin aprobación previa**, a diferencia de promotoras, clubes y federaciones. Sus eventos no llevan el distintivo de «organizador verificado». ¿Debe un moderador revisarlos, o acreditarlos como a las entidades?
26. **Publicar en las tiendas (8 oct, [`PUBLICACION.md`](PUBLICACION.md)):** ¿a nombre de persona física o de una empresa (cambia lo que se muestra en la tienda y la prueba de 12 personas de Google)? ¿Qué se reserva a la app (propuesta: avisos y subida desde la cámara; **dar aura solo en la app**, a decidir)? ¿Cuándo se crean las cuentas de Apple (~99 €/año) y Google (25 $)? Nada de esto se ha contratado.

