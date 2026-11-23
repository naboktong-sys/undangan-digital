-- CreateTable
CREATE TABLE "RegistrationEvent" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "quota" INTEGER NOT NULL DEFAULT 150,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegistrationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Registrant" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "memberNo" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "uniqueKey" TEXT NOT NULL,
    "attended" BOOLEAN NOT NULL DEFAULT false,
    "attendedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Registrant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RegistrationEvent_slug_key" ON "RegistrationEvent"("slug");

-- CreateIndex
CREATE INDEX "Registrant_eventId_createdAt_idx" ON "Registrant"("eventId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Registrant_eventId_uniqueKey_key" ON "Registrant"("eventId", "uniqueKey");

-- AddForeignKey
ALTER TABLE "Registrant" ADD CONSTRAINT "Registrant_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "RegistrationEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
