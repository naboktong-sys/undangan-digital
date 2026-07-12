"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Guest = {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  phone: string | null;
  invited: boolean;
  attendance: "PENDING" | "HADIR" | "TIDAK_HADIR";
  guestCount: number | null;
  message: string | null;
};

type Stats = {
  total: number;
  hadir: number;
  tidakHadir: number;
  pending: number;
  quotaUsed: number;
  quotaMax: number;
};

function maskPhone(phone: string): string {
  const digits = phone.replace(/\s+/g, "");
  if (digits.length <= 6) return "•".repeat(digits.length);
  const start = digits.slice(0, 4);
  const end = digits.slice(-2);
  const middleLength = digits.length - start.length - end.length;
  return `${start}${"•".repeat(middleLength)}${end}`;
}

export default function DashboardClient({
  initialGuests,
  stats,
}: {
  initialGuests: Guest[];
  stats: Stats;
}) {
  const router = useRouter();
  const [guests, setGuests] = useState(initialGuests);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revealedPhones, setRevealedPhones] = useState<Set<string>>(new Set());

  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  async function handleAddGuest(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);

    const res = await fetch("/api/guests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, category, phone }),
    });

    const newGuest = await res.json();
    setGuests([newGuest, ...guests]);
    setName("");
    setCategory("");
    setPhone("");
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Yakin hapus tamu ini?")) return;
    await fetch(`/api/guests/${id}`, { method: "DELETE" });
    setGuests(guests.filter((g) => g.id !== id));
  }

  async function handleToggleInvited(id: string, invited: boolean) {
    await fetch(`/api/guests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invited: !invited }),
    });
    setGuests(guests.map((g) => (g.id === id ? { ...g, invited: !invited } : g)));
  }

  function togglePhoneVisibility(id: string) {
    setRevealedPhones((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function openEditModal(guest: Guest) {
    setEditingGuest(guest);
    setEditName(guest.name);
    setEditCategory(guest.category || "");
    setEditPhone(guest.phone || "");
  }

  function closeEditModal() {
    setEditingGuest(null);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingGuest || !editName.trim()) return;
    setEditSaving(true);

    const res = await fetch(`/api/guests/${editingGuest.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName.trim(),
        category: editCategory.trim() || null,
        phone: editPhone.trim() || null,
      }),
    });

    setEditSaving(false);

    if (res.ok) {
      const updated = await res.json();
      setGuests(guests.map((g) => (g.id === updated.id ? { ...g, ...updated } : g)));
      closeEditModal();
    } else {
      alert("Gagal menyimpan perubahan, coba lagi.");
    }
  }

  function copyLink(slug: string, id: string) {
    const url = `${window.location.origin}/undangan/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  const attendanceLabel: Record<Guest["attendance"], string> = {
    PENDING: "Menunggu",
    HADIR: "Hadir",
    TIDAK_HADIR: "Tidak Hadir",
  };

  const attendanceColor: Record<Guest["attendance"], string> = {
    PENDING: "bg-gray-100 text-gray-600",
    HADIR: "bg-green-100 text-green-700",
    TIDAK_HADIR: "bg-red-100 text-red-700",
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <h1 className="text-xl md:text-2xl font-semibold">Dashboard Undangan</h1>
          <div className="flex items-center gap-3 md:gap-4">
            <a
              href="/api/attendance-list"
              className="text-xs md:text-sm bg-black text-white px-3 py-1.5 md:px-4 md:py-2 rounded hover:bg-gray-800 whitespace-nowrap"
            >
              Cetak Daftar Hadir
            </a>
            <button onClick={handleLogout} className="text-xs md:text-sm text-gray-500 hover:text-black">
              Logout
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <StatCard label="Total Tamu" value={stats.total} />
          <StatCard label="Hadir" value={stats.hadir} accent="text-green-600" />
          <StatCard label="Tidak Hadir" value={stats.tidakHadir} accent="text-red-600" />
          <StatCard label="Menunggu" value={stats.pending} accent="text-gray-500" />
        </div>

        {/* Indikator Kuota */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-gray-500">Kuota Tamu Hadir</p>
            <p className="text-sm font-medium">
              {stats.quotaUsed} / {stats.quotaMax}
            </p>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-2.5 rounded-full transition-all ${
                stats.quotaUsed >= stats.quotaMax
                  ? "bg-red-500"
                  : stats.quotaUsed / stats.quotaMax > 0.85
                  ? "bg-yellow-500"
                  : "bg-green-500"
              }`}
              style={{ width: `${Math.min(100, (stats.quotaUsed / stats.quotaMax) * 100)}%` }}
            />
          </div>
          {stats.quotaUsed >= stats.quotaMax && (
            <p className="text-xs text-red-500 mt-2">
              Kuota sudah penuh — tamu baru tidak bisa lagi konfirmasi hadir.
            </p>
          )}
        </div>

        {/* Form tambah tamu */}
        <form onSubmit={handleAddGuest} className="bg-white p-4 rounded-lg shadow-sm mb-6 flex gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Nama tamu"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border rounded px-3 py-2 flex-1 min-w-[140px] text-sm"
            required
          />
          <input
            type="text"
            placeholder="Kategori"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border rounded px-3 py-2 flex-1 min-w-[120px] text-sm"
          />
          <input
            type="text"
            placeholder="No. WA (opsional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="border rounded px-3 py-2 flex-1 min-w-[140px] text-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white px-5 py-2 rounded hover:bg-gray-800 text-sm whitespace-nowrap"
          >
            {loading ? "Menambah..." : "+ Tambah Tamu"}
          </button>
        </form>

        {/* ===== TAMPILAN TABEL (desktop, md ke atas) ===== */}
        <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="px-3 py-2.5">Nama</th>
                <th className="px-3 py-2.5">Kategori</th>
                <th className="px-3 py-2.5">No. WA</th>
                <th className="px-3 py-2.5">Kirim</th>
                <th className="px-3 py-2.5">RSVP</th>
                <th className="px-3 py-2.5">Jml</th>
                <th className="px-3 py-2.5">Ucapan</th>
                <th className="px-3 py-2.5">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {guests.map((g) => {
                const isRevealed = revealedPhones.has(g.id);
                return (
                  <tr key={g.id} className="border-t align-middle">
                    <td className="px-3 py-2.5 font-medium max-w-[160px] truncate">{g.name}</td>
                    <td className="px-3 py-2.5 text-gray-500 max-w-[100px] truncate">{g.category || "-"}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {g.phone ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-gray-700 text-xs">
                            {isRevealed ? g.phone : maskPhone(g.phone)}
                          </span>
                          <button
                            onClick={() => togglePhoneVisibility(g.id)}
                            className="text-xs text-blue-600 hover:underline shrink-0"
                          >
                            {isRevealed ? "Sembunyikan" : "Lihat"}
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <button
                        onClick={() => handleToggleInvited(g.id, g.invited)}
                        className={`text-xs px-2 py-1 rounded whitespace-nowrap ${
                          g.invited ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {g.invited ? "Terkirim" : "Belum"}
                      </button>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${attendanceColor[g.attendance]}`}>
                        {attendanceLabel[g.attendance]}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">{g.guestCount ?? "-"}</td>
                    <td className="px-3 py-2.5 max-w-[160px] truncate text-gray-500">{g.message || "-"}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1.5 flex-wrap">
                        <button
                          onClick={() => openEditModal(g)}
                          className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => copyLink(g.slug, g.id)}
                          className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200"
                        >
                          {copiedId === g.id ? "Tersalin!" : "Copy Link"}
                        </button>
                        <button
                          onClick={() => handleDelete(g.id)}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {guests.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-gray-400">
                    Belum ada tamu, tambahkan lewat form di atas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ===== TAMPILAN KARTU (mobile, di bawah md) ===== */}
        <div className="md:hidden space-y-3">
          {guests.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-400 text-sm">
              Belum ada tamu, tambahkan lewat form di atas.
            </div>
          )}
          {guests.map((g) => {
            const isRevealed = revealedPhones.has(g.id);
            return (
              <div key={g.id} className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <div>
                    <p className="font-medium text-sm">{g.name}</p>
                    <p className="text-xs text-gray-500">{g.category || "-"}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${attendanceColor[g.attendance]}`}>
                    {attendanceLabel[g.attendance]}
                  </span>
                </div>

                {g.phone && (
                  <div className="flex items-center gap-1.5 mb-2 text-xs">
                    <span className="font-mono text-gray-700">
                      {isRevealed ? g.phone : maskPhone(g.phone)}
                    </span>
                    <button
                      onClick={() => togglePhoneVisibility(g.id)}
                      className="text-blue-600 hover:underline"
                    >
                      {isRevealed ? "Sembunyikan" : "Lihat"}
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
                  <button
                    onClick={() => handleToggleInvited(g.id, g.invited)}
                    className={`px-2 py-1 rounded ${
                      g.invited ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {g.invited ? "Terkirim" : "Belum Kirim"}
                  </button>
                  <span>Jml Hadir: {g.guestCount ?? "-"}</span>
                </div>

                {g.message && (
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">"{g.message}"</p>
                )}

                <div className="flex gap-2 flex-wrap pt-2 border-t">
                  <button
                    onClick={() => openEditModal(g)}
                    className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded hover:bg-blue-100"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => copyLink(g.slug, g.id)}
                    className="text-xs bg-gray-100 px-3 py-1.5 rounded hover:bg-gray-200"
                  >
                    {copiedId === g.id ? "Tersalin!" : "Copy Link"}
                  </button>
                  <button
                    onClick={() => handleDelete(g.id)}
                    className="text-xs text-red-500 px-3 py-1.5 hover:underline ml-auto"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Edit Tamu */}
      {editingGuest && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={closeEditModal}
        >
          <div
            className="bg-white rounded-lg shadow-lg w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4">Edit Tamu</h2>
            <form onSubmit={handleSaveEdit}>
              <label className="text-xs text-gray-500 block mb-1">Nama</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full border rounded px-3 py-2 mb-3 text-sm"
                required
              />

              <label className="text-xs text-gray-500 block mb-1">Kategori / Instansi</label>
              <input
                type="text"
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="w-full border rounded px-3 py-2 mb-3 text-sm"
              />

              <label className="text-xs text-gray-500 block mb-1">No. WA</label>
              <input
                type="text"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full border rounded px-3 py-2 mb-5 text-sm"
              />

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="text-sm px-4 py-2 rounded border text-gray-600 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="text-sm px-4 py-2 rounded bg-black text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {editSaving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="bg-white p-3 md:p-4 rounded-lg shadow-sm">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-xl md:text-2xl font-semibold ${accent || ""}`}>{value}</p>
    </div>
  );
}
