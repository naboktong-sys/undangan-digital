"use client";

import { useState } from "react";
import Image from "next/image";
import BackgroundMusic from "@/components/BackgroundMusic";

export default function InvitationGate({
  guestName,
  eyebrow,
  title,
  tagline,
  dateLabel,
  logoSrc = "/sas-logo-green.png",
  secondLogoSrc,
  musicSrc = "/music.mp3",
  children,
}: {
  guestName: string;
  eyebrow: string;
  title: string;
  tagline?: string;
  dateLabel: string;
  logoSrc?: string;
  secondLogoSrc?: string; // logo kedua, ditampilkan bersebelahan dengan logo utama
  musicSrc?: string;
  children: React.ReactNode;
}) {
  const [opened, setOpened] = useState(false);

  if (opened) {
    return (
      <>
        <BackgroundMusic src={musicSrc} />
        {children}
      </>
    );
  }

  // Judul panjang (mis. judul buku) diperkecil supaya tidak keluar layar
  const titleSize = title.length > 40 ? "text-3xl" : title.length > 24 ? "text-4xl" : "text-5xl";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-b from-[#fdfbf3] via-[#faf6e8] to-[#f2ecd4]">
      <div className="relative w-full min-h-full max-w-md mx-auto flex flex-col items-center justify-center px-8 py-8 text-center">
        {secondLogoSrc ? (
          <div className="flex items-center justify-center gap-5 mb-6">
            <div className="relative w-24 h-24">
              <Image src={logoSrc} alt="Logo penyelenggara" fill className="object-contain" />
            </div>
            <div className="relative w-24 h-24">
              <Image src={secondLogoSrc} alt="Logo penyelenggara" fill className="object-contain" />
            </div>
          </div>
        ) : (
          <div className="relative w-32 h-20 mb-6">
            <Image src={logoSrc} alt="Logo penyelenggara" fill className="object-contain" />
          </div>
        )}

        <p className="text-amber-800 text-xl tracking-wide font-medium" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          {eyebrow}
        </p>
        <h1
          className={`text-[#0f3d28] ${titleSize} mt-2 leading-tight font-semibold`}
          style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}
        >
          {title}
        </h1>
        {tagline && (
          <p className="text-amber-800 text-3xl mt-1 font-medium" style={{ fontFamily: "'Playfair Display', serif" }}>
            {tagline}
          </p>
        )}

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
            {dateLabel}
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
