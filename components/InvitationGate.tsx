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

          <p className="text-yellow-100/80 text-sm mt-6">
            Senin, 20 Juli 2026
            <br />
            Pukul 10.00–13.30 WIB
          </p>

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