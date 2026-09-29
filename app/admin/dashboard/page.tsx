import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const { event: eventParam } = await searchParams;

  const events = await prisma.event.findMany({ orderBy: { createdAt: "desc" } });
  // Acara yang dipilih lewat ?event=..., bawaannya acara yang paling baru dibuat
  const currentEvent = events.find((e) => e.id === eventParam) ?? events[0] ?? null;

  const guests = currentEvent
    ? await prisma.guest.findMany({
        where: { eventId: currentEvent.id },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const totalConfirmedGuests = guests
    .filter((g) => g.attendance === "HADIR")
    .reduce((sum, g) => sum + (g.guestCount || 0), 0);

  const stats = {
    total: guests.length,
    hadir: guests.filter((g) => g.attendance === "HADIR").length,
    tidakHadir: guests.filter((g) => g.attendance === "TIDAK_HADIR").length,
    pending: guests.filter((g) => g.attendance === "PENDING").length,
    quotaUsed: totalConfirmedGuests,
    quotaMax: Math.max(currentEvent?.quota ?? 0, 1),
  };

  return (
    <DashboardClient
      // key: state daftar tamu di client ikut di-reset saat pindah acara
      key={currentEvent?.id ?? "none"}
      events={events}
      currentEvent={currentEvent}
      initialGuests={guests}
      stats={stats}
    />
  );
}
