-- Fotos fuera de la base de datos (T-004, parte 2): clave de cada foto en el almacén de fotos (lib/media/fotos.ts).
-- Aditiva: no borra las columnas de bytes, que se siguen leyendo para las fotos aún no trasladadas.

-- AlterTable
ALTER TABLE "Highlight" ADD COLUMN     "imageKey" TEXT;

-- AlterTable
ALTER TABLE "MediaItem" ADD COLUMN     "imageKey" TEXT;

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "avatarKey" TEXT,
ADD COLUMN     "bannerKey" TEXT;
