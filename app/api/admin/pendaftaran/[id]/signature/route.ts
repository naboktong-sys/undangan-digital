import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// Tanda tangan disajikan sebagai gambar terpisah agar daftar pendaftar tetap ringan.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const row = await prisma.registrant.findUnique({ where: { id }, select: { signature: true } });
  if (!row) return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });

  const base64 = row.signature.slice(row.signature.indexOf(",") + 1);
  return new NextResponse(Buffer.from(base64, "base64"), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
