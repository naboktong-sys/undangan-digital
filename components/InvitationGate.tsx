"use client";

import { useState } from "react";
import Image from "next/image";

export default function InvitationGate({
  guestName,
  children,
}: {
  guestName: string;
  children: React.ReactNode;
}) {
  const [opened, setOpened] = useState(false);

  if (opened) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <div className="relative w-full h-full max-w-md mx-auto">
        <Image
          src="/cover-frame.png"
          alt="Bingkai undangan"
          fill
          className="object-cover"
          priority
        />

        <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
          <div className="relative w-32 h-20 mb-6">
            <Image src="/sas-logo.png" alt="SAS Center" fill className="object-contain" />
          </div>

          <p className="text-yellow-400 text-lg tracking-wide" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Tasyakuran Hari Lahir
          </p>
          <h1
            className="text-yellow-300 text-4xl mt-2 leading-tight"
            style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}
          >
            Abuya Said Aqil Siroj
          </h1>
          <p className="text-yellow-400 text-2xl mt-1" style={{ fontFamily: "'Playfair Display', serif" }}>
            Ke-73
          </p>

          <div className="flex flex-col items-center mt-8">
            <div className="w-16 h-16 rounded-full border border-yellow-500/50 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
                className="w-7 h-7 text-yellow-400"
              >
                <rect x="3" y="4" width="18" height="17" rx="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <rect x="7" y="12" width="3" height="3" fill="currentColor" stroke="none" />
              </svg>
            </div>
            <p className="text-yellow-100 text-sm mt-3 tracking-wide" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Senin, 20 Juli 2026
            </p>
          </div>

          <button
            onClick={() => setOpened(true)}
            className="mt-8 bg-yellow-700 hover:bg-yellow-600 transition text-yellow-50 font-medium px-8 py-3 rounded-full"
          >
            Buka Undangan
          </button>

          <div className="mt-8">
            <p className="text-yellow-100/70 text-sm">Kepada</p>
            <p className="text-yellow-100/70 text-sm">Yth. Bapak/Ibu/Saudara</p>
            <p className="text-yellow-300 font-medium mt-1">{guestName}</p>
          </div>
        </div>
      </div>
    </div>
  );
}