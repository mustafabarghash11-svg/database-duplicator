import { useEffect, useState } from "react";
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

export function loadData(): SiteData {
  if (typeof window === "undefined") return defaultData;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData;
    const parsed = JSON.parse(raw);
    return {
      ...defaultData,
      ...parsed,
      customSections: parsed.customSections ?? [],
      serverStats: parsed.serverStats ?? defaultData.serverStats,
      serverPerks: parsed.serverPerks ?? defaultData.serverPerks,
      streamers: parsed.streamers ?? [],
      upcomingEvent: parsed.upcomingEvent ?? null,
      leaderboard: parsed.leaderboard ?? [],
      hallOfFame: parsed.hallOfFame ?? [],
    };
  } catch {
    return defaultData;
  }
}

export function saveData(data: SiteData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event("khayal-data-updated"));
}

export function useSiteData() {
  const [data, setData] = useState<SiteData>(defaultData);
  useEffect(() => {
    setData(loadData());
    const handler = () => setData(loadData());
    window.addEventListener("khayal-data-updated", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("khayal-data-updated", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);
  return [data, (d: SiteData) => { saveData(d); setData(d); }] as const;
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
     
