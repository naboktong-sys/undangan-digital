// Mengisi / memperbarui acara "Launching & Bedah Buku" sesuai flyer.
// Jalankan dari root proyek:
//   node --env-file=.env scripts/isi-bedah-buku.mjs
//
// - Kalau sudah ada acara BEDAH_BUKU: datanya diperbarui (isian details lain
//   seperti sinopsis/rundown yang sudah ada TIDAK ditimpa).
// - Kalau belum ada: acara baru dibuat.
// - Kalau ada lebih dari satu: skrip berhenti supaya tidak salah timpa.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const name = "Launching & Bedah Buku Historiografi Islam Nusantara";
const startsAt = new Date("2026-10-17T12:00:00+07:00"); // 12.00 WIB
const location =
  "Deka Hotel, Jl. Mayjen HR. Muhammad No.24, Putat Gede, Kec. Sukomanunggal, Surabaya, Jawa Timur 60189";
const mapsQuery = "Deka Hotel Surabaya";

const newDetails = {
  heading: "Launching & Bedah Buku",
  bookTitle: "Historiografi Islam Nusantara",
  author: "Prof. Dr. KH. Said Aqil Siroj, MA. & Imam Pituduh, S.H., M.H.",
  cover: "/historiografi-islam-nusantara-cover.jpg",
  speakers: "Prof. Dr. KH. Said Aqil Siroj | Penulis",
  organizer:
    "SASNU (Yayasan Sentral Agama & Sosial Nusantara) × LPOI (Lembaga Persahabatan Ormas Islam)",
  maxGuests: 1,
};

async function main() {
  const events = await prisma.event.findMany({ where: { type: "BEDAH_BUKU" } });

  if (events.length > 1) {
    console.log("Ada lebih dari satu acara Bedah Buku:");
    for (const e of events) console.log(` - ${e.id}  ${e.name}`);
    console.log("Skrip dihentikan supaya tidak salah timpa.");
    return;
  }

  if (events.length === 1) {
    const e = events[0];
    const old = e.details && typeof e.details === "object" && !Array.isArray(e.details) ? e.details : {};
    await prisma.event.update({
      where: { id: e.id },
      data: {
        name,
        startsAt,
        location,
        mapsQuery,
        details: { ...old, ...newDetails },
      },
    });
    console.log(`Acara diperbarui: ${e.id} (kuota tetap ${e.quota})`);
  } else {
    const e = await prisma.event.create({
      data: {
        name,
        type: "BEDAH_BUKU",
        startsAt,
        location,
        mapsQuery,
        quota: 100, // ganti lewat dashboard kalau kuotanya berbeda
        details: newDetails,
      },
    });
    console.log(`Acara dibuat: ${e.id} (kuota 100, sesuaikan lewat dashboard)`);
  }
}

main()
  .catch((err) => {
    console.error("Gagal:", err.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
