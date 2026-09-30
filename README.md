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

- **Cuentas** (`/registro`, `/entrar`): aficionado (`FAN`) o boxeador (`BOXER`). Para crear un administrador, cambia `role` a `ADMIN` en la tabla `User`.
- **Mi ficha** (`/mi-ficha`): el boxeador crea su ficha amateur, registra combates y confirma o disputa los que su rival declara.
- **Valoraciones**: cada aficionado puntúa (1–5, comentario, «lo vi en directo») a un boxeador **por combate**; una nota por usuario/combate.
- **Ránking** (`/ranking`): media bayesiana por provincia (Madrid por defecto).
- **Moderación** (`/admin`): verificar o rechazar combates autodeclarados.
- `/boxeadores` — búsqueda y filtros (nombre/alias, nivel, provincia, peso) y ficha con récord pro y amateur calculado desde los combates.
- `/veladas` — calendario de próximas/pasadas, filtro por nivel (pro/amateur), provincia y texto; detalle con cartel y resultados.
- `/gimnasios`, `/entrenadores` — listados, fichas y sus boxeadores.
- `/buscar` — búsqueda global.

## Modelo de datos

`Boxer`, `Gym`, `Trainer`, `Event` (velada, nivel PRO/AMATEUR), `Bout` (combate con resultado y método).
El récord no se guarda: se calcula a partir de los `Bout` (`src/lib/record.ts`), por nivel.

## Hoja de ruta

1. **Fase 2 – Cuentas y contribución:** registro/login, reclamar perfil de boxeador, altas de veladas y combates por promotores/gimnasios.
2. **Fase 3 – Moderación y confianza:** cola de revisión, verificación por federación/promotor, historial de cambios.
3. **Fase 4 – Comunidad:** fotos/vídeos, noticias, seguir boxeadores, avisos de veladas, ránking, mapas de gimnasios.
4. **Fase 5 – Escala:** SEO/sitemaps, API pública, app móvil, importación de datos federativos.

> Los datos del seed son inventados. Cualquier dato real debe proceder de los propios interesados, promotores o federaciones.
