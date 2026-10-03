-- CreateEnum
CREATE TYPE "SupportKind" AS ENUM ('DECLARED', 'DOCUMENT', 'TRAINER', 'ORGANIZER', 'FEDERATION');

-- CreateEnum
CREATE TYPE "AchievementScope" AS ENUM ('REGIONAL', 'NATIONAL', 'INTERNATIONAL');

-- AlterTable
ALTER TABLE "Bout" ADD COLUMN     "supportAccreditationId" TEXT,
ADD COLUMN     "supportAuthority" TEXT,
ADD COLUMN     "supportKind" "SupportKind",
ADD COLUMN     "supportNote" TEXT,
ADD COLUMN     "supportReviewedAt" TIMESTAMP(3),
ADD COLUMN     "supportReviewedById" TEXT;

-- CreateTable
CREATE TABLE "SupportAccreditation" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "kind" "SupportKind" NOT NULL,
    "name" TEXT NOT NULL,
    "disciplines" "Discipline"[],
    "evidenceUrl" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "grantedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportAccreditation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FighterAchievement" (
    "id" TEXT NOT NULL,
    "fighterId" TEXT NOT NULL,
    "championship" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "awardedOn" TIMESTAMP(3) NOT NULL,
    "scope" "AchievementScope" NOT NULL,
    "discipline" "Discipline" NOT NULL,
    "level" "Level" NOT NULL,
    "divisionId" TEXT,
    "weightClass" TEXT,
    "declarationKey" TEXT NOT NULL,
    "evidenceUrl" TEXT,
    "supportKind" "SupportKind" NOT NULL DEFAULT 'DECLARED',
    "supportAuthority" TEXT,
    "supportNote" TEXT,
    "supportReviewedAt" TIMESTAMP(3),
    "supportReviewedById" TEXT,
    "supportAccreditationId" TEXT,
    "reviewRequestedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "withdrawnAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FighterAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SupportAccreditation_userId_key" ON "SupportAccreditation"("userId");

-- CreateIndex
CREATE INDEX "FighterAchievement_discipline_level_divisionId_weightClass_idx" ON "FighterAchievement"("discipline", "level", "divisionId", "weightClass");

-- CreateIndex
CREATE INDEX "FighterAchievement_reviewRequestedAt_idx" ON "FighterAchievement"("reviewRequestedAt");

-- CreateIndex
CREATE UNIQUE INDEX "FighterAchievement_fighterId_declarationKey_key" ON "FighterAchievement"("fighterId", "declarationKey");

-- AddForeignKey
ALTER TABLE "Bout" ADD CONSTRAINT "Bout_supportReviewedById_fkey" FOREIGN KEY ("supportReviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bout" ADD CONSTRAINT "Bout_supportAccreditationId_fkey" FOREIGN KEY ("supportAccreditationId") REFERENCES "SupportAccreditation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportAccreditation" ADD CONSTRAINT "SupportAccreditation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportAccreditation" ADD CONSTRAINT "SupportAccreditation_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FighterAchievement" ADD CONSTRAINT "FighterAchievement_fighterId_fkey" FOREIGN KEY ("fighterId") REFERENCES "Fighter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FighterAchievement" ADD CONSTRAINT "FighterAchievement_supportReviewedById_fkey" FOREIGN KEY ("supportReviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FighterAchievement" ADD CONSTRAINT "FighterAchievement_supportAccreditationId_fkey" FOREIGN KEY ("supportAccreditationId") REFERENCES "SupportAccreditation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

