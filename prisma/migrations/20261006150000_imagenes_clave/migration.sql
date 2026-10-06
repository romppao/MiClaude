-- Aditiva: referencias a las imágenes en un almacén de objetos (T-004). No borra ni cambia nada existente.
ALTER TABLE "Profile" ADD COLUMN "avatarKey" TEXT,
ADD COLUMN "bannerKey" TEXT;
