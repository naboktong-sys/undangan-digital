import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRegistrationEvent } from "@/lib/registration";
import PendaftaranClient from "./PendaftaranClient";

export const dynamic = "force-dynamic";

export default async function PendaftaranAdminPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const event = await getRegistrationEvent();
  // Tanda tangan sengaja tidak ikut diambil (berat); dimuat per orang saat dibuka.
  const rows = await prisma.registrant.findMany({
    where: { eventId: event.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      memberNo: true,
      institution: true,
      attended: true,
      attendedAt: true,
      createdAt: true,
    },
  });

  return (
    <PendaftaranClient
      eventName={event.name}
      initialQuota={event.quota}
      initialIsOpen={event.isOpen}
      initialRows={rows.map((r) => ({
        id: r.id,
        name: r.name,
        memberNo: r.memberNo,
        institution: r.institution,
        attended: r.attended,
        attendedAt: r.attendedAt ? r.attendedAt.toISOString() : null,
        createdAt: r.createdAt.toISOString(),
      }))}
    />
  );
}
