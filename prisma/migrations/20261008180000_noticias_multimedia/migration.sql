-- CreateEnum
CREATE TYPE "EventKind" AS ENUM ('VELADA', 'INTERCLUB');

-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('PHOTO', 'VIDEO');

-- CreateEnum
CREATE TYPE "NewsSourceKind" AS ENUM ('VIDEO', 'PRENSA', 'FEDERACION', 'AGREGADOR');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "kind" "EventKind" NOT NULL DEFAULT 'VELADA';

-- AlterTable
ALTER TABLE "Highlight" ADD COLUMN     "videoKey" TEXT,
ADD COLUMN     "videoType" TEXT;

-- CreateTable
CREATE TABLE "MediaItem" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "boutId" TEXT,
    "uploaderId" TEXT NOT NULL,
    "kind" "MediaKind" NOT NULL,
    "caption" TEXT,
    "image" BYTEA,
    "videoKey" TEXT,
    "videoType" TEXT,
    "videoBytes" INTEGER,
    "videoUrl" TEXT,
    "hiddenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "kind" "NewsSourceKind" NOT NULL,
    "disciplines" "Discipline"[] DEFAULT ARRAY[]::"Discipline"[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastAttemptAt" TIMESTAMP(3),
    "lastOkAt" TIMESTAMP(3),
    "lastError" TEXT,
    "lastCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsItem" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "guid" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "publisher" TEXT,
    "summary" TEXT,
    "imageUrl" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "disciplines" "Discipline"[] DEFAULT ARRAY[]::"Discipline"[],
    "hiddenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MediaItem_eventId_hiddenAt_idx" ON "MediaItem"("eventId", "hiddenAt");

-- CreateIndex
CREATE INDEX "MediaItem_boutId_idx" ON "MediaItem"("boutId");

-- CreateIndex
CREATE INDEX "MediaItem_uploaderId_createdAt_idx" ON "MediaItem"("uploaderId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NewsSource_url_key" ON "NewsSource"("url");

-- CreateIndex
CREATE INDEX "NewsSource_active_lastAttemptAt_idx" ON "NewsSource"("active", "lastAttemptAt");

-- CreateIndex
CREATE INDEX "NewsItem_hiddenAt_publishedAt_idx" ON "NewsItem"("hiddenAt", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "NewsItem_sourceId_guid_key" ON "NewsItem"("sourceId", "guid");

-- AddForeignKey
ALTER TABLE "MediaItem" ADD CONSTRAINT "MediaItem_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaItem" ADD CONSTRAINT "MediaItem_boutId_fkey" FOREIGN KEY ("boutId") REFERENCES "Bout"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaItem" ADD CONSTRAINT "MediaItem_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsItem" ADD CONSTRAINT "NewsItem_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "NewsSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

