"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type EventTypeValue = "TASYAKURAN" | "BEDAH_BUKU";

export type EventItem = {
  id: string;
  name: string;
  type: EventTypeValue;
  startsAt: Date;
  location: string;
  mapsQuery: string | null;
  quota: number;
  details: unknown;
};

export const TYPE_LABEL: Record<EventTypeValue, string> = {
  TASYAKURAN: "Tasyakuran",
  BEDAH_BUKU: "Launching & Bedah Buku",
};

type FormState = {
  name: string;
  type: EventTypeValue;
  startsAt: string; // format datetime-local, waktu WIB
  location: string;
  mapsQuery: string;
  quota: string;
  maxGuests: string;
  heading: string;
  organizer: string;
  // Tasyakuran
  title: string;
  gateEyebrow: string;
  gateTitle: string;
  gateTagline: string;
  flyer: string;
  performers: string;
  // Bedah Buku
  bookTitle: string;
  author: string;
  synopsis: string;
  cover: string;
  speakers: string;
  moderator: string;
  rundown: string;
  bookPrice: string;
  allowPreorder: boolean;
};

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

function toWibInput(date: Date): string {
  return new Date(new Date(date).getTime() + WIB_OFFSET_MS).toISOString().slice(0, 16);
}

function buildInitial(event: EventItem | null): FormState {
  const d = ((event?.details ?? {}) as Record<string, unknown>) || {};
  const s = (k: string) => (typeof d[k] === "string" ? (d[k] as string) : "");

  return {
    name: event?.name ?? "",
    type: event?.type ?? "BEDAH_BUKU",
    startsAt: event ? toWibInput(event.startsAt) : "",
    location: event?.location ?? "",
    mapsQuery: event?.mapsQuery ?? "",
    quota: String(event?.quota ?? 100),
    maxGuests: typeof d.maxGuests === "number" ? String(d.maxGuests) : "1",
    heading: s("heading") || (event ? "" : "Launching & Bedah Buku"),
    organizer: s("organizer"),
    title: s("title"),
    gateEyebrow: s("gateEyebrow"),
    gateTitle: s("gateTitle"),
    gateTagline: s("gateTagline"),
    flyer: s("flyer"),
    performers: s("performers"),
    bookTitle: s("bookTitle"),
    author: s("author"),
    synopsis: s("synopsis"),
    cover: s("cover"),
    speakers: s("speakers"),
    moderator: s("moderator"),
    rundown: s("rundown"),
    bookPrice: s("bookPrice"),
    allowPreorder: d.allowPreorder === true,
  };
}

const inputClass = "w-full border rounded px-3 py-2 text-sm bg-white";

