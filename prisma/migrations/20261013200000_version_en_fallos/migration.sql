-- Versión de la aplicación en la que apareció cada fallo (docs/VERSIONES.md).
ALTER TABLE "AppError" ADD COLUMN "firstVersion" TEXT,
ADD COLUMN "version" TEXT;
