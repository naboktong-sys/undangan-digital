import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { sanitizeDetails } from "@/lib/events";

const EVENT_TYPES = ["TASYAKURAN", "BEDAH_BUKU"] as const;

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const events = await prisma.event.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, type, startsAt, location, mapsQuery, quota, details } = body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Nama acara wajib diisi" }, { status: 400 });
  }
  if (!EVENT_TYPES.includes(type)) {
    return NextResponse.json({ error: "Jenis acara tidak valid" }, { status: 400 });
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

  const event = await prisma.event.create({
    data: {
      name: name.trim(),
      type,
      startsAt: date,
      location: location.trim(),
      mapsQuery: typeof mapsQuery === "string" && mapsQuery.trim() ? mapsQuery.trim() : null,
      quota: quotaNum,
      details: sanitizeDetails(details) as Prisma.InputJsonObject,
    },
  });

  return NextResponse.json(event);
}
