-- Tipo de entidad (promotora o federación) y web o redes en la solicitud de organizador. Cambio aditivo: las solicitudes existentes quedan como «PROMOTORA».
ALTER TABLE "OrganizerRequest" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'PROMOTORA',
ADD COLUMN "website" TEXT;
