# Ring España — instrucciones para Claude

Aplicación web para la comunidad boxística española (amateur primero, Madrid como plaza inicial). Stack: Next.js 15, TypeScript 5, PostgreSQL, Prisma. Contexto y decisiones en `docs/ARQUITECTURA.md`.

## Documentación obligatoria (petición expresa del fundador)

Todo el proceso se documenta para poder contarlo y retomarlo en el futuro. **Al terminar cada bloque de trabajo, antes de dar la sesión por cerrada:**

1. Añadir una entrada **al final** de `docs/DIARIO.md` con la plantilla que trae (qué se pidió, qué se decidió y por qué, qué se hizo, qué salió mal, estado y próximos pasos). No reescribir entradas anteriores.
2. Actualizar `docs/IDEAS.md`: ideas nuevas (con su origen: quién y cuándo las planteó), cambios de estado, ideas descartadas y por qué.
3. Añadir a `docs/LECCIONES.md` cada error o callejón sin salida con su causa real y la regla resultante.
4. Si cambia el estado técnico (modelo de datos, roles, flujos, riesgos), actualizar `docs/ARQUITECTURA.md`.

Recoger con las palabras del fundador las ideas y decisiones importantes. Ser honesto con lo que salió mal: el valor de estos documentos es que sean fiables.

## Reglas del fundador

- Ver contenido es público; votar, registrar récords y publicar exige cuenta (y email verificado).
- Prioridad: arquitectura y estructura. **No trabajar diseño gráfico** hasta que lo pida.
- Los datos de ejemplo del seed son ficticios: nunca inventar récords de personas reales.

## Comandos

- `npm run typecheck` · `npm test` · `npm run test:e2e` (ver README) · `npx prisma db push` · `npm run db:seed`
- Hay que fijar TypeScript en 5.x (Next 15 no es compatible con 7).
