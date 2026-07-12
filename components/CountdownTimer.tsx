"use client";

import { useEffect, useState } from "react";

export default function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const target = new Date(targetDate).getTime();

    function update() {
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const units = [
    { label: "Hari", value: timeLeft.days },
    { label: "Jam", value: timeLeft.hours },
    { label: "Menit", value: timeLeft.minutes },
    { label: "Detik", value: timeLeft.seconds },
  ];

  return (
      <div className="flex gap-3 justify-center">
        {units.map((u) => (
          <div
            key={u.label}
            className="border border-amber-700/40 bg-white/50 rounded-xl px-4 py-3 min-w-[68px] text-center"
          >
            <p className="font-elegant-title not-italic text-3xl text-amber-800 font-semibold">
              {String(u.value).padStart(2, "0")}
            </p>
            <p className="font-elegant-label text-xs text-amber-900/80 mt-1 tracking-widest uppercase font-medium">
              {u.label}
            </p>
          </div>
        ))}
      </div>
    );
}