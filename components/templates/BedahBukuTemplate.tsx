import Image from "next/image";
import CountdownTimer from "@/components/CountdownTimer";
import RsvpForm from "@/components/RsvpForm";
import InvitationGate from "@/components/InvitationGate";
import {
  formatEventDate,
  formatEventTime,
  getDetails,
  googleCalendarUrl,
  googleMapsEmbedSrc,
  parsePairs,
} from "@/lib/events";
import { InfoRow, type TemplateProps } from "./shared";

export default function BedahBukuTemplate({ guest, event, remainingSlots }: TemplateProps) {
  const d = getDetails(event);
  // Bedah Buku: RSVP hanya Hadir / Tidak Hadir, satu undangan = satu orang
  const maxGuests = 1;

  const heading = d.heading || "Launching & Bedah Buku";
  const bookTitle = d.bookTitle || event.name;
  const dateLabel = formatEventDate(event.startsAt);
  const timeLabel = `${formatEventTime(event.startsAt)} WIB - selesai`;
  const speakers = parsePairs(d.speakers);
  // Format tiap baris: "Jam | Kegiatan | keterangan | keterangan ..." (keterangan opsional, boleh lebih dari satu)
  const rundown = parsePairs(d.rundown).map((r) => {
    const [title, ...details] = r.right
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean);
    return { time: r.left, title, details };
  });
  const calendarUrl = googleCalendarUrl({ title: `${heading}: ${bookTitle}`, start: event.startsAt, location: event.location });

  return (
    <InvitationGate
      guestName={guest.name}
      eyebrow={heading}
      title={bookTitle}
      tagline={d.gateTagline || (d.author ? `oleh ${d.author}` : undefined)}
      taglineClassName="text-xl sm:text-2xl mt-3 leading-snug"
      dateLabel={dateLabel}
      secondLogoSrc="/lpoi-logo.png"
    >
      <div className="min-h-screen bg-gradient-to-b from-[#fdfbf3] via-[#faf6e8] to-[#f5efd8] text-[#1c3d2e]">
        <div className="h-px bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />

        {/* Hero: judul buku + cover */}
        <section className="text-center pt-14 pb-8 px-6">
          <p className="font-elegant-label text-amber-700/80 text-sm tracking-widest uppercase">{heading}</p>
          <h1 className="font-elegant-title text-[#0f3d28] text-3xl md:text-4xl mt-3 leading-snug">{bookTitle}</h1>
          {d.author && (
            <p className="font-elegant-label text-[#1c3d2e]/70 text-base mt-2 tracking-wide">oleh {d.author}</p>
          )}
          <p className="font-elegant-label text-[#1c3d2e]/50 text-xs mt-3 tracking-wide">
            {maxGuests > 1
              ? `Undangan ini berlaku untuk maksimal ${maxGuests} orang`
              : "Undangan ini berlaku untuk 1 orang"}
          </p>
        </section>

        {d.cover && (
          <section className="px-6 pb-10">
            <div className="w-full max-w-[420px] md:max-w-[520px] mx-auto rounded-md overflow-hidden border border-amber-500/30 shadow-2xl shadow-amber-900/20">
              {/* Ketuk gambar untuk membuka ukuran penuh (teks flyer kecil di layar HP) */}
              <a href={d.cover} target="_blank" rel="noopener noreferrer" className="block">
                <Image
                  src={d.cover}
                  alt={`Flyer ${bookTitle}`}
                  width={1400}
                  height={2100}
                  sizes="(min-width: 768px) 520px, 92vw"
                  className="w-full h-auto"
                  priority
                />
              </a>
            </div>
            <p className="text-center text-[11px] text-[#1c3d2e]/50 mt-2">Ketuk flyer untuk memperbesar</p>
          </section>
        )}

        {d.synopsis && (
          <section className="px-6 pb-12">
            <div className="max-w-md mx-auto text-center">
              <p className="font-elegant-label text-amber-700/70 text-sm tracking-widest uppercase mb-3">Tentang Buku</p>
              <p className="text-sm text-[#1c3d2e]/85 leading-relaxed whitespace-pre-line">{d.synopsis}</p>
            </div>
          </section>
        )}

        <section className="px-6 pb-12">
          <p className="font-elegant-label text-center text-amber-700/70 text-sm tracking-wide mb-4">
            Menuju Hari Acara
          </p>
          <CountdownTimer targetDate={event.startsAt.toISOString()} />
        </section>

        {/* Waktu & tempat */}
        <section className="px-6 pb-12">
          <div className="max-w-md mx-auto border-y border-amber-500/30 py-8 space-y-6">
            <InfoRow label="Hari, Tanggal" value={dateLabel} />
            <InfoRow label="Waktu" value={timeLabel} />
            <InfoRow label="Lokasi" value={event.location} />
          </div>
          <div className="text-center mt-5">
            <a
              href={calendarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm text-amber-800 border border-amber-600/60 rounded-full px-5 py-2 hover:bg-amber-50 transition"
            >
              + Tambahkan ke Kalender
            </a>
          </div>
        </section>

        {/* Pembicara & moderator */}
        {(speakers.length > 0 || d.moderator) && (
          <section className="px-6 pb-12">
            <div className="max-w-md mx-auto">
              <p className="font-elegant-label text-center text-amber-700/70 text-sm tracking-widest uppercase mb-5">
                Pembicara
              </p>
              <div className="space-y-4">
                {speakers.map((s, i) => (
                  <div key={i} className="text-center bg-white/60 border border-amber-500/20 rounded-xl py-4 px-4">
                    <p className="font-elegant-title not-italic text-[#0f3d28] text-base">{s.left}</p>
                    {s.right && <p className="text-xs text-[#1c3d2e]/65 mt-1">{s.right}</p>}
                  </div>
                ))}
                {d.moderator && (
                  <div className="text-center bg-white/60 border border-amber-500/20 rounded-xl py-4 px-4">
                    <p className="font-elegant-title not-italic text-[#0f3d28] text-base">{d.moderator}</p>
                    <p className="text-xs text-[#1c3d2e]/65 mt-1">Moderator</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Susunan acara */}
        {rundown.length > 0 && (
          <section className="px-6 pb-12">
            <div className="max-w-md mx-auto">
              <p className="font-elegant-label text-center text-amber-700/70 text-sm tracking-widest uppercase mb-5">
                Susunan Acara
              </p>
              <ol className="border-l border-amber-500/40 ml-2 space-y-5">
                {rundown.map((r, i) => (
                  <li key={i} className="pl-5 relative">
                    <span className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-amber-600" />
                    {r.title ? (
                      <>
                        <p className="text-base font-semibold text-amber-800 tracking-wide">{r.time}</p>
                        <p className="text-sm font-medium text-[#1c3d2e] mt-0.5">{r.title}</p>
                        {r.details.map((t, j) => (
                          <p key={j} className="text-xs text-[#1c3d2e]/65 mt-0.5 leading-relaxed">
                            {t}
                          </p>
                        ))}
                      </>
                    ) : (
                      <p className="text-sm text-[#1c3d2e]">{r.time}</p>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          </section>
        )}

        <section className="px-6 pb-12">
          <div className="max-w-md mx-auto rounded-2xl overflow-hidden border border-amber-500/30">
            <iframe
              src={googleMapsEmbedSrc(event.mapsQuery || event.location)}
              width="100%"
              height="230"
              style={{ border: 0 }}
              loading="lazy"
            />
          </div>
        </section>

        <section className="px-6 pb-12">
          <div className="max-w-md mx-auto bg-white/60 border border-amber-500/30 rounded-2xl p-6 shadow-sm">
            <RsvpForm
              slug={guest.slug}
              alreadyResponded={guest.attendance !== "PENDING"}
              remainingSlots={remainingSlots}
              maxGuests={maxGuests}
              simple
            />
          </div>
        </section>

        {/* Flyer bawah (undangan + info donasi), setelah RSVP */}
        {d.flyer && (
          <section className="px-6 pb-12">
            <div className="w-full max-w-[420px] md:max-w-[520px] mx-auto rounded-md overflow-hidden border border-amber-500/30 shadow-2xl shadow-amber-900/20">
              <a href={d.flyer} target="_blank" rel="noopener noreferrer" className="block">
                <Image
                  src={d.flyer}
                  alt={`Undangan ${bookTitle}`}
                  width={701}
                  height={1052}
                  sizes="(min-width: 768px) 520px, 92vw"
                  className="w-full h-auto"
                />
              </a>
            </div>
          </section>
        )}

        <div className="h-px bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />
        {d.organizer && (
          <footer className="text-center py-8">
            <p className="font-elegant-label text-[#1c3d2e]/50 text-xs tracking-widest">{d.organizer}</p>
          </footer>
        )}
      </div>
    </InvitationGate>
  );
}
