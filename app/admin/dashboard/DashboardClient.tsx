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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Dashboard Undangan</h1>
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-black">
            Logout
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
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
            className="border rounded px-3 py-2 flex-1 min-w-[150px]"
            required
          />
          <input
            type="text"
            placeholder="Kategori (opsional)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border rounded px-3 py-2 flex-1 min-w-[150px]"
          />
          <input
            type="text"
            placeholder="No. WA (opsional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="border rounded px-3 py-2 flex-1 min-w-[150px]"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white px-5 py-2 rounded hover:bg-gray-800"
          >
            {loading ? "Menambah..." : "+ Tambah Tamu"}
          </button>
        </form>

        {/* Tabel tamu */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-3">Nama</th>
                <th className="p-3">Kategori</th>
                <th className="p-3">Status Kirim</th>
                <th className="p-3">RSVP</th>
                <th className="p-3">Jml Hadir</th>
                <th className="p-3">Ucapan</th>
                <th className="p-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {guests.map((g) => (
                <tr key={g.id} className="border-t">
                  <td className="p-3 font-medium">{g.name}</td>
                  <td className="p-3 text-gray-500">{g.category || "-"}</td>
                  <td className="p-3">
                    <button
                      onClick={() => handleToggleInvited(g.id, g.invited)}
                      className={`text-xs px-2 py-1 rounded ${
                        g.invited ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {g.invited ? "Terkirim" : "Belum"}
                    </button>
                  </td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-1 rounded ${attendanceColor[g.attendance]}`}>
                      {attendanceLabel[g.attendance]}
                    </span>
                  </td>
                  <td className="p-3">{g.guestCount ?? "-"}</td>
                  <td className="p-3 max-w-[200px] truncate text-gray-500">{g.message || "-"}</td>
                  <td className="p-3 flex gap-2">
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
                  </td>
                </tr>
              ))}
              {guests.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-gray-400">
                    Belum ada tamu, tambahkan lewat form di atas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${accent || ""}`}>{value}</p>
    </div>
  );
}