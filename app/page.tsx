import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import RegistrationForm from "@/components/registration/RegistrationForm";
import {
  REGISTRATION_CONTACT,
  formatEventDate,
  formatEventTime,
  getRegistrationState,
} from "@/lib/registration";

// Jumlah pendaftar & kuota berubah terus, jadi halaman ini tidak boleh di-cache.
export const dynamic = "force-dynamic";

const TITLE = "Pendaftaran KAI - SASNU PEDULI Pemeriksaan USG ABDOMEN";

export const metadata: Metadata = {
  title: TITLE,
  description:
    "Pendaftaran pemeriksaan kesehatan USG Abdomen bagi para pensiunan KAI dan lansia. Pengabdian Tak Berhenti, Kepedulian Tak Bertepi.",
  openGraph: {
    title: TITLE,
    description: "Pemeriksaan kesehatan USG Abdomen bagi para pensiunan KAI dan lansia.",
    images: [{ url: "/flyer-usg-abdomen.jpg", width: 1536, height: 1024 }],
  },
};

export default async function HomePage() {
  const { event, remaining, status } = await getRegistrationState();

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 to-white pb-16">
      <div className="mx-auto max-w-3xl px-4 pt-4 sm:pt-8">
        <Image
          src="/flyer-usg-abdomen.jpg"
          alt="Undangan KAI - SASNU Peduli Pemeriksaan Kesehatan USG Abdomen"
          width={1536}
          height={1024}
          priority
          className="h-auto w-full rounded-2xl shadow-lg"
        />
      </div>

      <div className="mx-auto mt-8 max-w-xl px-4">
        <h1 className="text-center text-2xl font-extrabold leading-snug text-emerald-900 sm:text-3xl">
          Pendaftaran
          <br />
          {event.name}
        </h1>

        {/* Info acara */}
        <div className="mt-6 space-y-4 rounded-2xl bg-white p-5 text-lg shadow-md ring-1 ring-emerald-100">
          <div>
            <p className="text-base text-gray-500">Hari / Tanggal</p>
            <p className="font-bold text-gray-900">{formatEventDate(event.startsAt)}</p>
          </div>
          <div>
            <p className="text-base text-gray-500">Waktu</p>
            <p className="font-bold text-gray-900">{formatEventTime(event.startsAt)} - selesai</p>
          </div>
          <div>
            <p className="text-base text-gray-500">Tempat</p>
            <p className="font-bold text-gray-900">{event.location}</p>
          </div>
          <div>
            <p className="text-base text-gray-500">Informasi</p>
            <a
              href={`https://wa.me/${REGISTRATION_CONTACT.waNumber}`}
              className="font-bold text-emerald-800 underline"
            >
              {REGISTRATION_CONTACT.name} {REGISTRATION_CONTACT.phoneLabel}
            </a>
          </div>
        </div>

        {/* Form / status */}
        <section className="mt-8">
          {status === "open" ? (
            <>
              <p className="mb-5 text-center text-lg text-gray-700">
                Silakan isi data di bawah ini. Pendaftaran hanya bisa dilakukan <strong>1 kali untuk 1 orang</strong>.
                Sisa kuota: <strong>{remaining}</strong> orang.
              </p>
              <RegistrationForm eventName={event.name} />
            </>
          ) : (
            <div className="rounded-2xl border-2 border-amber-500 bg-amber-50 p-6 text-center">
              <p className="text-2xl font-bold text-amber-900">
                {status === "full" ? "Kuota pendaftaran sudah penuh" : "Pendaftaran sudah ditutup"}
              </p>
              <p className="mt-2 text-lg text-gray-700">
                Mohon maaf, saat ini pendaftaran tidak bisa dilakukan. Untuk informasi lebih lanjut, silakan hubungi
                panitia.
              </p>
            </div>
          )}
        </section>

        <p className="mt-10 text-center text-lg text-gray-700">
          Sudah mendaftar?{" "}
          <Link href="/cek" className="font-bold text-emerald-800 underline">
            Cek pendaftaran Anda
          </Link>
        </p>
      </div>
    </main>
  );
}
