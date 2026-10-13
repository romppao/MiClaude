-- CreateEnum
CREATE TYPE "AppErrorStatus" AS ENUM ('OPEN', 'INVESTIGATING', 'RESOLVED', 'IGNORED');

-- CreateTable
CREATE TABLE "AppError" (
    "id" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "path" TEXT,
    "digest" TEXT,
    "role" TEXT,
    "count" INTEGER NOT NULL DEFAULT 1,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "AppErrorStatus" NOT NULL DEFAULT 'OPEN',
    "note" TEXT,
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "AppError_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AppError_fingerprint_key" ON "AppError"("fingerprint");

-- CreateIndex
CREATE INDEX "AppError_status_lastSeenAt_idx" ON "AppError"("status", "lastSeenAt");

-- CreateIndex
CREATE INDEX "AppError_lastSeenAt_idx" ON "AppError"("lastSeenAt");
