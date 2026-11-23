"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Row = {
  id: string;
  name: string;
  memberNo: string;
  institution: string;
  attended: boolean;
  attendedAt: string | null;
  createdAt: string;
};

function formatWaktu(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  })
    .format(new Date(iso))
    .replace(":", ".");
}

export default function PendaftaranClient({
  eventName,
  initialQuota,
  initialIsOpen,
  initialRows,
}: {
  eventName: string;
  initialQuota: number;
  initialIsOpen: boolean;
  initialRows: Row[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [quota, setQuota] = useState(initialQuota);
  const [quotaInput, setQuotaInput] = useState(String(initialQuota));
  const [isOpen, setIsOpen] = useState(initialIsOpen);
  const [savingSettings, setSavingSettings] = useState(false);
  const [search, setSearch] = useState("");
  const [onlyNotAttended, setOnlyNotAttended] = useState(false);
  const [copied, setCopied] = useState(false);

  const [signatureOf, setSignatureOf] = useState<Row | null>(null);
  const [editing, setEditing] = useState<Row | null>(null);
  const [editName, setEditName] = useState("");
  const [editMemberNo, setEditMemberNo] = useState("");
  const [editInstitution, setEditInstitution] = useState("");
  const [editError, setEditError] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const attendedCount = rows.filter((r) => r.attended).length;
  const remaining = Math.max(quota - rows.length, 0);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase().replace(/\s+/g, "");
    return rows.filter((r) => {
      if (onlyNotAttended && r.attended) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().replace(/\s+/g, "").includes(q) ||
        r.memberNo.toLowerCase().includes(q) ||
        r.institution.toLowerCase().replace(/\s+/g, "").includes(q)
      );
    });
  }, [rows, search, onlyNotAttended]);

  async function saveSettings(next: { quota?: number; isOpen?: boolean }) {
    setSavingSettings(true);
    const res = await fetch("/api/admin/pendaftaran", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    const data = await res.json().catch(() => ({}));
    setSavingSettings(false);
    if (!res.ok) {
      alert(data.error || "Gagal menyimpan pengaturan.");
      setQuotaInput(String(quota));
      return;
    }
    setQuota(data.quota);
    setQuotaInput(String(data.quota));
    setIsOpen(data.isOpen);
  }

  async function toggleAttended(row: Row) {
    const next = !row.attended;
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, attended: next } : r)));
    const res = await fetch(`/api/admin/pendaftaran/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attended: next }),
    });
    if (!res.ok) {
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, attended: row.attended } : r)));
      alert("Gagal mengubah status hadir, coba lagi.");
    }
  }

  async function handleDelete(row: Row) {
    if (!confirm(`Hapus pendaftaran "${row.name}"? Orang ini bisa mendaftar ulang setelah dihapus.`)) return;
    const res = await fetch(`/api/admin/pendaftaran/${row.id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Gagal menghapus, coba lagi.");
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== row.id));
  }

  function openEdit(row: Row) {
    setEditing(row);
    setEditName(row.name);
    setEditMemberNo(row.memberNo);
    setEditInstitution(row.institution);
    setEditError("");
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setEditSaving(true);
    setEditError("");
    const res = await fetch(`/api/admin/pendaftaran/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName, memberNo: editMemberNo, institution: editInstitution }),
    });
    const data = await res.json().catch(() => ({}));
    setEditSaving(false);
    if (!res.ok) {
      setEditError(data.error || "Gagal menyimpan perubahan.");
      return;
    }
    setRows((prev) =>
      prev.map((r) =>
        r.id === editing.id
          ? { ...r, name: data.name, memberNo: data.memberNo, institution: data.institution }
          : r,
      ),
    );
    setEditing(null);
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.origin + "/");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <a href="/admin/dashboard" className="text-xs text-gray-500 hover:text-black">
              ← Dashboard Undangan
            </a>
            <h1 className="mt-1 text-xl font-semibold md:text-2xl">Pendaftar</h1>
            <p className="text-sm text-gray-500">{eventName}</p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/admin/pendaftaran/cetak"
              target="_blank"
              rel="noreferrer"
              className="whitespace-nowrap rounded bg-black px-3 py-1.5 text-xs text-white hover:bg-gray-800 md:px-4 md:py-2 md:text-sm"
            >
              Cetak / PDF Daftar
            </a>
            <button onClick={handleLogout} className="text-xs text-gray-500 hover:text-black md:text-sm">
              Logout
            </button>
          </div>
        </div>

        {/* Statistik */}
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <Stat label="Terdaftar" value={rows.length} />
          <Stat label="Sisa Kuota" value={remaining} accent={remaining === 0 ? "text-red-600" : "text-green-600"} />
          <Stat label="Sudah Hadir" value={attendedCount} accent="text-green-600" />
          <Stat label="Belum Hadir" value={rows.length - attendedCount} accent="text-gray-500" />
        </div>

        {/* Pengaturan */}
        <div className="mb-6 flex flex-wrap items-end gap-x-6 gap-y-4 rounded-lg bg-white p-4 shadow-sm">
          <div>
            <label className="mb-1 block text-sm text-gray-500" htmlFor="quota">
              Kuota maksimal
            </label>
            <div className="flex gap-2">
              <input
                id="quota"
                type="number"
                min={1}
                value={quotaInput}
                onChange={(e) => setQuotaInput(e.target.value)}
                className="w-28 rounded border px-3 py-2 text-sm"
              />
              <button
                onClick={() => saveSettings({ quota: Number(quotaInput) })}
                disabled={savingSettings || Number(quotaInput) === quota}
                className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-40"
              >
                Simpan
              </button>
            </div>
          </div>

          <div>
            <p className="mb-1 text-sm text-gray-500">Status pendaftaran</p>
            <button
              onClick={() => saveSettings({ isOpen: !isOpen })}
              disabled={savingSettings}
              className={`rounded px-4 py-2 text-sm font-medium disabled:opacity-50 ${
                isOpen ? "bg-green-100 text-green-800 hover:bg-green-200" : "bg-red-100 text-red-800 hover:bg-red-200"
              }`}
            >
              {isOpen ? "Dibuka — klik untuk menutup" : "Ditutup — klik untuk membuka"}
            </button>
          </div>

          <div>
            <p className="mb-1 text-sm text-gray-500">Link pendaftaran (bagikan ke peserta)</p>
            <button onClick={copyLink} className="rounded bg-blue-50 px-4 py-2 text-sm text-blue-700 hover:bg-blue-100">
              {copied ? "✓ Link tersalin" : "Salin link"}
            </button>
          </div>
        </div>

        {/* Pencarian */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama / No. Keanggotaan / instansi..."
            className="min-w-[220px] flex-1 rounded border bg-white px-3 py-2 text-sm"
          />
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={onlyNotAttended}
              onChange={(e) => setOnlyNotAttended(e.target.checked)}
              className="h-4 w-4"
            />
            Hanya yang belum hadir
          </label>
        </div>

        {/* Daftar */}
        <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="px-3 py-2.5">Hadir</th>
                <th className="px-3 py-2.5">Nama</th>
                <th className="px-3 py-2.5">No. Keanggotaan</th>
                <th className="px-3 py-2.5">Asal Instansi</th>
                <th className="px-3 py-2.5">Daftar</th>
                <th className="px-3 py-2.5">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className={`border-t align-middle ${r.attended ? "bg-green-50" : ""}`}>
                  <td className="px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={r.attended}
                      onChange={() => toggleAttended(r)}
                      className="h-5 w-5 cursor-pointer"
                      aria-label={`Tandai ${r.name} hadir`}
                    />
                  </td>
                  <td className="px-3 py-2.5 font-medium">{r.name}</td>
                  <td className="px-3 py-2.5 font-mono text-xs">{r.memberNo}</td>
                  <td className="px-3 py-2.5 text-gray-600">{r.institution}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-xs text-gray-500">{formatWaktu(r.createdAt)}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setSignatureOf(r)}
                        className="rounded bg-gray-100 px-2.5 py-1 text-xs hover:bg-gray-200"
                      >
                        TTD
                      </button>
                      <button
                        onClick={() => openEdit(r)}
                        className="rounded bg-blue-50 px-2.5 py-1 text-xs text-blue-700 hover:bg-blue-100"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(r)}
                        className="rounded bg-red-50 px-2.5 py-1 text-xs text-red-700 hover:bg-red-100"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-gray-500">
                    {rows.length === 0 ? "Belum ada yang mendaftar." : "Tidak ada data yang cocok."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Menampilkan {filtered.length} dari {rows.length} pendaftar.
        </p>
      </div>

      {/* Modal tanda tangan */}
      {signatureOf && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSignatureOf(null)}
        >
          <div className="w-full max-w-md rounded-lg bg-white p-5" onClick={(e) => e.stopPropagation()}>
            <p className="font-semibold">{signatureOf.name}</p>
            <p className="mb-3 text-xs text-gray-500">
              {signatureOf.memberNo} · {signatureOf.institution}
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/admin/pendaftaran/${signatureOf.id}/signature`}
              alt={`Tanda tangan ${signatureOf.name}`}
              className="w-full rounded border bg-white"
            />
            <button
              onClick={() => setSignatureOf(null)}
              className="mt-4 w-full rounded bg-gray-100 py-2 text-sm hover:bg-gray-200"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Modal edit */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleSaveEdit} className="w-full max-w-md space-y-3 rounded-lg bg-white p-5">
            <h2 className="font-semibold">Edit Data Pendaftar</h2>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Nama lengkap</label>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full rounded border px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">No. Keanggotaan (isi - jika bukan pensiunan)</label>
              <input
                value={editMemberNo}
                onChange={(e) => setEditMemberNo(e.target.value)}
                className="w-full rounded border px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Asal instansi</label>
              <input
                value={editInstitution}
                onChange={(e) => setEditInstitution(e.target.value)}
                className="w-full rounded border px-3 py-2 text-sm"
                required
              />
            </div>
            {editError && <p className="text-sm text-red-600">{editError}</p>}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="flex-1 rounded bg-gray-100 py-2 text-sm hover:bg-gray-200"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={editSaving}
                className="flex-1 rounded bg-black py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {editSaving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-semibold ${accent ?? ""}`}>{value}</p>
    </div>
  );
}
