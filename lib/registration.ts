import { prisma } from "@/lib/prisma";

/**
 * Pendaftaran terbuka (satu link untuk semua orang), mis. KAI - SASNU PEDULI
 * Pemeriksaan USG Abdomen. Berbeda dengan undangan: tidak ada slug per tamu.
 */

export const REGISTRATION_SLUG = "usg-abdomen-2026";

export const REGISTRATION_DEFAULTS = {
  slug: REGISTRATION_SLUG,
  name: "KAI - SASNU PEDULI Pemeriksaan USG ABDOMEN",
  // 09.00 WIB = 02.00 UTC
  startsAt: new Date("2026-11-28T02:00:00.000Z"),
  location: "Sekretariat SASNU, Jl. Wirajasa No. H9A, Cipinang Melayu, Makasar, Jakarta Timur 13620",
  quota: 150,
};

export const REGISTRATION_CONTACT = {
  name: "Vina",
  phoneLabel: "+62 855-3661-6665",
  waNumber: "6285536616665",
};

/** Nilai No. Keanggotaan untuk peserta yang bukan pensiunan KAI. */
export const NO_MEMBER = "-";

const TIME_ZONE = "Asia/Jakarta";

// ---------------------------------------------------------------------------
// Acara
// ---------------------------------------------------------------------------

/** Ambil acara pendaftaran; dibuat otomatis dengan nilai bawaan bila belum ada. */
export async function getRegistrationEvent() {
  const found = await prisma.registrationEvent.findUnique({ where: { slug: REGISTRATION_SLUG } });
  if (found) return found;
  try {
    return await prisma.registrationEvent.create({ data: REGISTRATION_DEFAULTS });
  } catch (err) {
    // Dua pengunjung pertama bisa membuat bersamaan: ambil yang sudah dibuat.
    const again = await prisma.registrationEvent.findUnique({ where: { slug: REGISTRATION_SLUG } });
    if (again) return again;
    throw err;
  }
}

export type RegistrationStatus = "open" | "full" | "closed";

export async function getRegistrationState() {
  const event = await getRegistrationEvent();
  const used = await prisma.registrant.count({ where: { eventId: event.id } });
  const remaining = Math.max(event.quota - used, 0);
  const status: RegistrationStatus = !event.isOpen ? "closed" : remaining <= 0 ? "full" : "open";
  return { event, used, remaining, status };
}

export function formatEventDate(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TIME_ZONE,
  }).format(date);
}

export function formatEventTime(date: Date): string {
  const t = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TIME_ZONE,
  }).format(date);
  return `${t.replace(":", ".")} WIB`;
}

export function formatDateTimeId(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TIME_ZONE,
  })
    .format(date)
    .replace(":", ".");
}

// ---------------------------------------------------------------------------
// Validasi & normalisasi isian
// ---------------------------------------------------------------------------

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

/** Rapikan No. Keanggotaan: tanpa spasi, huruf besar; "-", "--", "—" dst. jadi "-". */
export function normalizeMemberNo(value: unknown): string {
  if (typeof value !== "string") return "";
  const s = value.replace(/\s+/g, "").toUpperCase();
  if (/^[-–—_.]+$/.test(s)) return NO_MEMBER;
  return s;
}

function keyText(value: string): string {
  return value.normalize("NFKD").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
}

/**
 * Kunci anti-dobel. Pensiunan KAI: berdasarkan No. Keanggotaan.
 * Non-pensiunan ("-"): berdasarkan kombinasi nama + asal instansi.
 */
export function buildUniqueKey(memberNo: string, name: string, institution: string): string {
  if (memberNo !== NO_MEMBER) return `NO:${memberNo}`;
  return `NM:${keyText(name)}|${keyText(institution)}`;
}

export type Identity = { name: string; memberNo: string; institution: string; uniqueKey: string };

export function parseIdentity(body: unknown): { ok: true; data: Identity } | { ok: false; error: string } {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;

  const name = cleanText(b.name);
  if (name.length < 2 || !/\p{L}/u.test(name)) {
    return { ok: false, error: "Nama lengkap wajib diisi." };
  }
  if (name.length > 100) return { ok: false, error: "Nama terlalu panjang (maksimal 100 huruf)." };

  const memberNo = normalizeMemberNo(b.memberNo);
  if (!memberNo) {
    return { ok: false, error: "No. Keanggotaan wajib diisi. Jika bukan pensiunan KAI, isi dengan tanda -" };
  }
  if (memberNo.length > 30 || !/^[A-Z0-9\-/._]+$/.test(memberNo)) {
    return { ok: false, error: "No. Keanggotaan tidak valid. Gunakan huruf/angka saja, atau - jika bukan pensiunan KAI." };
  }

  const institution = cleanText(b.institution);
  if (institution.length < 2) return { ok: false, error: "Asal instansi wajib diisi." };
  if (institution.length > 100) return { ok: false, error: "Asal instansi terlalu panjang (maksimal 100 huruf)." };

  return {
    ok: true,
    data: { name, memberNo, institution, uniqueKey: buildUniqueKey(memberNo, name, institution) },
  };
}

const PNG_PREFIX = "data:image/png;base64,iVBORw0KGgo";
const MAX_SIGNATURE_LENGTH = 200_000; // karakter base64 (±150 KB)

export function isValidSignature(value: unknown): value is string {
  return typeof value === "string" && value.startsWith(PNG_PREFIX) && value.length <= MAX_SIGNATURE_LENGTH;
}

/** "Budi Santoso" -> "B*** S******" (untuk halaman cek mandiri). */
export function maskName(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0) + "*".repeat(Math.max(w.length - 1, 2)))
    .join(" ");
}

export function duplicateMessage(memberNo: string): string {
  return memberNo === NO_MEMBER
    ? "Nama dan asal instansi ini sudah terdaftar. Pendaftaran hanya bisa 1 kali."
    : "No. Keanggotaan ini sudah terdaftar. Pendaftaran hanya bisa 1 kali.";
}
