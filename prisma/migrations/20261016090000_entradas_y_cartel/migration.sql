-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('PENDING_DEPOSIT', 'CONFIRMED', 'CHECKED_IN', 'CANCELLED', 'EXPIRED');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "bizumPhone" TEXT,
ADD COLUMN     "doorPriceEuros" INTEGER,
ADD COLUMN     "posterKey" TEXT,
ADD COLUMN     "posterAt" TIMESTAMP(3),
ADD COLUMN     "startMinute" INTEGER,
ADD COLUMN     "ticketCapacity" INTEGER,
ADD COLUMN     "ticketNote" TEXT,
ADD COLUMN     "ticketPriceEuros" INTEGER,
ADD COLUMN     "ticketsOpen" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "TicketReservation" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitEuros" INTEGER NOT NULL,
    "totalEuros" INTEGER NOT NULL,
    "depositEuros" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'PENDING_DEPOSIT',
    "depositUntil" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "checkedInAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelledBy" TEXT,

    CONSTRAINT "TicketReservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TicketReservation_code_key" ON "TicketReservation"("code");

-- CreateIndex
CREATE INDEX "TicketReservation_eventId_status_idx" ON "TicketReservation"("eventId", "status");

-- CreateIndex
CREATE INDEX "TicketReservation_userId_createdAt_idx" ON "TicketReservation"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "TicketReservation" ADD CONSTRAINT "TicketReservation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketReservation" ADD CONSTRAINT "TicketReservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- CreateTable
CREATE TABLE "EventPoster" (
    "eventId" TEXT NOT NULL,
    "bytes" BYTEA NOT NULL,

    CONSTRAINT "EventPoster_pkey" PRIMARY KEY ("eventId")
);

-- AddForeignKey
ALTER TABLE "EventPoster" ADD CONSTRAINT "EventPoster_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
