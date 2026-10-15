-- Cola de correos (T-008): cada correo se guarda antes de enviarse, con reintentos y límite diario. Ver src/lib/common/cola-correo.ts.

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('PENDING', 'SENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "EmailOutbox" (
    "id" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "replyTo" TEXT,
    "unsubscribeUrl" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "status" "EmailStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "EmailOutbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailOutbox_status_priority_nextAttemptAt_idx" ON "EmailOutbox"("status", "priority", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "EmailOutbox_sentAt_idx" ON "EmailOutbox"("sentAt");
