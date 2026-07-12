"use client";

import { useState } from "react";
import Image from "next/image";
import BackgroundMusic from "@/components/BackgroundMusic";

export default function InvitationGate({
  guestName,
  children,
}: {
  guestName: string;
  children: React.ReactNode;
}) {
  const [opened, setOpened] = useState(false);

  if (opened) {
    return (
      <>
        <BackgroundMusic src="/music.mp3" />
        {children}
      </>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-[#fdfbf3] via-[#faf6e8] to-[#f2ecd4]">
      <div className="relative w-full h-full max-w-md mx-auto flex flex-col items-center justify-center px-8 text-center">
        <div className="relative w-32 h-20 mb-6">
          <Image src="/sas-logo-green.png" alt="SAS Center" fill className="object-contain" />
        </div>

        <p className="text-amber-800 text-xl tracking-wide font-medium" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          Tasyakuran Hari Lahir
        </p>
        <h1
          className="text-[#0f3d28] text-5xl mt-2 leading-tight font-semibold"
          style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}
        >
          Abuya Said Aqil Siroj
        </h1>
        <p className="text-amber-800 text-3xl mt-1 font-medium" style={{ fontFamily: "'Playfair Display', serif" }}>
          Ke-73
        </p>

        <div className="flex flex-col items-center mt-8">
          <div className="w-16 h-16 rounded-full border-2 border-amber-700/60 flex items-center justify-center bg-white/60">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="w-7 h-7 text-amber-800"
            >
              <rect x="3" y="4" width="18" height="17" rx="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <rect x="7" y="12" width="3" height="3" fill="currentColor" stroke="none" />
            </svg>
          </div>
          <p className="text-[#0f3d28] text-base font-medium mt-3 tracking-wide" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Sabtu, 8 Agustus 2026
          </p>
        </div>

        <button
          onClick={() => setOpened(true)}
          className="mt-8 bg-amber-700 hover:bg-amber-600 transition text-white text-lg font-semibold px-10 py-3 rounded-full shadow-md"
        >
          Buka Undangan
        </button>

        <div className="mt-8">
          <p className="text-[#0f3d28]/90 text-base">Kepada</p>
          <p className="text-[#0f3d28]/90 text-base">Yth. Bapak/Ibu/Saudara</p>
          <p className="text-amber-800 text-lg font-semibold mt-1">{guestName}</p>
        </div>
      </div>
    </div>
  );
}