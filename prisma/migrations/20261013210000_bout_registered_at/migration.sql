-- Fecha de registro para aplicar el plazo de 24 horas a combates autodeclarados.
ALTER TABLE "Bout" ADD COLUMN "createdAt" TIMESTAMP(3);

-- Recupera la fecha original del historial cuando existe. Los datos antiguos sin historial se consideran anteriores al plazo.
UPDATE "Bout" AS bout
SET "createdAt" = (
  SELECT MIN(audit."createdAt")
  FROM "AuditLog" AS audit
  WHERE audit."entity" = 'BOUT'
    AND audit."entityId" = bout."id"
    AND audit."action" = 'CREATED'
);
UPDATE "Bout" SET "createdAt" = TIMESTAMP '1970-01-01 00:00:00' WHERE "createdAt" IS NULL;

ALTER TABLE "Bout" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Bout" ALTER COLUMN "createdAt" SET NOT NULL;
CREATE INDEX "Bout_createdAt_idx" ON "Bout"("createdAt");
