import Image from "next/image";
import CountdownTimer from "@/components/CountdownTimer";
import RsvpForm from "@/components/RsvpForm";
import InvitationGate from "@/components/InvitationGate";
import { formatEventDate, formatEventTime, getDetails, googleMapsEmbedSrc } from "@/lib/events";
import { GuestMessages, InfoRow, type TemplateProps } from "./shared";

export default function TasyakuranTemplate({ guest, event, remainingSlots, messages }: TemplateProps) {
  const d = getDetails(event);
  const maxGuests = Math.max(1, Number(d.maxGuests) || 1);

  const heading = d.heading || event.name;
  const titleLines = (d.title || "").split("\n").map((l) => l.trim()).filter(Boolean);
  const dateLabel = formatEventDate(event.startsAt);
  const timeLabel = `${formatEventTime(event.startsAt)} WIB - selesai`;

  return (
    <InvitationGate
      guestName={guest.name}
      eyebrow={d.gateEyebrow || heading}
      title={d.gateTitle || titleLines.join(" ") || event.name}
      tagline={d.gateTagline}
      dateLabel={dateLabel}
    >
      <div className="min-h-screen bg-gradient-to-b from-[#fdfbf3] via-[#faf6e8] to-[#f5efd8] text-[#1c3d2e]">
        <div className="h-px bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />

        <section className="text-center pt-14 pb-8 px-6">
          <p className="font-elegant-label text-amber-700/80 text-sm tracking-widest uppercase">{heading}</p>
          {titleLines.length > 0 && (
            <h1 className="font-elegant-title text-[#0f3d28] text-2xl md:text-3xl mt-3 leading-relaxed">
              {titleLines.map((line, i) => (
                <span key={i}>
                  {i > 0 && <br />}
                  {line}
                </span>
              ))}
            </h1>
          )}
          <p className="font-elegant-label text-[#1c3d2e]/50 text-xs mt-3 tracking-wide">
            {maxGuests > 1
              ? `Undangan ini berlaku untuk maksimal ${maxGuests} orang`
              : "Undangan ini berlaku untuk 1 orang"}
          </p>
        </section>

        {d.flyer && (
          <section className="px-6 pb-12">
            <div className="max-w-sm mx-auto rounded-2xl overflow-hidden border border-amber-500/30 shadow-2xl shadow-amber-900/10">
              <Image src={d.flyer} alt={`Flyer ${event.name}`} width={1024} height={1536} className="w-full h-auto" priority />
            </div>
          </section>
        )}

        <section className="px-6 pb-12">
          <p className="font-elegant-label text-center text-amber-700/70 text-sm tracking-wide mb-4">
            Menuju Hari Bahagia
          </p>
          <CountdownTimer targetDate={event.startsAt.toISOString()} />
        </section>

        <section className="px-6 pb-12">
          <div className="max-w-md mx-auto border-y border-amber-500/30 py-8 space-y-6">
            <InfoRow label="Hari, Tanggal" value={dateLabel} />
            <InfoRow label="Waktu" value={timeLabel} />
            <InfoRow label="Lokasi" value={event.location} />
            {d.performers && <InfoRow label="Special Performance" value={d.performers} />}
          </div>
        </section>

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
            />
          </div>
        </section>

        <GuestMessages messages={messages} />

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
