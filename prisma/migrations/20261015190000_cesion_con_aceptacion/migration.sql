-- CreateTable
CREATE TABLE "GymTransferInvitation" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "status" "ClassRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "answeredAt" TIMESTAMP(3),

    CONSTRAINT "GymTransferInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GymTransferInvitation_tokenHash_key" ON "GymTransferInvitation"("tokenHash");

-- CreateIndex
CREATE INDEX "GymTransferInvitation_gymId_status_idx" ON "GymTransferInvitation"("gymId", "status");

-- CreateIndex
CREATE INDEX "GymTransferInvitation_senderId_idx" ON "GymTransferInvitation"("senderId");

-- CreateIndex
CREATE INDEX "GymTransferInvitation_recipientEmail_status_idx" ON "GymTransferInvitation"("recipientEmail", "status");

-- AddForeignKey
ALTER TABLE "GymTransferInvitation" ADD CONSTRAINT "GymTransferInvitation_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GymTransferInvitation" ADD CONSTRAINT "GymTransferInvitation_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

