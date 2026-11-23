import type { Metadata } from "next";
import Link from "next/link";
import CekForm from "@/components/registration/CekForm";

export const metadata: Metadata = {
  title: "Cek Pendaftaran KAI - SASNU PEDULI Pemeriksaan USG ABDOMEN",
};

export default function CekPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 to-white pb-16">
      <div className="mx-auto max-w-xl px-4 pt-8">
        <Link href="/" className="text-lg font-semibold text-emerald-800 underline">
          ← Kembali ke pendaftaran
        </Link>
        <h1 className="mt-4 text-center text-2xl font-extrabold leading-snug text-emerald-900 sm:text-3xl">
          Cek Pendaftaran
          <br />
          KAI - SASNU PEDULI USG ABDOMEN
        </h1>
        <p className="mb-6 mt-3 text-center text-lg text-gray-700">
          Isi data yang sama seperti saat mendaftar untuk melihat apakah Anda sudah terdaftar.
        </p>
        <CekForm />
      </div>
    </main>
  );
}
