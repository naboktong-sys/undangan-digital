import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRegistrationEvent, maskName, parseIdentity } from "@/lib/registration";

// Cek mandiri: peserta mengisi data yang sama dengan form pendaftaran (tanpa tanda tangan).
// Nama hanya ditampilkan tersamar agar data peserta lain tidak terbuka.
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 400 });
  }

  const identity = parseIdentity(body);
  if (!identity.ok) return NextResponse.json({ error: identity.error }, { status: 400 });

  const event = await getRegistrationEvent();
  const registrant = await prisma.registrant.findUnique({
    where: { eventId_uniqueKey: { eventId: event.id, uniqueKey: identity.data.uniqueKey } },
    select: { name: true, createdAt: true },
  });

  if (!registrant) return NextResponse.json({ found: false });
  return NextResponse.json({
    found: true,
    name: maskName(registrant.name),
    registeredAt: registrant.createdAt,
  });
}
