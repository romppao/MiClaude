-- Solicitudes de clases a los entrenadores (petición del fundador, 8 de octubre de 2026). Solo añade una tabla y un tipo: no toca datos.
-- CreateEnum
CREATE TYPE "ClassRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED');

-- CreateTable
CREATE TABLE "ClassRequest" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preferred" TEXT NOT NULL,
    "message" TEXT,
    "phone" TEXT,
    "status" "ClassRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reply" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answeredAt" TIMESTAMP(3),

    CONSTRAINT "ClassRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClassRequest_classId_status_idx" ON "ClassRequest"("classId", "status");

-- CreateIndex
CREATE INDEX "ClassRequest_userId_createdAt_idx" ON "ClassRequest"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "ClassRequest" ADD CONSTRAINT "ClassRequest_classId_fkey" FOREIGN KEY ("classId") REFERENCES "TrainingClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassRequest" ADD CONSTRAINT "ClassRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

