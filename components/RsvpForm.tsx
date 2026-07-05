"use client";

import { useState } from "react";

export default function RsvpForm({
  slug,
  alreadyResponded,
  remainingSlots,
}: {
  slug: string;
  alreadyResponded: boolean;
  remainingSlots: number;
}) {
  const [attendance, setAttendance] = useState<"HADIR" | "TIDAK_HADIR" | null>(null);
  const [guestCount, setGuestCount] = useState(1);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(alreadyResponded);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const quotaFull = remainingSlots <= 0 && !alreadyResponded;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!attendance) return;
    setLoading(true);
    setErrorMsg("");

    const res = await fetch(`/api/rsvp/${slug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attendance, guestCount, message }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setErrorMsg(data.message || "Terjadi kesalahan, coba lagi.");
      return;
    }

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="text-center py-8">
        <p className="text-yellow-500 text-lg font-medium">Terima kasih atas konfirmasinya 🙏</p>
        <p className="text-yellow-100/70 text-sm mt-2">Semoga berkah dan barokah selalu menyertai.</p>
      </div>
    );
  }

  if (quotaFull) {
    return (
      <div className="text-center py-8">
        <p className="text-yellow-500 text-lg font-medium">Mohon Maaf 🙏</p>
        <p className="text-yellow-100/70 text-sm mt-2">
          Kuota tamu untuk acara ini sudah penuh. Terima kasih atas perhatian dan doanya.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto">
      <p className="text-center text-yellow-100/80 mb-4">Konfirmasi kehadiran Anda</p>

      {errorMsg && (
        <p className="text-center text-red-400 text-sm mb-4 bg-red-950/30 border border-red-800/40 rounded-lg py-2 px-3">
          {errorMsg}
        </p>
      )}

      <div className="flex gap-3 mb-4">
        <button
          type="button"
          onClick={() => setAttendance("HADIR")}
          className={`flex-1 py-3 rounded-lg border transition ${
            attendance === "HADIR"
              ? "bg-yellow-600 border-yellow-600 text-black font-medium"
              : "border-yellow-600/40 text-yellow-100"
          }`}
        >
          Insya Allah Hadir
        </button>
        <button
          type="button"
          onClick={() => setAttendance("TIDAK_HADIR")}
          className={`flex-1 py-3 rounded-lg border transition ${
            attendance === "TIDAK_HADIR"
              ? "bg-red-700 border-red-700 text-white font-medium"
              : "border-yellow-600/40 text-yellow-100"
          }`}
        >
          Tidak Bisa Hadir
        </button>
      </div>

      {attendance === "HADIR" && (
        <div className="mb-4">
          <label className="text-sm text-yellow-100/70 block mb-1">Jumlah yang hadir</label>
          <input
            type="number"
            min={1}
            max={Math.min(2, remainingSlots)}
            value={guestCount}
            onChange={(e) => setGuestCount(Number(e.target.value))}
            className="w-full bg-white/10 border border-yellow-600/40 rounded-lg px-3 py-2 text-yellow-50"
          />
          <p className="text-xs text-yellow-100/50 mt-1">Undangan ini berlaku untuk 1 orang tamu.</p>
        </div>
      )}

      <div className="mb-4">
        <label className="text-sm text-yellow-100/70 block mb-1">Ucapan & doa (opsional)</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="w-full bg-white/10 border border-yellow-600/40 rounded-lg px-3 py-2 text-yellow-50"
          placeholder="Tuliskan ucapan atau doa Anda..."
        />
      </div>

      <button
        type="submit"
        disabled={!attendance || loading}
        className="w-full bg-yellow-600 text-black font-medium py-3 rounded-lg disabled:opacity-40"
      >
        {loading ? "Mengirim..." : "Kirim Konfirmasi"}
      </button>
    </form>
  );
}