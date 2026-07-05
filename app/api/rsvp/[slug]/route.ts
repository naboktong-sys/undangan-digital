import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MAX_QUOTA = 160;

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { attendance, guestCount, message } = await req.json();

  if (!["HADIR", "TIDAK_HADIR"].includes(attendance)) {
    return NextResponse.json({ error: "Status kehadiran tidak valid" }, { status: 400 });
  }

  const guest = await prisma.guest.findUnique({ where: { slug } });
  if (!guest) {
    return NextResponse.json({ error: "Undangan tidak ditemukan" }, { status: 404 });
  }

  if (attendance === "HADIR") {
    const newCount = Number(guestCount) || 1;

    // Hitung total tamu yang sudah konfirmasi hadir, TIDAK termasuk tamu ini sendiri
    // (jaga-jaga kalau tamu submit ulang/edit jawabannya)
    const aggregate = await prisma.guest.aggregate({
      where: { attendance: "HADIR", id: { not: guest.id } },
      _sum: { guestCount: true },
    });

    const currentTotal = aggregate._sum.guestCount || 0;

    if (currentTotal + newCount > MAX_QUOTA) {
      return NextResponse.json(
        {
          error: "QUOTA_FULL",
          message: "Mohon maaf, kuota tamu untuk acara ini sudah penuh.",
        },
        { status: 409 }
      );
    }
  }

  const updated = await prisma.guest.update({
    where: { slug },
    data: {
      attendance,
      guestCount: attendance === "HADIR" ? Number(guestCount) || 1 : 0,
      message: message || null,
      respondedAt: new Date(),
    },
  });

  return NextResponse.json(updated);
}