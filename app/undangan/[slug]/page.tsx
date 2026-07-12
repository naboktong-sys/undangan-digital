import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CountdownTimer from "@/components/CountdownTimer";
import RsvpForm from "@/components/RsvpForm";
import InvitationGate from "@/components/InvitationGate";

const EVENT_DATE = "2026-08-08T13:00:00+07:00";
const MAPS_EMBED_SRC = "https://www.google.com/maps?q=Deka+Hotel+Jl.+Mayjen+HR.+Muhammad+No.24+Surabaya&output=embed";
const MAPS_LINK = "https://maps.app.goo.gl/search/Deka+Hotel+Surabaya";

export default async function InvitationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guest = await prisma.guest.findUnique({ where: { slug } });

  if (!guest) notFound();

  const quotaAggregate = await prisma.guest.aggregate({
    where: { attendance: "HADIR", id: { not: guest.id } },
    _sum: { guestCount: true },
  });
  const currentTotal = quotaAggregate._sum.guestCount || 0;
  const MAX_QUOTA = 160;
  const remainingSlots = Math.max(0, MAX_QUOTA - currentTotal);

  const messages = await prisma.guest.findMany({
    where: {
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

  return (
    <InvitationGate guestName={guest.name}>
      <div className="min-h-screen bg-gradient-to-b from-[#fdfbf3] via-[#faf6e8] to-[#f5efd8] text-[#1c3d2e]">
        <div className="h-px bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />

        <section className="text-center pt-14 pb-8 px-6">
          <p className="font-elegant-label text-amber-700/80 text-sm tracking-widest uppercase">
            Tasyakuran Harlah ke-73
          </p>
          <h1 className="font-elegant-title text-[#0f3d28] text-2xl md:text-3xl mt-3 leading-relaxed">
            Abuya Prof. Dr.
            <br />
            KH. Said Aqil Siroj, M.A.
          </h1>
          <p className="font-elegant-label text-[#1c3d2e]/50 text-xs mt-3 tracking-wide">
            Undangan ini berlaku untuk 1 orang
          </p>
        </section>

        <section className="px-6 pb-12">
          <div className="max-w-sm mx-auto rounded-2xl overflow-hidden border border-amber-500/30 shadow-2xl shadow-amber-900/10">
            <Image
              src="/flyer.jpeg"
              alt="Flyer Tasyakuran Harlah ke-73 Abuya Prof. Dr. KH. Said Aqil Siroj, M.A."
              width={1024}
              height={1536}
              className="w-full h-auto"
              priority
            />
          </div>
        </section>

        <section className="px-6 pb-12">
          <p className="font-elegant-label text-center text-amber-700/70 text-sm tracking-wide mb-4">
            Menuju Hari Bahagia
          </p>
          <CountdownTimer targetDate={EVENT_DATE} />
        </section>

        <section className="px-6 pb-12">
          <div className="max-w-md mx-auto border-y border-amber-500/30 py-8 space-y-6">
            <InfoRow label="Hari, Tanggal" value="Sabtu, 8 Agustus 2026" />
            <InfoRow label="Waktu" value="13.00 WIB - selesai" />
            <InfoRow
              label="Lokasi"
              value="Deka Hotel, Jl. Mayjen HR. Muhammad No.24, Putat Gede, Kec. Sukomanunggal, Surabaya, Jawa Timur 60189"
            />
            <InfoRow
              label="Special Performance"
              value="Royke Mangundap (Artis Lokal Jatim) & Boby Al Mahbub (Standup Comedian)"
            />
          </div>
        </section>

        <section className="px-6 pb-12">
          <div className="max-w-md mx-auto rounded-2xl overflow-hidden border border-amber-500/30">
            <iframe src={MAPS_EMBED_SRC} width="100%" height="230" style={{ border: 0 }} loading="lazy" />
          </div>
        </section>

        <section className="px-6 pb-12">
          <div className="max-w-md mx-auto bg-white/60 border border-amber-500/30 rounded-2xl p-6 shadow-sm">
            <RsvpForm
              slug={guest.slug}
              alreadyResponded={guest.attendance !== "PENDING"}
              remainingSlots={remainingSlots}
            />
          </div>
        </section>

        {messages.length > 0 && (
          <section className="px-6 pb-14">
            <p className="font-elegant-label text-center text-amber-700/70 text-sm tracking-wide mb-5">
              Ucapan &amp; Doa ({messages.length})
            </p>
            <div className="max-w-md mx-auto space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {messages.map((m, i) => (
                <div key={i} className="bg-white/60 border border-amber-500/20 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-1.5">
                    <p className="font-elegant-title not-italic text-[#0f3d28] text-sm">{m.name}</p>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        m.attendance === "HADIR"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {m.attendance === "HADIR" ? "Hadir" : "Tidak Hadir"}
                    </span>
                  </div>
                  <p className="text-sm text-[#1c3d2e]/80 leading-relaxed">{m.message}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="h-px bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />
        <footer className="text-center py-8">
          <p className="font-elegant-label text-[#1c3d2e]/50 text-xs tracking-widest">
            SAS Center &amp; LPOI · #MenebarManfaat
          </p>
        </footer>
      </div>
    </InvitationGate>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="font-elegant-label text-amber-700/70 text-xs tracking-widest uppercase">{label}</p>
      <p className="text-sm text-[#1c3d2e] mt-1.5 leading-relaxed">{value}</p>
    </div>
  );
}
