import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { sanitizeDetails } from "@/lib/events";

// Jenis acara (type) sengaja tidak bisa diubah setelah dibuat,
// karena kontennya (details) disusun sesuai template jenis tersebut.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { name, startsAt, location, mapsQuery, quota, details } = body;

  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Acara tidak ditemukan" }, { status: 404 });

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Nama acara wajib diisi" }, { status: 400 });
  }
  const date = new Date(startsAt);
  if (!startsAt || Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: "Tanggal & waktu tidak valid" }, { status: 400 });
  }
  if (!location || typeof location !== "string" || !location.trim()) {
    return NextResponse.json({ error: "Lokasi wajib diisi" }, { status: 400 });
  }
  const quotaNum = Math.floor(Number(quota));
  if (!Number.isFinite(quotaNum) || quotaNum < 1) {
    return NextResponse.json({ error: "Kuota harus berupa angka minimal 1" }, { status: 400 });
  }

  const event = await prisma.event.update({
    where: { id },
    data: {
      name: name.trim(),
      startsAt: date,
      location: location.trim(),
      mapsQuery: typeof mapsQuery === "string" && mapsQuery.trim() ? mapsQuery.trim() : null,
      quota: quotaNum,
      details: sanitizeDetails(details) as Prisma.InputJsonObject,
    },
  });

  return NextResponse.json(event);
}
