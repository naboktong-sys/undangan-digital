-- CreateEnum
CREATE TYPE "Attendance" AS ENUM ('PENDING', 'HADIR', 'TIDAK_HADIR');

-- CreateTable
CREATE TABLE "Guest" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "phone" TEXT,
    "invited" BOOLEAN NOT NULL DEFAULT false,
    "attendance" "Attendance" NOT NULL DEFAULT 'PENDING',
    "guestCount" INTEGER,
    "message" TEXT,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Guest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Guest_slug_key" ON "Guest"("slug");
