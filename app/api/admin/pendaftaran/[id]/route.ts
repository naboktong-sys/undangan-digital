import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { duplicateMessage, parseIdentity } from "@/lib/registration";

const PUBLIC_FIELDS = {
  id: true,
  name: true,
  memberNo: true,
  institution: true,
  attended: true,
  attendedAt: true,
  createdAt: true,
} as const;

// Ubah status hadir, atau koreksi data (nama, No. Keanggotaan, instansi).
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 400 });
  }

  const data: Prisma.RegistrantUpdateInput = {};

  if (body.attended !== undefined) {
    if (typeof body.attended !== "boolean") {
      return NextResponse.json({ error: "Status hadir tidak valid" }, { status: 400 });
    }
    data.attended = body.attended;
    data.attendedAt = body.attended ? new Date() : null;
  }

  let memberNoForError = "";
  if (body.name !== undefined || body.memberNo !== undefined || body.institution !== undefined) {
    const identity = parseIdentity(body);
    if (!identity.ok) return NextResponse.json({ error: identity.error }, { status: 400 });
    data.name = identity.data.name;
    data.memberNo = identity.data.memberNo;
    data.institution = identity.data.institution;
    data.uniqueKey = identity.data.uniqueKey;
    memberNoForError = identity.data.memberNo;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Tidak ada perubahan" }, { status: 400 });
  }

  try {
    const updated = await prisma.registrant.update({ where: { id }, data, select: PUBLIC_FIELDS });
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        return NextResponse.json({ error: duplicateMessage(memberNoForError) }, { status: 409 });
      }
      if (err.code === "P2025") {
        return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
      }
    }
    console.error("Gagal mengubah pendaftar", err);
    return NextResponse.json({ error: "Terjadi kesalahan di server" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    await prisma.registrant.delete({ where: { id } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
    }
    throw err;
  }
  return NextResponse.json({ success: true });
}
