# Ring España

Comunidad y base de datos de los **deportes de contacto de toda España**: boxeo, jiu-jitsu, K-1, kickboxing, MMA y Muay Thai,
amateur y profesional. Fichas de peleadores con su récord, calendario de veladas, gimnasios,
entrenadores, búsqueda y **aura** (el reconocimiento del público, que sustituye a las estrellas).

**[Abrir la demo actualizada](https://ring-espana-demo.onrender.com/)** — versión de prueba con datos ficticios.

**Stack:** Next.js 15 (App Router, Server Actions, TypeScript 5) · PostgreSQL 16 · Prisma 6 · sin otras dependencias de ejecución.

> **¿Retomas el proyecto en otro ordenador o con Claude Code?** Empieza por [`docs/TRASLADO.md`](docs/TRASLADO.md): puesta en marcha paso a paso, estado, lo que falta y las decisiones pendientes.

## Puesta en marcha

Requisitos: Node 22, PostgreSQL 16 y `psql` (las pruebas lo usan para nombrar a un moderador).

```bash
npm ci
cp .env.example .env         # ajusta DATABASE_URL (ver «Variables de entorno»)
npm run db:migrate            # crea las tablas (aplica las migraciones de prisma/migrations)
npm run db:seed              # datos FICTICIOS de demostración (solo en una base local y vacía)
npm run dev                  # http://localhost:3000
```

Si no tienes PostgreSQL: `docker run --name ring-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16`
y `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"`.

### Base de datos y migraciones

El esquema evoluciona con **migraciones** (`prisma/migrations`): `npm run db:migrate` las aplica y el CI comprueba que reproducen exactamente `schema.prisma`.
Para cambiar el esquema: edita `prisma/schema.prisma`, ejecuta `npx prisma migrate dev --name descripcion_del_cambio` (genera la migración) y súbela al repositorio.
Una base de datos creada antes con `db push` se «adopta» una sola vez con `npx prisma migrate resolve --applied 20260930000000_inicial`.
`npm run db:push` sigue existiendo, pero solo para pruebas desechables.

## Variables de entorno

Todas están explicadas en [`.env.example`](.env.example).

| Variable | Cuándo | Para qué |
|---|---|---|
| `DATABASE_URL` | siempre | Base de datos PostgreSQL |
| `APP_URL` | producción (sin ella el servidor **no arranca**) | Dirección pública; se usa en los enlaces de los correos |
| `RESEND_API_KEY` y `MAIL_FROM` | producción | Envío real de correo con Resend |
| `MAIL_TRANSPORT=log` | desarrollo y pruebas | Escribe los correos en el log del servidor (los enlaces llevan tokens: no usar en producción) |
| `CONTACT_EMAIL` y `RESPONSABLE_NOMBRE` | producción | Contacto y responsable que aparecen en `/privacidad` |
| `SEED_CONFIRMAR=si` | solo si de verdad quieres cargar el seed en una base con datos | El seed **borra** fichas, combates y veladas |

Para una base PostgreSQL gestionada con conexiones limitadas (entornos serverless), usa el *pooler* del proveedor en `DATABASE_URL`
(con `?pgbouncer=true&connection_limit=1` en PgBouncer) y, si ejecutas migraciones, una conexión directa aparte.

## Pruebas

```bash
npm run typecheck    # tipos
npm test             # unitarias (vitest): reglas, fechas, contraseñas, correo, búsqueda…
npm run test:e2e     # navegador real: flujo, integridad, acceso, cuenta, búsqueda y usabilidad
npm run test:a11y    # accesibilidad (axe-core, WCAG 2.2 AA) sobre todas las pantallas
```

Las pruebas de navegador necesitan el servidor de producción en marcha y Chromium:

```bash
npm run build
APP_URL=http://localhost:3111 MAIL_TRANSPORT=log npx next start -p 3111 > /tmp/next.log 2>&1 &
export DATABASE_URL=... MAIL_LOG=/tmp/next.log CHROMIUM_PATH=/ruta/a/chromium   # CHROMIUM_PATH es opcional
npm run test:e2e
```

`MAIL_LOG` es el fichero donde se redirige la salida del servidor: las pruebas leen de ahí los enlaces de los correos.
`.github/workflows/ci.yml` hace todo esto (con un PostgreSQL de servicio y las migraciones) en cada push y pull request.
`test:a11y` también se ejecuta en el CI: debe dar 0 incumplimientos graves o críticos en todas las pantallas.

## Qué incluye

- **Cuentas** (`/registro`, `/entrar`, `/recuperar`): aficionado o peleador; correo verificado para publicar; recuperación de contraseña; límite de intentos.
- **Mi cuenta** (`/mi-cuenta`): corregir datos, cambiar la contraseña, avisos por correo, **descargar una copia de los datos** y **eliminar la cuenta**.
- **Mi ficha** (`/mi-ficha`): el peleador crea y corrige su ficha (varias disciplinas, récord de partida declarado), registra combates y confirma o rechaza los que su rival declara.
- **Verificación de combates**: autodeclarado → confirmado por el rival → verificado por organizador o moderador; los rechazados no cuentan y no se muestran como hechos.
- **Aura**: una por persona y combate, con comentario opcional (denunciable) y «lo vi en directo». **Ránking** (`/ranking`) por disciplina y categoría de peso.
- **Veladas, gimnasios y entrenadores** con búsqueda sin tildes y listados paginados; **búsqueda global** (`/buscar`).
- **Organizadores** (`/organizador`): crean veladas, montan el cartel y ponen resultados verificados. **Moderación** (`/moderacion`): cola de combates, avisos, reclamaciones, organizadores y sello de gimnasios, con historial de cambios.
- **Privacidad** (`/privacidad`), baja de avisos desde el correo (`/baja`), `/salud`, `robots.txt` y mapa del sitio.

## Documentación

| Documento | Para qué |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | Reglas del fundador y del proyecto (las lee Claude Code al empezar) |
| [`docs/README.md`](docs/README.md) | Índice de toda la documentación: qué abrir según lo que quieras hacer |
| [`docs/DESARROLLO.md`](docs/DESARROLLO.md) | **Guía de desarrollo**: estructura, reglas de organización, recetas («cómo hago X»), convenciones y definición de «terminado» |
| [`docs/MAPA-FUNCIONAL.md`](docs/MAPA-FUNCIONAL.md) | Pantallas → acciones → permisos → tablas (generado con `npm run mapa`) |
| [`docs/TRASLADO.md`](docs/TRASLADO.md) | **Cómo retomar el proyecto**: puesta en marcha, estado, pendientes y decisiones |
| [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md) | Estado técnico, modelo de datos, seguridad, riesgos y hoja de ruta |
| [`docs/AUDITORIA.md`](docs/AUDITORIA.md) | Los 99 hallazgos de la auditoría, con su estado |
| [`docs/DIARIO.md`](docs/DIARIO.md) | Cómo hemos llegado hasta aquí, sesión a sesión |
| [`docs/IDEAS.md`](docs/IDEAS.md) · [`docs/LECCIONES.md`](docs/LECCIONES.md) | Ideas y su estado · errores y reglas resultantes |
| [`docs/COMPETENCIA.md`](docs/COMPETENCIA.md) | Análisis de la competencia (incompleto, a rellenar con acceso a internet) |

> Los datos del seed son inventados. Cualquier dato real debe proceder de los propios interesados, organizadores o federaciones.
