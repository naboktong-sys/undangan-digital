"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
    >
      Cetak / Simpan PDF
    </button>
  );
}
