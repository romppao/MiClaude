-- AlterTable
ALTER TABLE "FighterDiscipline" ADD COLUMN     "belt" TEXT,
ADD COLUMN     "beltDegrees" INTEGER;

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "ownerId" TEXT,
    "name" TEXT,
    "bio" TEXT,
    "city" TEXT,
    "website" TEXT,
    "hasAvatar" BOOLEAN NOT NULL DEFAULT false,
    "hasBanner" BOOLEAN NOT NULL DEFAULT false,
    "avatar" BYTEA,
    "banner" BYTEA,
    "avatarX" INTEGER NOT NULL DEFAULT 50,
    "avatarY" INTEGER NOT NULL DEFAULT 50,
    "bannerX" INTEGER NOT NULL DEFAULT 50,
    "bannerY" INTEGER NOT NULL DEFAULT 50,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Profile_ownerId_idx" ON "Profile"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_kind_entityId_key" ON "Profile"("kind", "entityId");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

