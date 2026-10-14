ALTER TABLE "User" ADD COLUMN "province" TEXT;
ALTER TABLE "Fighter" ADD COLUMN "availableToFight" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "currentWeightKg" DECIMAL(5,2), ADD COLUMN "availableSince" TIMESTAMP(3);
CREATE INDEX "Fighter_availableToFight_availableSince_idx" ON "Fighter"("availableToFight", "availableSince");
CREATE TABLE "EventAttendance" (
  "userId" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EventAttendance_pkey" PRIMARY KEY ("userId", "eventId"),
  CONSTRAINT "EventAttendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "EventAttendance_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "EventAttendance_eventId_idx" ON "EventAttendance"("eventId");
