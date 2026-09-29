import type { Event } from "@prisma/client";

export type TemplateProps = {
  guest: { name: string; slug: string; attendance: "PENDING" | "HADIR" | "TIDAK_HADIR" };
  event: Event;
  remainingSlots: number;
  messages: {
    name: string;
    message: string | null;
    attendance: "PENDING" | "HADIR" | "TIDAK_HADIR";
    respondedAt: Date | null;
  }[];
};

export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="font-elegant-label text-amber-700/70 text-xs tracking-widest uppercase">{label}</p>
      <p className="text-sm text-[#1c3d2e] mt-1.5 leading-relaxed">{value}</p>
    </div>
  );
}

export function GuestMessages({ messages }: { messages: TemplateProps["messages"] }) {
  if (messages.length === 0) return null;

  return (
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
                  m.attendance === "HADIR" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
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
  );
}
