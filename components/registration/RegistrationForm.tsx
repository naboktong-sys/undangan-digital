"use client";

import { useState } from "react";
import SignaturePad from "./SignaturePad";

type Done = { name: string; memberNo: string; institution: string; createdAt: string };

const inputClass =
  "w-full rounded-xl border-2 border-gray-300 bg-white px-4 py-4 text-xl text-gray-900 placeholder:text-gray-400 focus:border-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200";
const labelClass = "mb-2 block text-lg font-semibold text-gray-900";

function formatWaktu(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  })
    .format(new Date(iso))
    .replace(":", ".");
}

export default function RegistrationForm({ eventName }: { eventName: string }) {
  const [name, setName] = useState("");
  const [memberNo, setMemberNo] = useState("");
  const [institution, setInstitution] = useState("");
  const [website, setWebsite] = useState(""); // kolom jebakan bot
  const [signature, setSignature] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<Done | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError("");

    if (!signature) {
      setError("Mohon isi tanda tangan terlebih dahulu.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/pendaftaran", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, memberNo, institution, signature, website }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Pendaftaran gagal. Silakan coba lagi.");
        setSubmitting(false);
        return;
      }
      setDone({ ...data.registrant, createdAt: data.registrant.createdAt });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Tidak bisa terhubung ke server. Periksa sinyal internet, lalu coba lagi.");
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border-2 border-emerald-600 bg-emerald-50 p-6 text-center">
        <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-600 text-5xl text-white">
          ✓
        </div>
        <h2 className="text-2xl font-bold text-emerald-900">Pendaftaran Berhasil</h2>
        <p className="mt-1 text-lg text-gray-700">{eventName}</p>

        <dl className="mt-5 space-y-3 rounded-xl bg-white p-4 text-left text-lg shadow-sm">
          <div>
            <dt className="text-base text-gray-500">Nama Lengkap</dt>
            <dd className="font-semibold text-gray-900">{done.name}</dd>
          </div>
          <div>
            <dt className="text-base text-gray-500">No. Keanggotaan</dt>
            <dd className="font-semibold text-gray-900">{done.memberNo}</dd>
          </div>
          <div>
            <dt className="text-base text-gray-500">Asal Instansi</dt>
            <dd className="font-semibold text-gray-900">{done.institution}</dd>
          </div>
          <div>
            <dt className="text-base text-gray-500">Waktu Pendaftaran</dt>
            <dd className="font-semibold text-gray-900">{formatWaktu(done.createdAt)} WIB</dd>
          </div>
        </dl>

        <p className="mt-5 text-lg text-gray-700">
          Terima kasih. Silakan simpan (screenshot) halaman ini sebagai bukti pendaftaran.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div>
        <label htmlFor="name" className={labelClass}>
          1. Nama Lengkap
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tulis nama lengkap"
          maxLength={100}
          required
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="memberNo" className={labelClass}>
          2. No. Keanggotaan
        </label>
        <input
          id="memberNo"
          type="text"
          autoComplete="off"
          autoCapitalize="characters"
          value={memberNo}
          onChange={(e) => setMemberNo(e.target.value)}
          placeholder="Nomor anggota pensiunan KAI"
          maxLength={30}
          required
          className={inputClass}
        />
        <p className="mt-2 text-base text-gray-600">
          Bukan pensiunan KAI? Isi dengan tanda <strong>-</strong>
        </p>
        <button
          type="button"
          onClick={() => setMemberNo("-")}
          className="mt-2 rounded-xl border-2 border-emerald-700 px-4 py-2.5 text-base font-semibold text-emerald-800 active:bg-emerald-100"
        >
          Saya bukan pensiunan KAI
        </button>
      </div>

      <div>
        <label htmlFor="institution" className={labelClass}>
          3. Asal Instansi
        </label>
        <input
          id="institution"
          type="text"
          autoComplete="organization"
          value={institution}
          onChange={(e) => setInstitution(e.target.value)}
          placeholder="Contoh: Pensiunan KAI"
          maxLength={100}
          required
          className={inputClass}
        />
      </div>

      <div>
        <span className={labelClass}>4. Tanda Tangan</span>
        <p className="mb-3 text-base text-gray-600">Goreskan jari Anda pada kotak di bawah ini.</p>
        <SignaturePad onChange={setSignature} disabled={submitting} />
      </div>

      {/* Kolom jebakan bot: tidak terlihat oleh pengguna */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border-2 border-red-500 bg-red-50 p-4 text-lg font-semibold text-red-800">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-2xl bg-emerald-700 py-5 text-2xl font-bold text-white shadow-lg active:bg-emerald-800 disabled:opacity-60"
      >
        {submitting ? "Mengirim..." : "DAFTAR SEKARANG"}
      </button>
    </form>
  );
}
