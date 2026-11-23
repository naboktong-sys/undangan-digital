import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { duplicateMessage, getRegistrationEvent, isValidSignature, parseIdentity } from "@/lib/registration";

class RegistrationError extends Error {
  constructor(
    public code: "CLOSED" | "FULL" | "DUPLICATE",
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

// Pendaftaran publik: 1 kiriman = 1 orang.
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 400 });
  }

  // Kolom jebakan untuk bot (disembunyikan dari pengguna asli)
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 400 });
  }

  const identity = parseIdentity(body);
  if (!identity.ok) return NextResponse.json({ error: identity.error }, { status: 400 });
  const { name, memberNo, institution, uniqueKey } = identity.data;

  if (!isValidSignature(body.signature)) {
    return NextResponse.json({ error: "Tanda tangan wajib diisi." }, { status: 400 });
  }
  const signature = body.signature;

  const event = await getRegistrationEvent();

  try {
    const registrant = await prisma.$transaction(async (tx) => {
      // Kunci baris acara agar pengecekan kuota tidak "bocor" saat banyak yang daftar bersamaan
      await tx.$queryRaw`SELECT "id" FROM "RegistrationEvent" WHERE "id" = ${event.id} FOR UPDATE`;

      const fresh = await tx.registrationEvent.findUnique({ where: { id: event.id } });
      if (!fresh || !fresh.isOpen) {
        throw new RegistrationError("CLOSED", "Mohon maaf, pendaftaran sudah ditutup.", 403);
      }

      const dup = await tx.registrant.findUnique({
        where: { eventId_uniqueKey: { eventId: event.id, uniqueKey } },
        select: { id: true },
      });
      if (dup) throw new RegistrationError("DUPLICATE", duplicateMessage(memberNo), 409);

      const used = await tx.registrant.count({ where: { eventId: event.id } });
      if (used >= fresh.quota) {
        throw new RegistrationError("FULL", "Mohon maaf, kuota pendaftaran sudah penuh.", 409);
      }

      return tx.registrant.create({
        data: { eventId: event.id, name, memberNo, institution, signature, uniqueKey },
        select: { name: true, memberNo: true, institution: true, createdAt: true },
      });
    });

    return NextResponse.json({ success: true, registrant });
  } catch (err) {
    if (err instanceof RegistrationError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: duplicateMessage(memberNo), code: "DUPLICATE" }, { status: 409 });
    }
    console.error("Gagal menyimpan pendaftaran", err);
    return NextResponse.json({ error: "Terjadi kesalahan di server. Silakan coba lagi." }, { status: 500 });
  }
}
