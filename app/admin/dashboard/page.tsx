import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardClient from "./DashboardClient";

const MAX_QUOTA = 160;

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const guests = await prisma.guest.findMany({
    orderBy: { createdAt: "desc" },
  });

  const totalConfirmedGuests = guests
    .filter((g) => g.attendance === "HADIR")
    .reduce((sum, g) => sum + (g.guestCount || 0), 0);

  const stats = {
    total: guests.length,
    hadir: guests.filter((g) => g.attendance === "HADIR").length,
    tidakHadir: guests.filter((g) => g.attendance === "TIDAK_HADIR").length,
    pending: guests.filter((g) => g.attendance === "PENDING").length,
    quotaUsed: totalConfirmedGuests,
    quotaMax: MAX_QUOTA,
  };

  return <DashboardClient initialGuests={guests} stats={stats} />;
}