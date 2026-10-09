-- Plazas por categoría en la inscripción de veladas e interclubs (9 de octubre de 2026). Solo añade una tabla.
-- CreateTable
CREATE TABLE "EventSlot" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "divisionId" TEXT NOT NULL DEFAULT '',
    "weightClass" TEXT NOT NULL,
    "places" INTEGER NOT NULL,

    CONSTRAINT "EventSlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventSlot_eventId_divisionId_weightClass_key" ON "EventSlot"("eventId", "divisionId", "weightClass");

-- AddForeignKey
ALTER TABLE "EventSlot" ADD CONSTRAINT "EventSlot_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
