# Ring España

Base de datos y comunidad del boxeo español (profesional y amateur), inspirada en BoxRec:
perfiles de boxeadores con récord, calendario de veladas, gimnasios, entrenadores y búsqueda.

**Stack:** Next.js 15 (App Router, TypeScript) + PostgreSQL + Prisma.

## Arranque

```bash
npm install
cp .env.example .env        # ajusta DATABASE_URL
npm run db:push             # crea las tablas
npm run db:seed             # datos FICTICIOS de demostración
npm run dev                 # http://localhost:3000
```

## Enfoque

Amateur primero y Madrid como plaza inicial. El boxeador amateur gestiona su ficha y récord, el público valora
las actuaciones y el calendario descubre veladas. Decisiones, roles, riesgos y hoja de ruta: [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md).

## Qué incluye

- **Cuentas** (`/registro`, `/entrar`): aficionado (`FAN`) o peleador (`FIGHTER`). Para crear un administrador, cambia `role` a `ADMIN` en la tabla `User`.
- **Verificación de email**: obligatoria para publicar. En desarrollo el enlace aparece en el log del servidor (`[mail] …`).
- **Reclamar ficha** y **Organizadores** (`/organizador`): solicitudes que aprueba un moderador; los organizadores crean veladas, montan el cartel y ponen resultados verificados.
- **Mi ficha** (`/mi-ficha`): el peleador crea su ficha amateur, registra combates y confirma o disputa los que su rival declara.
- **Aura**: cada aficionado puede dar aura a un peleador **por combate** (una por persona, combate y peleador), con comentario opcional y «lo vi en directo».
- **Ránking** (`/ranking`): por aura, dentro de cada disciplina (boxeo por defecto) y categoría de peso, con zona (Madrid por defecto) y periodo.
- **Disciplinas**: boxeo, MMA, kickboxing, K-1 y jiu-jitsu. Una ficha por persona con varias disciplinas y **récord de partida** declarado para quien ya había competido.
- **Moderación** (`/admin`): verificar o rechazar combates autodeclarados.
- `/peleadores` — búsqueda y filtros (nombre/alias, nivel, provincia, disciplina y categoría de peso) y ficha con el récord por disciplina calculado desde los combates.
- `/veladas` — calendario de próximas/pasadas, filtro por nivel (pro/amateur), provincia y texto; detalle con cartel y resultados.
- `/gimnasios`, `/entrenadores` — listados, fichas y sus peleadores.
- `/buscar` — búsqueda global.

## Modelo de datos

`Boxer`, `Gym`, `Trainer`, `Event` (velada, nivel PRO/AMATEUR), `Bout` (combate con resultado y método).
El récord no se guarda: se calcula a partir de los `Bout` (`src/lib/record.ts`), por nivel.

## Hoja de ruta

Ver [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md#hoja-de-ruta) (lo hecho, lo siguiente y los riesgos abiertos).

> Los datos del seed son inventados. Cualquier dato real debe proceder de los propios interesados, promotores o federaciones.

## Tests

```bash
npm run typecheck   # tipos
npm test            # unitarios (récord, ránking bayesiano, slugs, contraseñas)
npm run test:e2e    # flujo completo en navegador (ver cabecera de tests/e2e/flujo.mjs)
```

El e2e necesita el servidor en marcha (`npm run build && npm start`) con `MAIL_LOG` apuntando al fichero donde se redirige su salida
(los enlaces de verificación se leen del log de correo) y `DATABASE_URL` para promover un usuario a administrador.
`.github/workflows/ci.yml` ejecuta todo esto en cada push y pull request.
