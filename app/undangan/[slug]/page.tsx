import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CountdownTimer from "@/components/CountdownTimer";
import RsvpForm from "@/components/RsvpForm";

const EVENT_DATE = "2026-07-20T10:00:00+07:00";
const MAPS_EMBED_SRC = "https://www.google.com/maps?q=Deka+Hotel+Jl.+Mayjen+HR.+Muhammad+No.24+Surabaya&output=embed";
const MAPS_LINK = "https://maps.app.goo.gl/search/Deka+Hotel+Surabaya";

export default async function InvitationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guest = await prisma.guest.findUnique({ where: { slug } });

  if (!guest) notFound();

  // ⬇️ Blok kuota ditaruh DI SINI, setelah guest dipastikan ada
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
    <div className="min-h-screen bg-gradient-to-b from-[#0b2e1f] via-[#0f3d28] to-black text-yellow-50">
      <section className="text-center pt-16 pb-10 px-6">
        <p className="text-yellow-100/70 text-sm tracking-wide">Tasyakuran Harlah ke-73</p>
        <h1 className="text-2xl md:text-3xl font-semibold text-yellow-400 mt-2 leading-snug">
          Abuya Prof. Dr.
          <br />
          KH. Said Aqil Siroj, M.A.
        </h1>

        <div className="mt-8 border-t border-yellow-600/30 pt-6 max-w-sm mx-auto">
          <p className="text-yellow-100/70 text-sm">Kepada Bapak/Ibu/Saudara/i</p>
          <p className="text-xl font-medium text-yellow-300 mt-1">{guest.name}</p>
          {/* Flyer Acara */}
            <section className="px-6 pb-10">
                <div className="max-w-sm mx-auto rounded-xl overflow-hidden border border-yellow-600/30 shadow-lg shadow-black/40">
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
          <p className="text-yellow-100/50 text-xs mt-1">Undangan ini berlaku untuk 1 orang</p>
        </div>
      </section>

      <section className="px-6 pb-10">
        <p className="text-center text-yellow-100/70 text-sm mb-3">Menuju hari bahagia</p>
        <CountdownTimer targetDate={EVENT_DATE} />
      </section>

      <section className="px-6 pb-10">
        <div className="max-w-md mx-auto bg-white/5 border border-yellow-600/30 rounded-xl p-6 space-y-4">
          <InfoRow label="Hari, Tanggal" value="Senin, 20 Juli 2026" />
          <InfoRow label="Waktu" value="10.00 - 13.30 WIB" />
          <InfoRow
            label="Lokasi"
            value="Deka Hotel, Jl. Mayjen HR. Muhammad No.24, Putat Gede, Kec. Sukomanunggal, Surabaya, Jawa Timur 60189"
          />
          <InfoRow label="Special Performance" value="Boby Al Mahbub (Standup Comedian)" />

          <a href={MAPS_LINK} target="_blank" rel="noopener noreferrer" className="block text-center text-sm text-yellow-400 underline pt-2">
            Buka di Google Maps
          </a>
        </div>
      </section>

      <section className="px-6 pb-10">
        <div className="max-w-md mx-auto rounded-xl overflow-hidden border border-yellow-600/30">
          <iframe src={MAPS_EMBED_SRC} width="100%" height="250" style={{ border: 0 }} loading="lazy" />
        </div>
      </section>

      <section className="px-6 pb-16">
        <div className="max-w-md mx-auto bg-white/5 border border-yellow-600/30 rounded-xl p-6">
          <RsvpForm
            slug={guest.slug}
            alreadyResponded={guest.attendance !== "PENDING"}
            remainingSlots={remainingSlots}
          />
        </div>
      </section>

      {/* Ucapan & Doa */}
      {messages.length > 0 && (
        <section className="px-6 pb-16">
          <p className="text-center text-yellow-100/70 text-sm mb-4">
            Ucapan &amp; Doa ({messages.length})
          </p>
          <div className="max-w-md mx-auto space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {messages.map((m, i) => (
              <div
                key={i}
                className="bg-white/5 border border-yellow-600/20 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-1">
                  <p className="text-sm font-medium text-yellow-300">{m.name}</p>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full ${
                      m.attendance === "HADIR"
                        ? "bg-green-900/40 text-green-400"
                        : "bg-red-900/40 text-red-400"
                    }`}
                  >
                    {m.attendance === "HADIR" ? "Hadir" : "Tidak Hadir"}
                  </span>
                </div>
                <p className="text-sm text-yellow-50/90 leading-relaxed">{m.message}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="text-center pb-8 text-xs text-yellow-100/40">
        SAS Center &amp; LPOI - #MenebarManfaat
      </footer>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-yellow-100/50">{label}</p>
      <p className="text-sm text-yellow-50 mt-0.5">{value}</p>
    </div>
  );
}
