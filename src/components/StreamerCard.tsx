import { useEffect, useState } from "react";
import { getYouTubeStatus, type YouTubeStatus } from "@/lib/youtube.functions";
import { safeHref, type Streamer } from "@/lib/khayal-store";

type Activity = "live" | "short" | "video" | "none";

// Consider "new" if published within last 48 hours
const NEW_WINDOW_MS = 48 * 60 * 60 * 1000;

function deriveActivity(s: Streamer, status: YouTubeStatus | null): {
  activity: Activity;
  liveVideoId: string | null;
  latestVideoId: string | null;
} {
  // Manual override always wins for "live"
  if (s.isLive) {
    return { activity: "live", liveVideoId: status?.liveVideoId ?? null, latestVideoId: status?.latestVideoId ?? null };
  }
  if (!status) return { activity: "none", liveVideoId: null, latestVideoId: null };
  if (status.isLive) return { activity: "live", liveVideoId: status.liveVideoId, latestVideoId: status.latestVideoId };
  if (status.latestVideoId && status.latestVideoPublishedAt) {
    const age = Date.now() - new Date(status.latestVideoPublishedAt).getTime();
    if (age < NEW_WINDOW_MS) {
      return {
        activity: status.latestVideoIsShort ? "short" : "video",
        liveVideoId: null,
        latestVideoId: status.latestVideoId,
      };
    }
  }
  return { activity: "none", liveVideoId: null, latestVideoId: status.latestVideoId };
}

const styles: Record<Activity, { ring: string; badge: string; label: string; shake: boolean }> = {
  live: {
    ring: "ring-4 ring-red-500 shadow-[0_0_30px_rgba(239,68,68,0.7)]",
    badge: "bg-red-600 text-white",
    label: "LIVE",
    shake: true,
  },
  short: {
    ring: "ring-4 ring-yellow-400 shadow-[0_0_25px_rgba(250,204,21,0.6)]",
    badge: "bg-yellow-400 text-black",
    label: "NEW SHORT",
    shake: true,
  },
  video: {
    ring: "ring-4 ring-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.55)]",
    badge: "bg-emerald-500 text-white",
    label: "NEW VIDEO",
    shake: true,
  },
  none: {
    ring: "ring-1 ring-border",
    badge: "bg-black/70 text-white",
    label: "",
    shake: false,
  },
};

export function StreamerCard({ streamer }: { streamer: Streamer }) {
  const [status, setStatus] = useState<YouTubeStatus | null>(null);

  useEffect(() => {
    if (!streamer.youtubeChannelId) return;
    let cancelled = false;
    const fetchOnce = () => {
      getYouTubeStatus({ data: { channelId: streamer.youtubeChannelId! } })
        .then((s) => { if (!cancelled) setStatus(s); })
        .catch(() => { /* ignore */ });
    };
    fetchOnce();
    const id = setInterval(fetchOnce, 5 * 60 * 1000); // refresh every 5 min
    return () => { cancelled = true; clearInterval(id); };
  }, [streamer.youtubeChannelId]);

  const { activity, liveVideoId, latestVideoId } = deriveActivity(streamer, status);
  const style = styles[activity];

  // Smart link: prefer live → latest video → channel
  const targetUrl =
    activity === "live" && liveVideoId
      ? `https://www.youtube.com/watch?v=${liveVideoId}`
      : (activity === "short" || activity === "video") && latestVideoId
      ? activity === "short"
        ? `https://www.youtube.com/shorts/${latestVideoId}`
        : `https://www.youtube.com/watch?v=${latestVideoId}`
      : streamer.link;

  return (
    <a
      href={safeHref(targetUrl)}
      target="_blank"
      rel="noreferrer"
      className={`group rounded-2xl bg-card border border-border overflow-hidden transition-all hover:-translate-y-1 hover:shadow-[0_20px_50px_-15px_oklch(0.65_0.18_215/0.4)] ${style.ring} ${style.shake ? "animate-[wiggle_2.5s_ease-in-out_infinite]" : ""}`}
    >
      <div className="relative aspect-video bg-muted overflow-hidden">
        {streamer.image ? (
          <img src={streamer.image} alt={streamer.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">🎮</div>
        )}
        {style.label ? (
          <div className={`absolute top-3 right-3 flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full shadow-lg ${style.badge} ${activity === "live" ? "animate-pulse" : ""}`}>
            {activity === "live" && <span className="h-2 w-2 rounded-full bg-white" />}
            {style.label}
          </div>
        ) : (
          <div className="absolute top-3 right-3 bg-black/70 text-white text-xs font-bold px-3 py-1 rounded-full">
            {streamer.platform || "Offline"}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-black text-lg">{streamer.name}</h3>
        {streamer.platform && <p className="text-xs text-muted-foreground mt-1">{streamer.platform}</p>}
      </div>
    </a>
  );
}
