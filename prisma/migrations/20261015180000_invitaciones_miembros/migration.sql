-- CreateTable
CREATE TABLE "GymMemberInvitation" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "fighterId" TEXT,
    "trainerId" TEXT,
    "previousGymId" TEXT,
    "status" "ClassRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "answeredAt" TIMESTAMP(3),

    CONSTRAINT "GymMemberInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GymMemberInvitation_gymId_status_idx" ON "GymMemberInvitation"("gymId", "status");

-- CreateIndex
CREATE INDEX "GymMemberInvitation_recipientId_status_idx" ON "GymMemberInvitation"("recipientId", "status");

-- CreateIndex
CREATE INDEX "GymMemberInvitation_senderId_idx" ON "GymMemberInvitation"("senderId");

-- CreateIndex
CREATE INDEX "GymMemberInvitation_fighterId_idx" ON "GymMemberInvitation"("fighterId");

-- CreateIndex
CREATE INDEX "GymMemberInvitation_trainerId_idx" ON "GymMemberInvitation"("trainerId");

-- AddForeignKey
ALTER TABLE "GymMemberInvitation" ADD CONSTRAINT "GymMemberInvitation_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GymMemberInvitation" ADD CONSTRAINT "GymMemberInvitation_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GymMemberInvitation" ADD CONSTRAINT "GymMemberInvitation_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GymMemberInvitation" ADD CONSTRAINT "GymMemberInvitation_fighterId_fkey" FOREIGN KEY ("fighterId") REFERENCES "Fighter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GymMemberInvitation" ADD CONSTRAINT "GymMemberInvitation_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Trainer"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Cada invitación apunta a una sola ficha real.
ALTER TABLE "GymMemberInvitation" ADD CONSTRAINT "GymMemberInvitation_one_member" CHECK (("fighterId" IS NOT NULL)::int + ("trainerId" IS NOT NULL)::int = 1);
