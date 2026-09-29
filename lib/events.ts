import { prisma } from "@/lib/prisma";

export type EventTypeValue = "TASYAKURAN" | "BEDAH_BUKU";

export const EVENT_TYPE_LABEL: Record<EventTypeValue, string> = {
  TASYAKURAN: "Tasyakuran",
  BEDAH_BUKU: "Launching & Bedah Buku",
};

/**
 * Konten khusus per acara, disimpan di kolom Event.details (JSON).
 * Semua field opsional; template menyediakan nilai bawaan.
 */
export type EventDetails = {
  // Umum
  heading?: string; // label kecil di atas judul, mis. "Launching & Bedah Buku"
  organizer?: string; // teks footer
  maxGuests?: number; // jumlah orang yang boleh dibawa per undangan (bawaan 1)

  // Tasyakuran
  title?: string; // judul utama (boleh multi-baris)
  gateEyebrow?: string;
  gateTitle?: string;
  gateTagline?: string;
  flyer?: string; // path file di /public, mis. "/flyer.jpeg"
  performers?: string;

  // Bedah Buku
  bookTitle?: string;
  author?: string;
  synopsis?: string;
  cover?: string; // path file di /public
  speakers?: string; // satu per baris: "Nama | Peran"
  moderator?: string;
  rundown?: string; // satu per baris: "18.30 | Pembukaan"
  allowPreorder?: boolean;
  bookPrice?: string;
};

const STRING_KEYS = [
  "heading",
  "organizer",
  "title",
  "gateEyebrow",
  "gateTitle",
  "gateTagline",
  "flyer",
  "performers",
  "bookTitle",
  "author",
  "synopsis",
  "cover",
  "speakers",
  "moderator",
  "rundown",
  "bookPrice",
] as const;

// Field yang berupa path gambar: hanya boleh file di folder /public
const PATH_KEYS = new Set<string>(["flyer", "cover"]);

/** Membersihkan input dari form admin: hanya key yang dikenal, string dipangkas. */
export function sanitizeDetails(raw: unknown): EventDetails {
  const out: Record<string, unknown> = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  const src = raw as Record<string, unknown>;

  for (const key of STRING_KEYS) {
    const value = src[key];
    if (typeof value !== "string") continue;
    const trimmed = value.trim().slice(0, 4000);
    if (!trimmed) continue;
    if (PATH_KEYS.has(key) && (!trimmed.startsWith("/") || trimmed.startsWith("//"))) continue;
    out[key] = trimmed;
  }

  if (typeof src.allowPreorder === "boolean") out.allowPreorder = src.allowPreorder;

  const maxGuests = Number(src.maxGuests);
  if (Number.isFinite(maxGuests) && maxGuests >= 1) out.maxGuests = Math.min(10, Math.floor(maxGuests));

  return out as EventDetails;
}

export function getDetails(event: { details: unknown }): EventDetails {
  const d = event.details;
  return d && typeof d === "object" && !Array.isArray(d) ? (d as EventDetails) : {};
}

/** Sisa kursi untuk satu acara. excludeGuestId dipakai agar respons tamu itu sendiri tidak dihitung dua kali. */
export async function getRemainingSlots(eventId: string, quota: number, excludeGuestId?: string) {
  const aggregate = await prisma.guest.aggregate({
    where: {
      eventId,
      attendance: "HADIR",
      ...(excludeGuestId ? { id: { not: excludeGuestId } } : {}),
    },
    _sum: { guestCount: true },
  });
  return Math.max(0, quota - (aggregate._sum.guestCount || 0));
}

/** "Nama | Peran" per baris → daftar pasangan. */
export function parsePairs(text?: string): { left: string; right: string }[] {
  return (text ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const i = line.indexOf("|");
      return i === -1
        ? { left: line, right: "" }
        : { left: line.slice(0, i).trim(), right: line.slice(i + 1).trim() };
    });
}

// Semua acara memakai zona waktu WIB
const TZ = "Asia/Jakarta";

export function formatEventDate(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TZ,
  }).format(date);
}

export function formatEventTime(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: TZ,
  }).formatToParts(date);
  const hh = parts.find((p) => p.type === "hour")?.value ?? "00";
  const mm = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${hh}.${mm}`;
}

export function googleMapsEmbedSrc(query: string): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
}

/** Link "Tambahkan ke Google Calendar" (durasi bawaan 3 jam). */
export function googleCalendarUrl(opts: { title: string; start: Date; location: string; hours?: number }): string {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]|\.\d{3}/g, "");
  const end = new Date(opts.start.getTime() + (opts.hours ?? 3) * 60 * 60 * 1000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: opts.title,
    dates: `${fmt(opts.start)}/${fmt(end)}`,
    location: opts.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
