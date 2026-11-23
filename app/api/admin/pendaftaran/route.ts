import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getRegistrationEvent } from "@/lib/registration";

// Pengaturan pendaftaran: kuota dan buka/tutup.
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 400 });
  }

  const data: { quota?: number; isOpen?: boolean } = {};

  if (body.quota !== undefined) {
    const quota = Math.floor(Number(body.quota));
    if (!Number.isFinite(quota) || quota < 1 || quota > 100000) {
      return NextResponse.json({ error: "Kuota harus berupa angka minimal 1" }, { status: 400 });
    }
    data.quota = quota;
  }
  if (body.isOpen !== undefined) {
    if (typeof body.isOpen !== "boolean") {
      return NextResponse.json({ error: "Nilai buka/tutup tidak valid" }, { status: 400 });
    }
    data.isOpen = body.isOpen;
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Tidak ada perubahan" }, { status: 400 });
  }

  const event = await getRegistrationEvent();
  const updated = await prisma.registrationEvent.update({ where: { id: event.id }, data });
  return NextResponse.json({ quota: updated.quota, isOpen: updated.isOpen });
}
