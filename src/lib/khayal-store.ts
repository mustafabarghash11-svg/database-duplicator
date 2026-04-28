import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import game1 from "@/assets/game-1.jpg";
import game2 from "@/assets/game-2.jpg";
import game3 from "@/assets/game-3.jpg";
import game4 from "@/assets/game-4.jpg";

export type Game = {
  id: string;
  name: string;
  image: string;
  link: string;
  description: string;
};

export type Feature = {
  id: string;
  title: string;
  description: string;
  icon: string;
};

export type Block =
  | { id: string; type: "heading"; text: string }
  | { id: string; type: "text"; text: string }
  | { id: string; type: "image"; src: string; alt: string }
  | { id: string; type: "button"; text: string; link: string };

export type CustomSection = {
  id: string;
  slug: string; // used in nav
  title: string;
  blocks: Block[];
};

export type ServerStat = {
  id: string;
  label: string;
  value: string;
  icon: string;
};

export type ServerPerk = {
  id: string;
  title: string;
  description: string;
  icon: string;
};

export type Streamer = {
  id: string;
  name: string;
  image: string;
  platform: string; // Twitch, YouTube, Kick, TikTok...
  link: string;
  isLive: boolean;
};

export type UpcomingEvent = {
  id: string;
  title: string;
  description: string;
  date: string; // ISO datetime
};

export type LeaderboardEntry = {
  id: string;
  rank: number;
  name: string;
  image: string;
  points: number;
  badge: string;
};

export type HallOfFameEntry = {
  id: string;
  championName: string;
  image: string;
  tournament: string;
  year: string;
};

export type SiteData = {
  siteName: string;
  tagline: string;
  discordLink: string;
  discordServerId: string; // for live member count widget
  showVisitorCounter: boolean;
  games: Game[];
  features: Feature[];
  serverStats: ServerStat[];
  serverPerks: ServerPerk[];
  streamers: Streamer[];
  upcomingEvent: UpcomingEvent | null;
  leaderboard: LeaderboardEntry[];
  hallOfFame: HallOfFameEntry[];
  customSections: CustomSection[];
};

const STORAGE_KEY = "khayal-site-data-v3";
const SITE_ROW_ID = "main";

// In-memory cache shared across hook instances (avoids refetch on every mount)
let _cache: SiteData | null = null;
const _listeners = new Set<(d: SiteData) => void>();
let _realtimeStarted = false;

function mergeWithDefaults(parsed: Partial<SiteData> | null | undefined): SiteData {
  const p = (parsed ?? {}) as Partial<SiteData>;
  return {
    ...defaultData,
    ...p,
    customSections: p.customSections ?? [],
    serverStats: p.serverStats ?? defaultData.serverStats,
    serverPerks: p.serverPerks ?? defaultData.serverPerks,
    streamers: p.streamers ?? [],
    upcomingEvent: p.upcomingEvent ?? null,
    leaderboard: p.leaderboard ?? [],
    hallOfFame: p.hallOfFame ?? [],
  };
}

function notify(d: SiteData) {
  _cache = d;
  _listeners.forEach((fn) => fn(d));
  if (typeof window !== "undefined") {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch { /* ignore */ }
  }
}

async function fetchRemote(): Promise<SiteData> {
  const { data, error } = await (supabase as any)
    .from("site_data")
    .select("data")
    .eq("id", SITE_ROW_ID)
    .maybeSingle();
  if (error) {
    console.warn("[site_data] fetch failed:", error.message);
    return mergeWithDefaults(null);
  }
  return mergeWithDefaults((data?.data as Partial<SiteData>) ?? null);
}

function startRealtime() {
  if (_realtimeStarted || typeof window === "undefined") return;
  _realtimeStarted = true;
  supabase
    .channel("site_data-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "site_data", filter: `id=eq.${SITE_ROW_ID}` },
      (payload) => {
        const newRow = (payload.new as { data?: Partial<SiteData> } | null) ?? null;
        if (newRow?.data) notify(mergeWithDefaults(newRow.data));
      }
    )
    .subscribe();
}

