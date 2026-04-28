import { useEffect, useState } from "react";
import type { UpcomingEvent } from "@/lib/khayal-store";

function calc(target: number) {
  const diff = target - Date.now();
  if (diff <= 0) return null;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { d, h, m, s };
}

export function EventCountdown({ event }: { event: UpcomingEvent }) {
  const target = new Date(event.date).getTime();
  const [time, setTime] = useState(() => calc(target));

  useEffect(() => {
    const id = setInterval(() => setTime(calc(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!time) return null;

  const Box = ({ value, label }: { value: number; label: string }) => (
    <div className="rounded-xl bg-background/60 border border-accent/30 px-4 py-3 min-w-[70px]">
      <div className="text-3xl md:text-4xl font-black text-accent tabular-nums">
        {String(value).padStart(2, "0")}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );

  return (
    <section className="py-16 px-6 max-w-5xl mx-auto">
      <div className="rounded-3xl bg-gradient-to-br from-accent/15 via-card to-card border border-accent/30 p-8 md:p-12 text-center shadow-[0_20px_60px_-20px_oklch(0.65_0.18_215/0.4)]">
        <p className="text-accent font-bold tracking-widest text-sm mb-3">// UPCOMING EVENT</p>
        <h2 className="text-3xl md:text-5xl font-black mb-3">{event.title}</h2>
        {event.description && (
          <p className="text-muted-foreground mb-8 leading-relaxed">{event.description}</p>
        )}
        <div className="flex justify-center gap-3 flex-wrap" dir="ltr">
          <Box value={time.d} label="يوم" />
          <Box value={time.h} label="ساعة" />
          <Box value={time.m} label="دقيقة" />
          <Box value={time.s} label="ثانية" />
        </div>
      </div>
    </section>
  );
}
