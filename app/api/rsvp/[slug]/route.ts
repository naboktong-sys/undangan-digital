import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getDetails, getRemainingSlots } from "@/lib/events";

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { attendance, message, guestCount } = await req.json();

  if (!["HADIR", "TIDAK_HADIR"].includes(attendance)) {
    return NextResponse.json({ error: "Status kehadiran tidak valid" }, { status: 400 });
  }

  const guest = await prisma.guest.findUnique({ where: { slug }, include: { event: true } });
  if (!guest) {
    return NextResponse.json({ error: "Undangan tidak ditemukan" }, { status: 404 });
  }

  const { event } = guest;
  const details = getDetails(event);
  const maxGuests = Math.max(1, Number(details.maxGuests) || 1);

  let count = 0;
  const extra = Prisma.DbNull;

  if (attendance === "HADIR") {
    // Launching & Bedah Buku: RSVP hanya Hadir / Tidak Hadir → selalu 1 kursi, tanpa data tambahan
    count =
      event.type === "BEDAH_BUKU"
        ? 1
        : Math.min(maxGuests, Math.max(1, Math.floor(Number(guestCount)) || 1));

    const remaining = await getRemainingSlots(event.id, event.quota, guest.id);
    if (count > remaining) {
      return NextResponse.json(
        {
          error: "QUOTA_FULL",
          message:
            remaining > 0
              ? `Mohon maaf, sisa kuota hanya ${remaining} kursi.`
              : "Mohon maaf, kuota tamu untuk acara ini sudah penuh.",
        },
        { status: 409 }
      );
    }

    // (data buku & pertanyaan tidak lagi dikumpulkan untuk acara Bedah Buku)
  }

  const updated = await prisma.guest.update({
    where: { slug },
    data: {
      attendance,
      guestCount: count,
      message: event.type === "BEDAH_BUKU" ? null : message || null,
      extra,
      respondedAt: new Date(),
    },
  });

  return NextResponse.json(updated);
}
