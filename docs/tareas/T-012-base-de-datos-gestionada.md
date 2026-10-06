# T-012 — Base de datos gestionada, copias y restauración
**Nivel:** N2 (ver [`../RANGOS.md`](../RANGOS.md): quién puede tomarla)  
**Fase:** F2 · **Estado:** bloqueada (el fundador debe elegir proveedor) · **Sugerida a:** fundador + Claude · **Depende de:** decisión de alojamiento

## Objetivo
Que los datos **no se pierdan ni colapsen** al crecer: base de datos PostgreSQL gestionada, con copias automáticas, restauración **probada**, conexiones controladas y vigilancia.

## Criterios para elegir proveedor (a decidir por el fundador; Claude recomienda con estos criterios)
Región **UE**; copias automáticas con recuperación a un instante (PITR) y retención ≥ 7 días; **pooling de conexiones** (PgBouncer) o soporte para ello; escalado vertical sin migrar; réplica de lectura disponible; precio previsible; PostgreSQL ≥ 16; extensión `pg_trgm` permitida (T-006); cumplimiento RGPD (contrato de encargado del tratamiento).

## Pasos (cuando haya proveedor)
1. Crear la base y el usuario de la aplicación con permisos mínimos; **dos cadenas**: `DATABASE_URL` (por el pooler, para la aplicación) y `DIRECT_URL` (conexión directa, para migraciones). Añadir `directUrl = env("DIRECT_URL")` a `datasource` en `prisma/schema.prisma` y a la documentación.
2. Límite de conexiones por instancia: `?connection_limit=<n>&pool_timeout=10` (n = conexiones máximas del plan ÷ instancias, con margen); documentar la fórmula.
3. Copias: comprobar que están activas; **simulacro de restauración** (restaurar una copia en una base nueva y ejecutar `npm run test:e2e` contra ella) y dejarlo escrito en `docs/OPERACION.md` con fecha y duración. Repetir cada trimestre.
4. Migraciones en producción: `prisma migrate deploy` en el despliegue, siempre aditivas; plan de vuelta atrás (copia previa) para migraciones con riesgo.
5. Alertas: espacio en disco > 80 %, conexiones > 80 % del límite, consultas lentas, latencia; ver T-010.
6. Pool y rendimiento: confirmar con T-007 que el límite de conexiones no es el primer cuello.

## Criterios de aceptación
Copias activas y restauración probada y documentada; conexiones limitadas y medidas; alertas definidas; `OPERACION.md` al día.

## No hacer
Nunca subir credenciales al repositorio. No cargar datos de ejemplo en producción (`prisma/seed.ts` se niega, y es correcto).

## Documentar
`docs/OPERACION.md`, `ARQUITECTURA.md`, `PLAN.md`, `TRASLADO.md` §7 (decisión tomada), `DIARIO.md`.
