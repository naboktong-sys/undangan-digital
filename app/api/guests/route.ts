import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { generateSlug } from "@/lib/slug";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const eventId = req.nextUrl.searchParams.get("eventId");

  const guests = await prisma.guest.findMany({
    where: eventId ? { eventId } : undefined,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(guests);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, category, phone, eventId } = await req.json();

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Nama wajib diisi" }, { status: 400 });
  }
  if (!eventId || typeof eventId !== "string") {
    return NextResponse.json({ error: "Acara wajib dipilih" }, { status: 400 });
  }

  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } });
  if (!event) {
    return NextResponse.json({ error: "Acara tidak ditemukan" }, { status: 404 });
  }

  let slug = generateSlug(name);

  // pastikan slug unik (jaga-jaga kalau tabrakan)
  let existing = await prisma.guest.findUnique({ where: { slug } });
  while (existing) {
    slug = generateSlug(name);
    existing = await prisma.guest.findUnique({ where: { slug } });
  }

  const guest = await prisma.guest.create({
    data: {
      name: name.trim(),
      category: category || null,
      phone: phone || null,
      slug,
      eventId: event.id,
    },
  });

  return NextResponse.json(guest);
}
