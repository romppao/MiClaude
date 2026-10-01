-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Level" AS ENUM ('PRO', 'AMATEUR');

-- CreateEnum
CREATE TYPE "Stance" AS ENUM ('ORTODOXO', 'ZURDO', 'AMBIDIESTRO');

-- CreateEnum
CREATE TYPE "Result" AS ENUM ('A_WIN', 'B_WIN', 'DRAW', 'NO_CONTEST');

-- CreateEnum
CREATE TYPE "Method" AS ENUM ('KO', 'TKO', 'UD', 'SD', 'MD', 'RTD', 'DQ', 'DRAW', 'SUBMISSION', 'POINTS', 'ADVANTAGE', 'NC');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('FAN', 'FIGHTER', 'ORGANIZER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Verification" AS ENUM ('SELF_REPORTED', 'CONFIRMED', 'VERIFIED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "Discipline" AS ENUM ('BOXEO', 'MMA', 'KICKBOXING', 'K1', 'JIUJITSU');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Gym" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "address" TEXT,
    "website" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verifiedNote" TEXT,

    CONSTRAINT "Gym_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trainer" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bio" TEXT,
    "gymId" TEXT,

    CONSTRAINT "Trainer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fighter" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "alias" TEXT,
    "birthDate" TIMESTAMP(3),
    "city" TEXT,
    "province" TEXT,
    "nationality" TEXT NOT NULL DEFAULT 'España',
    "stance" "Stance",
    "heightCm" INTEGER,
    "reachCm" INTEGER,
    "level" "Level" NOT NULL DEFAULT 'AMATEUR',
    "listed" BOOLEAN NOT NULL DEFAULT true,
    "hiddenAt" TIMESTAMP(3),
    "bio" TEXT,
    "gymId" TEXT,
    "trainerId" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Fighter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "discipline" "Discipline" NOT NULL DEFAULT 'BOXEO',
    "level" "Level" NOT NULL,
    "venue" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "promoter" TEXT,
    "ticketUrl" TEXT,
    "status" "EventStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdById" TEXT,
    "organizerId" TEXT,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bout" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "fighterAId" TEXT NOT NULL,
    "fighterBId" TEXT NOT NULL,
    "weightClass" TEXT,
    "rounds" INTEGER,
    "result" "Result",
    "method" "Method",
    "endRound" INTEGER,
    "verification" "Verification" NOT NULL DEFAULT 'SELF_REPORTED',
    "createdById" TEXT,
    "flags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "evidenceUrl" TEXT,
    "pairKey" TEXT,

    CONSTRAINT "Bout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'FAN',
    "notifyEmails" BOOLEAN NOT NULL DEFAULT true,
    "emailVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Aura" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fighterId" TEXT NOT NULL,
    "boutId" TEXT NOT NULL,
    "comment" TEXT,
    "attended" BOOLEAN NOT NULL DEFAULT false,
    "hiddenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Aura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'VERIFY',
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fighterId" TEXT NOT NULL,
    "message" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClaimRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizerRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orgName" TEXT NOT NULL,
    "message" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizerRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "message" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolutionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Follow" (
    "userId" TEXT NOT NULL,
    "fighterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("userId","fighterId")
);

-- CreateTable
CREATE TABLE "FighterDiscipline" (
    "fighterId" TEXT NOT NULL,
    "discipline" "Discipline" NOT NULL,
    "level" "Level" NOT NULL DEFAULT 'AMATEUR',
    "weightClass" TEXT,
    "priorTotal" INTEGER,
    "priorWins" INTEGER,
    "priorLosses" INTEGER,
    "priorDraws" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FighterDiscipline_pkey" PRIMARY KEY ("fighterId","discipline")
);

-- CreateTable
CREATE TABLE "RateHit" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateHit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Gym_slug_key" ON "Gym"("slug");

-- CreateIndex
CREATE INDEX "Gym_province_idx" ON "Gym"("province");

-- CreateIndex
CREATE UNIQUE INDEX "Trainer_slug_key" ON "Trainer"("slug");

-- CreateIndex
CREATE INDEX "Trainer_gymId_idx" ON "Trainer"("gymId");

-- CreateIndex
CREATE UNIQUE INDEX "Fighter_slug_key" ON "Fighter"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Fighter_userId_key" ON "Fighter"("userId");

-- CreateIndex
CREATE INDEX "Fighter_gymId_idx" ON "Fighter"("gymId");

-- CreateIndex
CREATE INDEX "Fighter_trainerId_idx" ON "Fighter"("trainerId");

-- CreateIndex
CREATE INDEX "Fighter_listed_idx" ON "Fighter"("listed");

