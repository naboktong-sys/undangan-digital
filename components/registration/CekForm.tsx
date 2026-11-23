"use client";

import { useState } from "react";
import Link from "next/link";

type Result = { found: false } | { found: true; name: string; registeredAt: string };

const inputClass =
  "w-full rounded-xl border-2 border-gray-300 bg-white px-4 py-4 text-xl text-gray-900 placeholder:text-gray-400 focus:border-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200";
const labelClass = "mb-2 block text-lg font-semibold text-gray-900";

export default function CekForm() {
  const [name, setName] = useState("");
  const [memberNo, setMemberNo] = useState("");
  const [institution, setInstitution] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch("/api/pendaftaran/cek", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, memberNo, institution }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Pengecekan gagal. Silakan coba lagi.");
      } else {
        setResult(data);
      }
    } catch {
      setError("Tidak bisa terhubung ke server. Periksa sinyal internet, lalu coba lagi.");
    }
    setLoading(false);
  }

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

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div>
          <label htmlFor="cek-name" className={labelClass}>
            Nama Lengkap
          </label>
          <input
            id="cek-name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tulis nama lengkap"
            maxLength={100}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="cek-memberNo" className={labelClass}>
            No. Keanggotaan
          </label>
          <input
            id="cek-memberNo"
            type="text"
            autoComplete="off"
            autoCapitalize="characters"
            value={memberNo}
            onChange={(e) => setMemberNo(e.target.value)}
            placeholder="Isi tanda - jika bukan pensiunan KAI"
            maxLength={30}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="cek-institution" className={labelClass}>
            Asal Instansi
          </label>
          <input
            id="cek-institution"
            type="text"
            autoComplete="organization"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            placeholder="Contoh: Pensiunan KAI"
            maxLength={100}
            className={inputClass}
          />
        </div>

        {error && (
          <div role="alert" className="rounded-xl border-2 border-red-500 bg-red-50 p-4 text-lg font-semibold text-red-800">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-emerald-700 py-5 text-2xl font-bold text-white shadow-lg active:bg-emerald-800 disabled:opacity-60"
        >
          {loading ? "Memeriksa..." : "CEK PENDAFTARAN"}
        </button>
      </form>

      {result && result.found && (
        <div className="mt-6 rounded-2xl border-2 border-emerald-600 bg-emerald-50 p-5 text-center">
          <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-4xl text-white">
            ✓
          </div>
          <p className="text-2xl font-bold text-emerald-900">Anda sudah terdaftar</p>
          <p className="mt-2 text-lg text-gray-700">
            Atas nama <strong>{result.name}</strong>
          </p>
          <p className="text-base text-gray-600">Didaftarkan pada {formatWaktu(result.registeredAt)} WIB</p>
        </div>
      )}

      {result && !result.found && (
        <div className="mt-6 rounded-2xl border-2 border-amber-500 bg-amber-50 p-5 text-center">
          <p className="text-2xl font-bold text-amber-900">Data belum ditemukan</p>
          <p className="mt-2 text-lg text-gray-700">
            Pastikan No. Keanggotaan sudah benar. Jika belum mendaftar, silakan daftar terlebih dahulu.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-xl bg-emerald-700 px-6 py-3 text-lg font-bold text-white active:bg-emerald-800"
          >
            Ke Halaman Pendaftaran
          </Link>
        </div>
      )}
    </div>
  );
}
