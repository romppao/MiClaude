-- Noticias del panorama español (petición del fundador, 8 de octubre de 2026): fuentes que solo cubren España. Solo añade una columna.
ALTER TABLE "NewsSource" ADD COLUMN "local" BOOLEAN NOT NULL DEFAULT false;
