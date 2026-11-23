import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatEventDate, formatEventTime, getRegistrationEvent } from "@/lib/registration";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";

// Halaman cetak daftar peserta (urut abjad). Gunakan "Cetak / Simpan PDF" lalu pilih Save as PDF.
export default async function CetakPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const event = await getRegistrationEvent();
  const rows = await prisma.registrant.findMany({
    where: { eventId: event.id },
    orderBy: { name: "asc" },
    select: { id: true, name: true, memberNo: true, institution: true, attended: true },
  });

  return (
    <div className="mx-auto max-w-5xl bg-white p-6 text-black">
      <style>{`
        @page { size: A4 portrait; margin: 12mm; }
        @media print { body { background: #fff !important; } tr { break-inside: avoid; } }
      `}</style>

      <div className="mb-4 flex items-center justify-between print:hidden">
        <a href="/admin/pendaftaran" className="text-sm text-gray-500 hover:text-black">
          ← Kembali
        </a>
        <PrintButton />
      </div>

      <div className="mb-4 text-center">
        <h1 className="text-lg font-bold uppercase">Daftar Peserta</h1>
        <p className="font-semibold">{event.name}</p>
        <p className="text-sm">
          {formatEventDate(event.startsAt)} · {formatEventTime(event.startsAt)} · {event.location}
        </p>
        <p className="mt-1 text-xs text-gray-600">Jumlah terdaftar: {rows.length} orang</p>
      </div>

      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-400 px-2 py-1.5 w-8">No</th>
            <th className="border border-gray-400 px-2 py-1.5 text-left">Nama Lengkap</th>
            <th className="border border-gray-400 px-2 py-1.5 text-left">No. Keanggotaan</th>
            <th className="border border-gray-400 px-2 py-1.5 text-left">Asal Instansi</th>
            <th className="border border-gray-400 px-2 py-1.5 w-32">Tanda Tangan</th>
            <th className="border border-gray-400 px-2 py-1.5 w-12">Hadir</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id}>
              <td className="border border-gray-400 px-2 py-1 text-center">{i + 1}</td>
              <td className="border border-gray-400 px-2 py-1">{r.name}</td>
              <td className="border border-gray-400 px-2 py-1 font-mono">{r.memberNo}</td>
              <td className="border border-gray-400 px-2 py-1">{r.institution}</td>
              <td className="border border-gray-400 px-1 py-0.5 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/admin/pendaftaran/${r.id}/signature`}
                  alt=""
                  className="mx-auto h-9 w-auto max-w-full object-contain"
                />
              </td>
              <td className="border border-gray-400 px-2 py-1 text-center text-base">{r.attended ? "☑" : "☐"}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} className="border border-gray-400 px-2 py-6 text-center text-gray-500">
                Belum ada yang mendaftar.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
