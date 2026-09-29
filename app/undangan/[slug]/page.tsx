import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getRemainingSlots } from "@/lib/events";
import TasyakuranTemplate from "@/components/templates/TasyakuranTemplate";
import BedahBukuTemplate from "@/components/templates/BedahBukuTemplate";

export default async function InvitationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guest = await prisma.guest.findUnique({ where: { slug }, include: { event: true } });

  if (!guest) notFound();

  const { event } = guest;

  const remainingSlots = await getRemainingSlots(event.id, event.quota, guest.id);

  // Ucapan hanya dari tamu pada acara yang sama
  const messages = await prisma.guest.findMany({
    where: {
      eventId: event.id,
      message: { not: null },
      attendance: { not: "PENDING" },
    },
    orderBy: { respondedAt: "desc" },
    select: {
      name: true,
      message: true,
      attendance: true,
      respondedAt: true,
    },
  });

  const props = {
    guest: { name: guest.name, slug: guest.slug, attendance: guest.attendance },
    event,
    remainingSlots,
    messages,
  };

  switch (event.type) {
    case "BEDAH_BUKU":
      return <BedahBukuTemplate {...props} />;
    case "TASYAKURAN":
    default:
      return <TasyakuranTemplate {...props} />;
  }
}