// `wide` = memenuhi 2 kolom di desktop (md ke atas); default setengah lebar.
function Field({
  label,
  hint,
  wide,
  children,
}: {
  label: string;
  hint?: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`mb-3 ${wide ? "md:col-span-2" : ""}`}>
      <label className="text-xs text-gray-500 block mb-1">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

export default function EventModal({
  mode,
  event,
  onClose,
}: {
  mode: "create" | "edit";
  event: EventItem | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => buildInitial(mode === "edit" ? event : null));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const common = {
      heading: form.heading,
      organizer: form.organizer,
      maxGuests: Number(form.maxGuests) || 1,
    };
    const details =
      form.type === "BEDAH_BUKU"
        ? {
            ...common,
            bookTitle: form.bookTitle,
            author: form.author,
            synopsis: form.synopsis,
            cover: form.cover,
            speakers: form.speakers,
            moderator: form.moderator,
            rundown: form.rundown,
            bookPrice: form.bookPrice,
            allowPreorder: form.allowPreorder,
          }
        : {
            ...common,
            title: form.title,
            gateEyebrow: form.gateEyebrow,
            gateTitle: form.gateTitle,
            gateTagline: form.gateTagline,
            flyer: form.flyer,
            performers: form.performers,
          };

    const payload = {
      name: form.name,
      type: form.type,
      // input datetime-local diisi dalam WIB
      startsAt: form.startsAt ? new Date(`${form.startsAt}:00+07:00`).toISOString() : "",
      location: form.location,
      mapsQuery: form.mapsQuery,
      quota: Number(form.quota),
      details,
    };

    const res =
      mode === "edit" && event
        ? await fetch(`/api/events/${event.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error || "Gagal menyimpan acara, coba lagi.");
      return;
    }

    const saved = await res.json();
    onClose();
    router.push(`/admin/dashboard?event=${saved.id}`);
    router.refresh();
  }

  const isBook = form.type === "BEDAH_BUKU";

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-3 md:p-6"
      onClick={onClose}
    >
      {/* Kartu modal: lebar bertahap (mobile → tablet → desktop), tinggi dibatasi & isi bisa di-scroll */}
      <div
        className="bg-white rounded-lg shadow-lg w-full max-w-lg md:max-w-3xl lg:max-w-4xl max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 md:px-8 pt-5 md:pt-6 pb-3 border-b shrink-0">
          <h2 className="text-lg font-semibold">{mode === "edit" ? "Edit Acara" : "Acara Baru"}</h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
          {/* Badan form: scroll di sini, 2 kolom di desktop */}
          <div className="flex-1 overflow-y-auto px-5 md:px-8 py-4 md:grid md:grid-cols-2 md:gap-x-5 md:content-start">
            <Field
              wide
              label="Jenis acara"
              hint={mode === "edit" ? "Jenis acara tidak bisa diubah setelah dibuat." : undefined}
            >
              <select
                value={form.type}
                onChange={(e) => set("type", e.target.value as EventTypeValue)}
                disabled={mode === "edit"}
                className={`${inputClass} disabled:bg-gray-100`}
              >
                <option value="BEDAH_BUKU">{TYPE_LABEL.BEDAH_BUKU}</option>
                <option value="TASYAKURAN">{TYPE_LABEL.TASYAKURAN}</option>
              </select>
            </Field>

            <Field wide label="Nama acara (untuk dashboard & daftar hadir)">
              <input
                type="text"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className={inputClass}
                required
              />
            </Field>

            <Field label="Tanggal & waktu (WIB)">
              <input
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => set("startsAt", e.target.value)}
                className={inputClass}
                required
              />
            </Field>
            <Field label="Kuota total kursi">
              <input
                type="number"
                min={1}
                value={form.quota}
                onChange={(e) => set("quota", e.target.value)}
                className={inputClass}
                required
              />
            </Field>

            <Field wide label="Lokasi (alamat lengkap)">
              <textarea
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                rows={2}
                className={inputClass}
                required
              />
            </Field>

            <Field
              wide={isBook}
              label="Kata kunci Google Maps (opsional)"
              hint="Kalau kosong, alamat lokasi dipakai untuk peta."
            >
              <input
                type="text"
                value={form.mapsQuery}
                onChange={(e) => set("mapsQuery", e.target.value)}
                className={inputClass}
              />
            </Field>

            {!isBook && (
              <Field label="Maks. orang per undangan" hint="1 = undangan hanya untuk satu orang.">
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={form.maxGuests}
                  onChange={(e) => set("maxGuests", e.target.value)}
                  className={inputClass}
                />
              </Field>
            )}

            <div className="md:col-span-2">
              <hr className="my-3" />
              <p className="text-xs font-semibold text-gray-600 mb-3">
                Konten undangan — {TYPE_LABEL[form.type]}
              </p>
            </div>

            <Field label="Label di atas judul">
              <input
                type="text"
                value={form.heading}
                onChange={(e) => set("heading", e.target.value)}
                className={inputClass}
                placeholder={isBook ? "Launching & Bedah Buku" : "Tasyakuran Harlah ke-73"}
              />
            </Field>

            {isBook ? (
              <>
                <Field label="Judul buku">
                  <input
                    type="text"
                    value={form.bookTitle}
                    onChange={(e) => set("bookTitle", e.target.value)}
                    className={inputClass}
                    required
                  />
                </Field>
                <Field label="Penulis">
                  <input
                    type="text"
                    value={form.author}
                    onChange={(e) => set("author", e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Moderator">
                  <input
                    type="text"
                    value={form.moderator}
                    onChange={(e) => set("moderator", e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field wide label="Sinopsis singkat">
                  <textarea
                    value={form.synopsis}
                    onChange={(e) => set("synopsis", e.target.value)}
                    rows={3}
                    className={inputClass}
                  />
                </Field>
                <Field
                  wide
                  label="Sampul buku (path di folder public)"
                  hint="Taruh file gambar di folder public, lalu isi path-nya, mis. /buku-cover.jpg"
                >
                  <input
                    type="text"
                    value={form.cover}
                    onChange={(e) => set("cover", e.target.value)}
                    className={inputClass}
                    placeholder="/buku-cover.jpg"
                  />
                </Field>
                <Field label="Pembicara / pembedah" hint="Satu orang per baris, format: Nama | Peran">
                  <textarea
                    value={form.speakers}
                    onChange={(e) => set("speakers", e.target.value)}
                    rows={5}
                    className={inputClass}
                    placeholder={"Dr. Fulan, M.A. | Pembedah\nProf. Fulanah | Penulis"}
                  />
                </Field>
                <Field label="Susunan acara" hint="Satu agenda per baris, format: Jam | Kegiatan">
                  <textarea
                    value={form.rundown}
                    onChange={(e) => set("rundown", e.target.value)}
                    rows={5}
                    className={inputClass}
                    placeholder={"18.30 | Pembukaan\n19.00 | Launching buku\n19.30 | Bedah buku\n20.30 | Tanya jawab & tanda tangan buku"}
                  />
                </Field>
              </>
            ) : (
              <>
                <Field label="Special performance (opsional)">
                  <input
                    type="text"
                    value={form.performers}
                    onChange={(e) => set("performers", e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field wide label="Judul utama" hint="Boleh lebih dari satu baris.">
                  <textarea
                    value={form.title}
                    onChange={(e) => set("title", e.target.value)}
                    rows={2}
                    className={inputClass}
                  />
                </Field>
                <Field wide label="Flyer (path di folder public)" hint="Mis. /flyer.jpeg">
                  <input
                    type="text"
                    value={form.flyer}
                    onChange={(e) => set("flyer", e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <div className="md:col-span-2">
                  <p className="text-[11px] text-gray-400 mb-2">
                    Teks layar pembuka (opsional — kalau kosong mengikuti judul di atas)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-3">
                    <Field label="Baris atas">
                      <input
                        type="text"
                        value={form.gateEyebrow}
                        onChange={(e) => set("gateEyebrow", e.target.value)}
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Judul besar">
                      <input
                        type="text"
                        value={form.gateTitle}
                        onChange={(e) => set("gateTitle", e.target.value)}
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Baris bawah">
                      <input
                        type="text"
                        value={form.gateTagline}
                        onChange={(e) => set("gateTagline", e.target.value)}
                        className={inputClass}
                      />
                    </Field>
                  </div>
                </div>
              </>
            )}

            <Field wide label="Teks footer penyelenggara (opsional)">
              <input
                type="text"
                value={form.organizer}
                onChange={(e) => set("organizer", e.target.value)}
                className={inputClass}
              />
            </Field>

            {error && (
              <p className="md:col-span-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2 mb-3">
                {error}
              </p>
            )}
          </div>

          {/* Footer tetap terlihat, tombol tidak ikut ter-scroll */}
          <div className="flex gap-2 justify-end px-5 md:px-8 py-3 md:py-4 border-t shrink-0 bg-white rounded-b-lg">
            <button
              type="button"
              onClick={onClose}
              className="text-sm px-4 py-2 rounded border text-gray-600 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="text-sm px-4 py-2 rounded bg-black text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {saving ? "Menyimpan..." : mode === "edit" ? "Simpan" : "Buat Acara"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
