"use client";

import { useEffect, useRef, useState } from "react";

// Resolusi kanvas tetap (rasio 3:1); tampilannya mengikuti lebar layar lewat CSS.
const W = 1200;
const H = 400;

export default function SignaturePad({
  onChange,
  disabled = false,
}: {
  onChange: (dataUrl: string | null) => void;
  disabled?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [hasInk, setHasInk] = useState(false);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111111";
    ctx.fillStyle = "#111111";
  }, []);

  function point(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) * W) / rect.width,
      y: ((e.clientY - rect.top) * H) / rect.height,
    };
  }

  function handleDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (disabled) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    canvas.setPointerCapture(e.pointerId);
    drawing.current = true;
    const p = point(e);
    last.current = p;
    // Satu ketukan pun meninggalkan titik
    ctx.beginPath();
    ctx.arc(p.x, p.y, ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  function handleMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current || !last.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const p = point(e);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  }

  function handleUp() {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    exportSignature();
  }

  function exportSignature() {
    const canvas = canvasRef.current!;
    // Perkecil ke 600x200 berlatar putih agar ukuran file tetap kecil
    const out = document.createElement("canvas");
    out.width = W / 2;
    out.height = H / 2;
    const octx = out.getContext("2d")!;
    octx.fillStyle = "#ffffff";
    octx.fillRect(0, 0, out.width, out.height);
    octx.drawImage(canvas, 0, 0, out.width, out.height);
    setHasInk(true);
    onChange(out.toDataURL("image/png"));
  }

  function clear() {
    const canvas = canvasRef.current!;
    canvas.getContext("2d")!.clearRect(0, 0, W, H);
    drawing.current = false;
    last.current = null;
    setHasInk(false);
    onChange(null);
  }

  return (
    <div>
      <div className="relative rounded-xl border-2 border-dashed border-emerald-700 bg-white">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="block w-full rounded-xl"
          style={{ touchAction: "none", aspectRatio: `${W} / ${H}` }}
          onPointerDown={handleDown}
          onPointerMove={handleMove}
          onPointerUp={handleUp}
          onPointerCancel={handleUp}
          aria-label="Kolom tanda tangan"
        />
        {!hasInk && (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center px-4 text-center text-lg text-gray-400">
            Tanda tangan di sini
          </p>
        )}
        <div className="pointer-events-none absolute inset-x-6 bottom-[22%] border-b border-gray-300" />
      </div>
      <button
        type="button"
        onClick={clear}
        disabled={disabled || !hasInk}
        className="mt-3 w-full rounded-xl border-2 border-gray-300 bg-white py-3 text-lg font-semibold text-gray-700 active:bg-gray-100 disabled:opacity-40"
      >
        Hapus &amp; Ulangi Tanda Tangan
      </button>
    </div>
  );
}
