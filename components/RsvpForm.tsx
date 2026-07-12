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
      body: JSON.stringify({ attendance, message }),
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
        <p className="text-yellow-700 text-xl font-semibold">Terima kasih atas konfirmasinya 🙏</p>
        <p className="text-amber-900/80 text-base mt-2">Semoga berkah dan barokah selalu menyertai.</p>
      </div>
    );
  }

  if (quotaFull) {
    return (
      <div className="text-center py-8">
        <p className="text-yellow-700 text-xl font-semibold">Mohon Maaf 🙏</p>
        <p className="text-amber-900/80 text-base mt-2">
          Kuota tamu untuk acara ini sudah penuh. Terima kasih atas perhatian dan doanya.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto">
      <p className="text-center text-amber-900 text-lg font-medium mb-1">Konfirmasi kehadiran Anda</p>
      <p className="text-center text-amber-800/70 text-sm mb-4">Undangan ini berlaku untuk 1 orang</p>

      {errorMsg && (
        <p className="text-center text-red-700 text-base mb-4 bg-red-50 border border-red-300 rounded-lg py-2 px-3">
          {errorMsg}
        </p>
      )}

      <div className="flex gap-3 mb-4">
        <button
          type="button"
          onClick={() => setAttendance("HADIR")}
          className={`flex-1 py-3 rounded-lg border text-base transition ${
            attendance === "HADIR"
              ? "bg-yellow-600 border-yellow-600 text-white font-semibold"
              : "border-yellow-600 text-amber-900 font-medium bg-white/40"
          }`}
        >
          Insya Allah Hadir
        </button>
        <button
          type="button"
          onClick={() => setAttendance("TIDAK_HADIR")}
          className={`flex-1 py-3 rounded-lg border text-base transition ${
            attendance === "TIDAK_HADIR"
              ? "bg-red-700 border-red-700 text-white font-semibold"
              : "border-yellow-600 text-amber-900 font-medium bg-white/40"
          }`}
        >
          Tidak Bisa Hadir
        </button>
      </div>

      <div className="mb-4">
        <label className="text-base text-amber-900 font-medium block mb-1">Ucapan & doa (opsional)</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="w-full bg-white border border-yellow-600/60 rounded-lg px-3 py-2 text-amber-950 text-base placeholder:text-amber-700/50"
          placeholder="Tuliskan ucapan atau doa Anda..."
        />
      </div>

      <button
        type="submit"
        disabled={!attendance || loading}
        className="w-full bg-yellow-600 text-white text-lg font-semibold py-3 rounded-lg disabled:opacity-40"
      >
        {loading ? "Mengirim..." : "Kirim Konfirmasi"}
      </button>
    </form>
  );
}