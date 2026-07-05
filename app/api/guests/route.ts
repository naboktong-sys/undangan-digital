import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { generateSlug } from "@/lib/slug";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const guests = await prisma.guest.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(guests);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, category, phone } = await req.json();

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Nama wajib diisi" }, { status: 400 });
  }

  let slug = generateSlug(name);

  // pastikan slug unik (jaga-jaga kalau tabrakan)
  let existing = await prisma.guest.findUnique({ where: { slug } });
  while (existing) {
    slug = generateSlug(name);
    existing = await prisma.guest.findUnique({ where: { slug } });
  }

  const guest = await prisma.guest.create({
    data: { name: name.trim(), category: category || null, phone: phone || null, slug },
  });

  return NextResponse.json(guest);
}