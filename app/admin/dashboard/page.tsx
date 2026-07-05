import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const guests = await prisma.guest.findMany({
    orderBy: { createdAt: "desc" },
  });

  const stats = {
    total: guests.length,
    hadir: guests.filter((g) => g.attendance === "HADIR").length,
    tidakHadir: guests.filter((g) => g.attendance === "TIDAK_HADIR").length,
    pending: guests.filter((g) => g.attendance === "PENDING").length,
  };

  return <DashboardClient initialGuests={guests} stats={stats} />;
}