export const defaultData: SiteData = {
  siteName: "Khayal Community",
  tagline: "مجتمع الخيال للألعاب — حيث يلتقي اللاعبون الحقيقيون",
  discordLink: "https://discord.gg/khayal",
  discordServerId: "801068128766",
  showVisitorCounter: true,
  games: [
    { id: "1", name: "Fortnite", image: game1, link: "#", description: "باتل رويال أسطوري" },
    { id: "2", name: "Minecraft", image: game2, link: "#", description: "عالم لا حدود له" },
    { id: "3", name: "Valorant", image: game3, link: "#", description: "إطلاق نار تكتيكي" },
    { id: "4", name: "Warzone", image: game4, link: "#", description: "ساحة المعركة الحديثة" },
  ],
  features: [
    { id: "f1", title: "بطولات أسبوعية", description: "نظم بطولات وفز بجوائز قيمة", icon: "🏆" },
    { id: "f2", title: "فرق ومجموعات", description: "كوّن فريقك واطلع للقمة", icon: "⚔️" },
    { id: "f3", title: "مجتمع نشط", description: "آلاف اللاعبين العرب 24/7", icon: "🎮" },
    { id: "f4", title: "بث مباشر", description: "شاهد أفضل اللاعبين على الهواء", icon: "📡" },
  ],
  serverStats: [
    { id: "s1", label: "عضو", value: "5,000+", icon: "👥" },
    { id: "s3", label: "بطولة شهرياً", value: "12", icon: "🏆" },
    { id: "s4", label: "قنوات", value: "40+", icon: "💬" },
  ],
  serverPerks: [
    { id: "p1", title: "رتب وأدوار حصرية", description: "احصل على رتب مميزة حسب نشاطك ومستواك", icon: "⭐" },
    { id: "p2", title: "بوتات متطورة", description: "موسيقى، ألعاب، ومستويات داخل السيرفر", icon: "🤖" },
    { id: "p3", title: "إيفنتات أسبوعية", description: "أنشطة وجوائز كل أسبوع للأعضاء النشطين", icon: "🎉" },
    { id: "p4", title: "دعم 24/7", description: "فريق إدارة متواجد على مدار الساعة", icon: "🛡️" },
  ],
  streamers: [],
  upcomingEvent: null,
  leaderboard: [],
  hallOfFame: [],
  customSections: [],
};

// Synchronous read (returns cached or last-known localStorage snapshot for instant render)
export function loadData(): SiteData {
  if (_cache) return _cache;
  if (typeof window === "undefined") return defaultData;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData;
    return mergeWithDefaults(JSON.parse(raw));
  } catch {
    return defaultData;
  }
}

export async function saveData(data: SiteData) {
  notify(data); // optimistic update for current client
  const { error } = await (supabase as any)
    .from("site_data")
    .upsert({ id: SITE_ROW_ID, data, updated_at: new Date().toISOString() });
  if (error) {
    console.error("[site_data] save failed:", error.message);
    throw error;
  }
}

export function useSiteData() {
  const [data, setData] = useState<SiteData>(() => loadData());

  useEffect(() => {
    startRealtime();
    // Always fetch fresh from server on mount
    fetchRemote().then(notify);

    const listener = (d: SiteData) => setData(d);
    _listeners.add(listener);
    return () => { _listeners.delete(listener); };
  }, []);

  return [
    data,
    (d: SiteData) => { void saveData(d); },
  ] as const;
}

// Convert Arabic-Indic digits to ASCII
export function normalizeDigits(s: string) {
  return s.replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
          .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06F0));
}

// Only allow http(s) URLs in user-controlled hrefs to prevent javascript: XSS.
export function safeHref(url: string | undefined | null): string {
  if (!url) return "#";
  const trimmed = String(url).trim();
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) return trimmed;
  try {
    const u = new URL(trimmed, typeof window !== "undefined" ? window.location.origin : "http://localhost");
    if (u.protocol === "https:" || u.protocol === "http:" || u.protocol === "mailto:") return u.toString();
  } catch {
    // fall through
  }
  return "#";
  }
     
