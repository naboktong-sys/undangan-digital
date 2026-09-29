-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('TASYAKURAN', 'BEDAH_BUKU');

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "mapsQuery" TEXT,
    "quota" INTEGER NOT NULL DEFAULT 100,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- Acara yang sudah ada (Tasyakuran Harlah ke-73) dimasukkan sebagai Event pertama,
-- supaya seluruh tamu lama tetap terhubung dan link undangan yang sudah dibagikan tetap berfungsi.
-- 18.00 WIB = 11.00 UTC
INSERT INTO "Event" ("id", "name", "type", "startsAt", "location", "mapsQuery", "quota", "details")
VALUES (
    'evt_harlah73',
    'Tasyakuran Harlah ke-73 Abuya Prof. Dr. KH. Said Aqil Siroj, M.A.',
    'TASYAKURAN',
    '2026-08-14 11:00:00',
    'Deka Hotel, Jl. Mayjen HR. Muhammad No.24, Putat Gede, Kec. Sukomanunggal, Surabaya, Jawa Timur 60189',
    'Deka Hotel Jl. Mayjen HR. Muhammad No.24 Surabaya',
    160,
    '{"heading": "Tasyakuran Harlah ke-73", "title": "Abuya Prof. Dr.\nKH. Said Aqil Siroj, M.A.", "gateEyebrow": "Tasyakuran Hari Lahir", "gateTitle": "Abuya Said Aqil Siroj", "gateTagline": "Ke-73", "flyer": "/flyer.jpeg", "performers": "Royke Mangundap (Artis Lokal Jatim) & Boby Al Mahbub (Standup Comedian)", "organizer": "SAS Center & LPOI · #MenebarManfaat"}'::jsonb
);

-- AlterTable: kolom baru di Guest (eventId sementara boleh kosong agar data lama bisa diisi)
ALTER TABLE "Guest" ADD COLUMN "eventId" TEXT,
ADD COLUMN "extra" JSONB;

-- Hubungkan semua tamu lama ke acara Harlah
UPDATE "Guest" SET "eventId" = 'evt_harlah73' WHERE "eventId" IS NULL;

-- Setelah terisi, eventId menjadi wajib
ALTER TABLE "Guest" ALTER COLUMN "eventId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Guest_eventId_idx" ON "Guest"("eventId");

-- AddForeignKey
ALTER TABLE "Guest" ADD CONSTRAINT "Guest_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
