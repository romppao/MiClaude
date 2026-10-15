-- CreateEnum
CREATE TYPE "GymSource" AS ENUM ('OSM', 'MANUAL', 'FEDERACION', 'PROPIETARIO');

-- CreateEnum
CREATE TYPE "GymStatus" AS ENUM ('PUBLISHED', 'PENDING', 'REMOVED');

-- CreateEnum
CREATE TYPE "GymClaimStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CONFLICT');

-- AlterTable
ALTER TABLE "Gym" ADD COLUMN     "claimedAt" TIMESTAMP(3),
ADD COLUMN     "disciplines" "Discipline"[] DEFAULT ARRAY[]::"Discipline"[],
ADD COLUMN     "email" TEXT,
ADD COLUMN     "importedAt" TIMESTAMP(3),
ADD COLUMN     "instagram" TEXT,
ADD COLUMN     "isFictional" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ownerUserId" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "reviewNote" TEXT,
ADD COLUMN     "source" "GymSource" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "sourceLicense" TEXT,
ADD COLUMN     "sourceRef" TEXT,
ADD COLUMN     "status" "GymStatus" NOT NULL DEFAULT 'PUBLISHED';

-- CreateTable
CREATE TABLE "GymClaimRequest" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "evidence" TEXT NOT NULL,
    "evidenceUrl" TEXT,
    "status" "GymClaimStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,

    CONSTRAINT "GymClaimRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GymClaimRequest_status_createdAt_idx" ON "GymClaimRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "GymClaimRequest_gymId_userId_idx" ON "GymClaimRequest"("gymId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Gym_sourceRef_key" ON "Gym"("sourceRef");

-- CreateIndex
CREATE INDEX "Gym_status_idx" ON "Gym"("status");

-- CreateIndex
CREATE INDEX "Gym_ownerUserId_idx" ON "Gym"("ownerUserId");

-- AddForeignKey
ALTER TABLE "Gym" ADD CONSTRAINT "Gym_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GymClaimRequest" ADD CONSTRAINT "GymClaimRequest_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GymClaimRequest" ADD CONSTRAINT "GymClaimRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GymClaimRequest" ADD CONSTRAINT "GymClaimRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Preserva titulares visuales de gimnasios asignados por moderación antes de D.
UPDATE "Gym" g SET "ownerUserId" = p."ownerId", "source" = 'PROPIETARIO', "claimedAt" = p."updatedAt"
FROM "Profile" p WHERE p.kind = 'gimnasio' AND p."entityId" = g.id AND p."ownerId" IS NOT NULL;
-- Identifica solo los tres nombres exactos del seed histórico, sin tocar gimnasios importados o reclamados.
UPDATE "Gym" SET "isFictional" = true WHERE "ownerUserId" IS NULL AND "sourceRef" IS NULL
AND (name, city, province) IN (('Gimnasio Demo Norte','Bilbao','Bizkaia'),('Club Demo Vallecas','Madrid','Madrid'),('Boxing Demo Sevilla','Sevilla','Sevilla'));
