-- Diseño móvil v3, fase 1 (8 oct 2026). Cambio aditivo: cuenta de entrenador (rol TRAINER y su perfil con clases),
-- récord amateur privado por defecto, highlights del peleador, disciplinas de interés del aficionado y lo elegido en el registro.

-- CreateEnum
CREATE TYPE "ClassKind" AS ENUM ('INDIVIDUAL', 'GROUP');

-- CreateEnum
CREATE TYPE "HighlightKind" AS ENUM ('VIDEO', 'PHOTO');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'TRAINER';

-- AlterTable
ALTER TABLE "Fighter" ADD COLUMN     "recordPublic" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Trainer" ADD COLUMN     "city" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "disciplines" "Discipline"[] DEFAULT ARRAY[]::"Discipline"[],
ADD COLUMN     "province" TEXT,
ADD COLUMN     "userId" TEXT,
ADD COLUMN     "yearsCoaching" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "interests" "Discipline"[] DEFAULT ARRAY[]::"Discipline"[],
ADD COLUMN     "onboarding" JSONB;

-- CreateTable
CREATE TABLE "TrainingClass" (
    "id" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "kind" "ClassKind" NOT NULL,
    "title" TEXT NOT NULL,
    "discipline" "Discipline",
    "minutes" INTEGER NOT NULL,
    "priceEuros" INTEGER NOT NULL,
    "capacity" INTEGER,
    "schedule" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TrainingClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Highlight" (
    "id" TEXT NOT NULL,
    "fighterId" TEXT NOT NULL,
    "kind" "HighlightKind" NOT NULL,
    "title" TEXT NOT NULL,
    "videoUrl" TEXT,
    "image" BYTEA,
    "hasImage" BOOLEAN NOT NULL DEFAULT false,
    "boutId" TEXT,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "hiddenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Highlight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrainingClass_trainerId_active_idx" ON "TrainingClass"("trainerId", "active");

-- CreateIndex
CREATE INDEX "Highlight_fighterId_hiddenAt_idx" ON "Highlight"("fighterId", "hiddenAt");

-- CreateIndex
CREATE UNIQUE INDEX "Trainer_userId_key" ON "Trainer"("userId");

-- AddForeignKey
ALTER TABLE "Trainer" ADD CONSTRAINT "Trainer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingClass" ADD CONSTRAINT "TrainingClass_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Trainer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Highlight" ADD CONSTRAINT "Highlight_fighterId_fkey" FOREIGN KEY ("fighterId") REFERENCES "Fighter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Highlight" ADD CONSTRAINT "Highlight_boutId_fkey" FOREIGN KEY ("boutId") REFERENCES "Bout"("id") ON DELETE SET NULL ON UPDATE CASCADE;
