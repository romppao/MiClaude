-- CreateEnum
CREATE TYPE "InvitationKind" AS ENUM ('EVENT', 'SPARRING', 'TRAIN');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'WITHDRAWN', 'EXPIRED');

-- AlterTable
ALTER TABLE "Fighter" ADD COLUMN     "acceptsInvitations" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "contactChannel" TEXT NOT NULL DEFAULT 'EMAIL',
ADD COLUMN     "contactInstagram" TEXT,
ADD COLUMN     "contactPhone" TEXT;

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "kind" "InvitationKind" NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "eventId" TEXT,
    "onBehalfOfId" TEXT,
    "discipline" "Discipline",
    "message" TEXT,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "reply" TEXT,
    "contactShared" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "answeredAt" TIMESTAMP(3),

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Invitation_toId_status_idx" ON "Invitation"("toId", "status");

-- CreateIndex
CREATE INDEX "Invitation_fromUserId_createdAt_idx" ON "Invitation"("fromUserId", "createdAt");

-- CreateIndex
CREATE INDEX "Invitation_eventId_idx" ON "Invitation"("eventId");

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_toId_fkey" FOREIGN KEY ("toId") REFERENCES "Fighter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_onBehalfOfId_fkey" FOREIGN KEY ("onBehalfOfId") REFERENCES "Fighter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
