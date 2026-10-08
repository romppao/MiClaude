-- Retos de combate y sparring entre peleadores, y día y franja horaria en las solicitudes de clase (8 de octubre de 2026). Solo añade: no toca datos.
-- CreateEnum
CREATE TYPE "ProposalKind" AS ENUM ('FIGHT', 'SPARRING');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED');

-- AlterTable
ALTER TABLE "ClassRequest" ADD COLUMN     "day" DATE,
ADD COLUMN     "fromMinute" INTEGER,
ADD COLUMN     "toMinute" INTEGER;

-- CreateTable
CREATE TABLE "FightProposal" (
    "id" TEXT NOT NULL,
    "kind" "ProposalKind" NOT NULL,
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "discipline" "Discipline" NOT NULL,
    "day" DATE,
    "place" TEXT,
    "message" TEXT,
    "status" "ProposalStatus" NOT NULL DEFAULT 'PENDING',
    "reply" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answeredAt" TIMESTAMP(3),

    CONSTRAINT "FightProposal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FightProposal_toId_status_idx" ON "FightProposal"("toId", "status");

-- CreateIndex
CREATE INDEX "FightProposal_fromId_createdAt_idx" ON "FightProposal"("fromId", "createdAt");

-- AddForeignKey
ALTER TABLE "FightProposal" ADD CONSTRAINT "FightProposal_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "Fighter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FightProposal" ADD CONSTRAINT "FightProposal_toId_fkey" FOREIGN KEY ("toId") REFERENCES "Fighter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

