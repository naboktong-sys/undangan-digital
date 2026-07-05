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
            className="border border-yellow-600/25 rounded-xl px-4 py-3 min-w-[68px] text-center"
          >
            <p className="font-elegant-title not-italic text-2xl text-yellow-400">
              {String(u.value).padStart(2, "0")}
            </p>
            <p className="font-elegant-label text-[11px] text-yellow-100/50 mt-1 tracking-widest uppercase">
              {u.label}
            </p>
          </div>
        ))}
      </div>
    );
}