"use client";

import { useState, useRef, useEffect } from "react";

export default function BackgroundMusic({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    // Coba autoplay senyap dulu (banyak browser mengizinkan ini)
    const audio = audioRef.current;
    if (audio) {
      audio.volume = 0.5;
    }
  }, []);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
    } else {
      audio.play().catch(() => {
        // Browser blokir autoplay, tidak masalah — tamu tinggal klik tombol
      });
    }
    setPlaying(!playing);
  }

  return (
    <>
      <audio ref={audioRef} src={src} loop />
      <button
        onClick={toggle}
        aria-label={playing ? "Matikan musik" : "Putar musik"}
        className="fixed bottom-5 right-5 z-50 w-12 h-12 rounded-full bg-black/60 border border-yellow-600/40 backdrop-blur-sm flex items-center justify-center text-yellow-400 hover:bg-black/80 transition"
      >
        {playing ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 animate-pulse">
            <path d="M9 3v18l-6-4V7l6-4zm7.5 3a5 5 0 0 1 0 12" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <path d="M9 3v18l-6-4V7l6-4z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
            <path d="M9 3v18l-6-4V7l6-4z" fill="currentColor" />
            <line x1="17" y1="4" x2="21" y2="20" />
          </svg>
        )}
      </button>
    </>
  );
}