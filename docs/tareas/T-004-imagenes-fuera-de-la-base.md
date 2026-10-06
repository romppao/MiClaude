# T-004 — Imágenes fuera de PostgreSQL
**Fase:** F2 · **Estado:** lista (parte 1) / bloqueada (parte 2: proveedor y credenciales, decisión del fundador) · **Sugerida a:** Codex / Open Code · **Depende de:** —

## Objetivo
Que las fotos y banners de perfil no engorden la base de datos ni la ralenticen: guardarlas en un almacenamiento de objetos con CDN, manteniendo la base de datos solo con la referencia.

## Contexto
Hoy `Profile.avatar` y `Profile.banner` son `Bytes` en PostgreSQL (`prisma/schema.prisma`, modelo `Profile`; indicadores `hasAvatar`/`hasBanner`). Se sirven por `src/app/imagenes/[kind]/[id]/[slot]/route.ts`. El procesado (formato real, 4 MB, 25 Mpx, sin metadatos, WebP) está en `src/lib/profiles/images.ts` y se **conserva**. Las acciones de subida y borrado están en `src/app/actions/profiles.ts`. La exportación de cuenta (`src/app/mi-cuenta/datos/route.ts`) incluye las imágenes. Anonimizar un peleador retira su personalización (`src/lib/fighters/anonymize.ts`).

## Pasos — parte 1 (sin proveedor): abstracción
1. Rama `<asistente>/T-004-imagenes`.
2. `src/lib/profiles/imageStore.ts`: interfaz `ImageStore { put(key, bytes, contentType): Promise<void>; get(key): Promise<{ bytes: Buffer; contentType: string } | null>; delete(key): Promise<void> }` y `getImageStore()` que lee `IMAGE_STORE` (`db` por defecto | `s3`).
3. `dbImageStore.ts`: implementa la interfaz con las columnas actuales (comportamiento idéntico al de hoy).
4. Refactoriza `actions/profiles.ts`, la ruta de `imagenes`, `mi-cuenta/datos/route.ts` y `anonymize.ts` para usar la interfaz, **sin cambiar comportamiento**.
5. Migración **aditiva** `prisma/migrations/<fecha>_imagenes_clave`: añade `avatarKey String?` y `bannerKey String?` a `Profile`. No borres columnas.
6. Ruta de imágenes: respuestas con `Cache-Control: public, max-age=31536000, immutable` cuando la URL lleve un parámetro de versión (`?v=<updatedAt en ms>`), y `ETag`; mantener la comprobación de visibilidad (no servir imágenes de fichas ocultas: en ese caso `private, no-store`). Actualiza donde se construye la URL para añadir `?v=`.
7. Pruebas unitarias con un `ImageStore` falso (put/get/delete, borrado al anonimizar, exportación). `tests/e2e/perfiles.mjs` sigue en verde.

## Pasos — parte 2 (bloqueada hasta que el fundador elija proveedor): almacenamiento de objetos
8. `s3ImageStore.ts` con cliente compatible S3 (Cloudflare R2, Backblaze B2, AWS S3…): variables `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_PUBLIC_BASE` (CDN) en `.env.example`, `src/lib/common/env.ts` y la documentación. Claves tipo `perfiles/<kind>/<id>/<slot>.webp`.
9. `scripts/migrar-imagenes.mjs`: copia lo que hay en la base al almacén, rellena `avatarKey`/`bannerKey` y **no borra** los bytes hasta que el fundador lo confirme (segunda pasada `--vaciar`). Idempotente.
10. Prueba de integración con un servidor S3 local (MinIO) **solo si el entorno lo permite**; si no, déjalo descrito.

## Criterios de aceptación
- Con `IMAGE_STORE=db` todo se comporta exactamente igual (`perfiles.mjs` verde).
- Subir, sustituir, quitar, anonimizar y exportar usan la interfaz; no queda ninguna lectura directa de `avatar`/`banner` fuera de `dbImageStore`.
- Las imágenes se sirven con caché larga y versión en la URL; las de fichas ocultas no.
- Migración aditiva y reversible a mano; sin pérdida de datos.

## No hacer
No cambiar límites ni procesado de imagen. No subir credenciales al repositorio. No vaciar la base sin confirmación.

## Documentar
`ARQUITECTURA.md` (almacenamiento), `PLAN.md` (estado), `.env.example`, `DIARIO.md`, `LECCIONES.md`, tu registro.
