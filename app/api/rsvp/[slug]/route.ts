import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getDetails, getRemainingSlots } from "@/lib/events";

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { attendance, message, guestCount, bookQty, question } = await req.json();

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
  let extra: Prisma.InputJsonValue | typeof Prisma.DbNull = Prisma.DbNull;

  if (attendance === "HADIR") {
    count = Math.min(maxGuests, Math.max(1, Math.floor(Number(guestCount)) || 1));

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

    if (event.type === "BEDAH_BUKU") {
      const qty = details.allowPreorder ? Math.min(10, Math.max(0, Math.floor(Number(bookQty)) || 0)) : 0;
      const q = typeof question === "string" ? question.trim().slice(0, 300) : "";
      extra = { bookQty: qty, ...(q ? { question: q } : {}) };
    }
  }

  const updated = await prisma.guest.update({
    where: { slug },
    data: {
      attendance,
      guestCount: count,
      message: message || null,
      extra,
      respondedAt: new Date(),
    },
  });

  return NextResponse.json(updated);
}