-- CreateIndex
CREATE INDEX "Fighter_lastName_firstName_idx" ON "Fighter"("lastName", "firstName");

-- CreateIndex
CREATE INDEX "Fighter_province_idx" ON "Fighter"("province");

-- CreateIndex
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");

-- CreateIndex
CREATE INDEX "Event_discipline_date_idx" ON "Event"("discipline", "date");

-- CreateIndex
CREATE INDEX "Event_organizerId_idx" ON "Event"("organizerId");

-- CreateIndex
CREATE INDEX "Event_date_idx" ON "Event"("date");

-- CreateIndex
CREATE INDEX "Event_level_date_idx" ON "Event"("level", "date");

-- CreateIndex
CREATE INDEX "Event_province_idx" ON "Event"("province");

-- CreateIndex
CREATE INDEX "Bout_createdById_idx" ON "Bout"("createdById");

-- CreateIndex
CREATE INDEX "Bout_eventId_idx" ON "Bout"("eventId");

-- CreateIndex
CREATE INDEX "Bout_fighterAId_idx" ON "Bout"("fighterAId");

-- CreateIndex
CREATE INDEX "Bout_fighterBId_idx" ON "Bout"("fighterBId");

-- CreateIndex
CREATE UNIQUE INDEX "Bout_eventId_pairKey_key" ON "Bout"("eventId", "pairKey");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE INDEX "Aura_fighterId_idx" ON "Aura"("fighterId");

-- CreateIndex
CREATE INDEX "Aura_boutId_idx" ON "Aura"("boutId");

-- CreateIndex
CREATE UNIQUE INDEX "Aura_userId_boutId_fighterId_key" ON "Aura"("userId", "boutId", "fighterId");

-- CreateIndex
CREATE INDEX "EmailToken_userId_kind_idx" ON "EmailToken"("userId", "kind");

-- CreateIndex
CREATE INDEX "EmailToken_expiresAt_idx" ON "EmailToken"("expiresAt");

-- CreateIndex
CREATE INDEX "ClaimRequest_status_idx" ON "ClaimRequest"("status");

-- CreateIndex
CREATE INDEX "ClaimRequest_fighterId_idx" ON "ClaimRequest"("fighterId");

-- CreateIndex
CREATE UNIQUE INDEX "ClaimRequest_userId_fighterId_key" ON "ClaimRequest"("userId", "fighterId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizerRequest_userId_key" ON "OrganizerRequest"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "Report_status_createdAt_idx" ON "Report"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Report_entity_entityId_idx" ON "Report"("entity", "entityId");

-- CreateIndex
CREATE INDEX "Report_userId_idx" ON "Report"("userId");

-- CreateIndex
CREATE INDEX "Follow_fighterId_idx" ON "Follow"("fighterId");

-- CreateIndex
CREATE INDEX "FighterDiscipline_discipline_weightClass_idx" ON "FighterDiscipline"("discipline", "weightClass");

-- CreateIndex
CREATE INDEX "RateHit_key_createdAt_idx" ON "RateHit"("key", "createdAt");

-- CreateIndex
CREATE INDEX "RateHit_createdAt_idx" ON "RateHit"("createdAt");

-- AddForeignKey
ALTER TABLE "Trainer" ADD CONSTRAINT "Trainer_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fighter" ADD CONSTRAINT "Fighter_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fighter" ADD CONSTRAINT "Fighter_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Trainer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fighter" ADD CONSTRAINT "Fighter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bout" ADD CONSTRAINT "Bout_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bout" ADD CONSTRAINT "Bout_fighterAId_fkey" FOREIGN KEY ("fighterAId") REFERENCES "Fighter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bout" ADD CONSTRAINT "Bout_fighterBId_fkey" FOREIGN KEY ("fighterBId") REFERENCES "Fighter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bout" ADD CONSTRAINT "Bout_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aura" ADD CONSTRAINT "Aura_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aura" ADD CONSTRAINT "Aura_fighterId_fkey" FOREIGN KEY ("fighterId") REFERENCES "Fighter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aura" ADD CONSTRAINT "Aura_boutId_fkey" FOREIGN KEY ("boutId") REFERENCES "Bout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailToken" ADD CONSTRAINT "EmailToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimRequest" ADD CONSTRAINT "ClaimRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimRequest" ADD CONSTRAINT "ClaimRequest_fighterId_fkey" FOREIGN KEY ("fighterId") REFERENCES "Fighter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizerRequest" ADD CONSTRAINT "OrganizerRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_fighterId_fkey" FOREIGN KEY ("fighterId") REFERENCES "Fighter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FighterDiscipline" ADD CONSTRAINT "FighterDiscipline_fighterId_fkey" FOREIGN KEY ("fighterId") REFERENCES "Fighter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

