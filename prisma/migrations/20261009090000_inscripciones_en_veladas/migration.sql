-- Inscripción de peleadores en veladas e interclubs (9 de octubre de 2026). Solo añade: los eventos existentes quedan con la inscripción cerrada.
-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'WITHDRAWN');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "registrationNote" TEXT,
ADD COLUMN     "registrationOpen" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "registrationUntil" DATE;

-- CreateTable
CREATE TABLE "EventRegistration" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "fighterId" TEXT NOT NULL,
    "divisionId" TEXT,
    "weightClass" TEXT,
    "weightKg" DOUBLE PRECISION,
    "message" TEXT,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "reply" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answeredAt" TIMESTAMP(3),

    CONSTRAINT "EventRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventRegistration_eventId_status_idx" ON "EventRegistration"("eventId", "status");

-- CreateIndex
CREATE INDEX "EventRegistration_fighterId_createdAt_idx" ON "EventRegistration"("fighterId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EventRegistration_eventId_fighterId_key" ON "EventRegistration"("eventId", "fighterId");

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_fighterId_fkey" FOREIGN KEY ("fighterId") REFERENCES "Fighter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

