# Traslado del proyecto a Claude Code (en tu ordenador)

Guía para retomar Ring España fuera de la sesión de la aplicación móvil, con Claude Code instalado en tu ordenador.
Está escrita para que la pueda seguir una persona y también para que la lea Claude Code al empezar.
Se redactó el **30 de septiembre de 2026**, con el último commit de código `5303086` (después vienen los de documentación de este traslado).

## 1. Dónde está todo

- **Repositorio:** <https://github.com/romppao/MiClaude>
- **Rama de trabajo:** `claude/ring-espana-mvp` (no hay otra; **nunca se ha abierto una *pull request*** porque no se pidió). Todo el trabajo está subido a esa rama.
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
npx prisma db push              # crea las tablas
npm run db:seed                 # datos FICTICIOS (solo si la base está vacía)
npm run dev                     # http://localhost:3000
```

Sin PostgreSQL instalado: `docker run --name ring-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16`.

Comprobar que todo está sano (debe dar 0 errores, 103 pruebas unitarias y 146 comprobaciones de navegador):

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

**Producto (todo implementado y probado):** cuentas con correo verificado y recuperación de contraseña; ficha de peleador con varias disciplinas y récord de partida; registro de combates con confirmación del rival; niveles de respaldo (autodeclarado → confirmado → verificado, y rechazado); aura (una por persona y combate) y ránking por disciplina y categoría; veladas, cartel y resultados por organizadores; moderación con cola de combates, avisos, reclamaciones y sello de gimnasios; historial de cambios; búsqueda sin tildes; listados paginados; cuenta con descarga y eliminación de datos; privacidad y baja de avisos.

**Auditoría de código** (`docs/AUDITORIA.md`): 99 hallazgos — **49 corregidos, 18 parciales, 27 pendientes, 2 a decidir por el fundador y 3 descartados con motivo**. Los bloques 1 a 4 están completos; el 5 está a medias.
Verificación: **96 de los 99** pasaron una verificación adversarial con tres comprobadores. Se refutaron 5: el 81, el 83 y el 90 por ser falsos o exagerados, y el 91 y el 92 porque, al comprobarlos, ya estaban corregidos. Los **97, 98 y 99** no se pudieron verificar (se acabó el límite de uso de la sesión dos veces); comprueba que el problema existe antes de corregirlos. La pasada final de «huecos» tampoco llegó a ejecutarse. `AUDITORIA.md` indica el estado de esta verificación.

**Pruebas (todas en el CI):** 266 unitarias (`tests/unit`: reglas, seguridad, autorización de cada acción, mensajes, dependencias entre carpetas…), 193 comprobaciones de navegador en seis guiones (`tests/e2e/flujo`, `integridad`, `acceso`, `cuenta`, `busqueda`, `usabilidad`, con ayudas comunes en `ayudas.mjs`) y la medición de accesibilidad `test:a11y` (axe-core, WCAG 2.2 AA, 0 incumplimientos).

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

Prioridad del fundador: **funcionalidad completa y sin fallos; el diseño, después.**

1. **Terminar las pruebas por personas** (guion en [`pruebas/personas.md`](pruebas/personas.md)): se ejecutó la persona «visitante» y se lanzó una segunda tanda (aficionado, peleador, rival, organizador, moderadora); faltan **seguridad, móvil y teclado, persona mayor y exploración destructiva**, y los revisores de código que no llegaron a ejecutarse (pruebas, documentos, datos y privacidad). Cada hallazgo se reproduce, se corrige con su prueba y se anota en [`pruebas/hallazgos-2026-10-01.md`](pruebas/hallazgos-2026-10-01.md) (o en un fichero nuevo por fecha).
2. **Mejoras ya identificadas y no hechas:** colas de moderación con paginación real (hallazgo 50); alinear `@types/node` con Node 22 y añadir *lint* al CI (hallazgo 82); comprobar los hallazgos 97, 98 y 99 de la auditoría, que no se verificaron, y la pasada de «huecos», que no llegó a ejecutarse.
3. **Antes de publicar:** elegir alojamiento y desplegar (la base de datos gestionada y el proveedor de correo Resend necesitan cuentas del fundador); definir `APP_URL`, `CONTACT_EMAIL`, `RESPONSABLE_NOMBRE` y **`TRUSTED_PROXY_HOPS`** (cuántos proxies hay delante: si está mal, los límites por IP no protegen o bloquean a todos); revisión jurídica del texto de privacidad y política de menores (sección 7).
4. **Probar con personas reales de distintas edades**, incluida gente mayor (regla 11 del principio fundacional): no lo puede hacer una IA.
5. **Análisis de la competencia** (sección 8) cuando haya acceso a internet.
6. **Después de la estructura básica (decisión del fundador):** funciones premium (hasta tres clics de aura, herramientas para organizadores…), **sin vender nunca verificación, sello ni posición en el ránking**; y la **fase de diseño visual**, que el fundador pide al final: empezar por un *briefing* con él (ver `CLAUDE.md`), varias direcciones distintas, diseñador humano para la marca y decisiones en `docs/DISENO.md` (se crea entonces). El favicon y la imagen para compartir son diseño y entran en esa fase.

## 7. Decisiones que necesitan al fundador

1. **Aura:** ¿una por persona y combate, o por persona, combate **y peleador**? Hoy vale la segunda (en un combate se puede dar aura a los dos). Hallazgo 41.
2. **Tuteo o «usted»:** hoy la aplicación tutea. Conviene decidirlo y mantenerlo en toda la app.
3. **Récord de partida:** ¿se puede editar después del primer combate registrado, o lo revisa un moderador? ¿Se descuenta lo registrado en la app? Hallazgo 36.
4. **Menores de edad:** el amateur incluye juveniles. Falta una política (edad mínima, consentimiento de madre, padre o tutor, qué se muestra de su ficha). **Es lo más importante antes de abrir al público** y necesita criterio jurídico.
5. **Texto de privacidad:** lo redactó la IA a partir de lo que la aplicación hace de verdad; **debe revisarlo una persona con conocimientos jurídicos** antes de publicarse. Faltan el responsable del tratamiento y el correo de contacto (`RESPONSABLE_NOMBRE` y `CONTACT_EMAIL`).
6. **Veladas de cualquier usuario:** hoy cualquier usuario verificado publica veladas sin moderación previa (llevan distintivo de organizador oficial solo si lo son). ¿Se modera antes de publicar? Hallazgo 22.
7. **Registro y privacidad de los correos:** el formulario de registro dice «ya hay una cuenta con ese correo» (claro para la persona, pero revela quién tiene cuenta). Se limita por IP. ¿Se acepta ese riesgo?
8. **Aura:** ¿se normaliza por número de combates o se pondera (lo vi en directo, antigüedad)? Hoy es el total absoluto.
9. **Categorías de peso:** son orientativas; validarlas con las federaciones.
10. **Nombre de la marca** («Ring España» encaja peor ahora que hay MMA, K-1…) y **si el código también debe ir en español** (supone un renombrado grande).
11. **Alojamiento y correo:** dónde se despliega, cuenta de Resend y dominio para los correos.
12. **Personas para probar la usabilidad** (edades y familiaridad con la tecnología).
13. **Correo de contacto y responsable** (`CONTACT_EMAIL`, `RESPONSABLE_NOMBRE`): hoy, sin ellos, la privacidad no ofrece ningún medio de contacto a quien no tiene cuenta. Hay que decidir cuál es.
14. **Carteles oficiales y fichas provisionales:** cuando un organizador añade a un cartel una ficha que creó otra persona al registrar un combate, esa ficha pasa a ser pública con nombre completo (hoy se acepta porque un cartel de una velada es público). Revisión pendiente: ¿debe confirmar antes la persona afectada?
15. **Ocultar una ficha** (moderación) borra sus datos personales de forma irreversible: hoy exige anotar el motivo y solo vale para fichas sin titular. ¿Debe existir una forma de restaurarla durante unos días?

## 8. Pendiente que solo se puede hacer con acceso a internet

**Análisis de la competencia** (Raunder, raunder.es, y BoxRec, boxrec.com): la sesión anterior no pudo abrir ninguna de las dos webs (política de red del entorno). `docs/COMPETENCIA.md` es honesto sobre ello y distingue «Comprobado» de «Sin comprobar». Con Claude Code en tu ordenador se puede hacer de verdad: ver en qué fallan, qué hacen bien y qué ideas nuevas salen, y pasarlas a `docs/IDEAS.md`. Regla del fundador: **no se afirma nada que no se haya podido comprobar.**

## 9. Cómo se documenta (petición expresa del fundador)

Al terminar cada bloque de trabajo: entrada nueva **al final** de `docs/DIARIO.md` (antes de la plantilla; sin reescribir las anteriores), actualizar `docs/IDEAS.md` (con el origen de cada idea), añadir a `docs/LECCIONES.md` cada error con su causa real y su regla, y actualizar `docs/ARQUITECTURA.md` si cambia el estado técnico. Sé honesto con lo que salió mal: el valor de esos documentos es que sean fiables.
