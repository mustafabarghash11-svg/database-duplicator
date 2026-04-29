import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type YouTubeStatus = {
  isLive: boolean;
  liveVideoId: string | null;
  latestVideoId: string | null;
  latestVideoTitle: string | null;
  latestVideoPublishedAt: string | null;
  latestVideoIsShort: boolean;
};

const inputSchema = z.object({
  channelId: z.string().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/),
});

const cache = new Map<string, { at: number; data: YouTubeStatus }>();
const TTL_MS = 5 * 60 * 1000; // 5 minutes

async function isShortById(videoId: string): Promise<boolean> {
  // Heuristic: shorts redirect from /shorts/{id}; use HEAD with no-redirect
  try {
    const res = await fetch(`https://www.youtube.com/shorts/${videoId}`, {
      method: "HEAD",
      redirect: "manual",
    });
    // If it's a short, the page returns 200. If it's a regular video, YouTube redirects to /watch
    return res.status === 200;
  } catch {
    return false;
  }
}

export const getYouTubeStatus = createServerFn({ method: "GET" })
  .inputValidator((data) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<YouTubeStatus> => {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return {
        isLive: false,
        liveVideoId: null,
        latestVideoId: null,
        latestVideoTitle: null,
        latestVideoPublishedAt: null,
        latestVideoIsShort: false,
      };
    }

    const cached = cache.get(data.channelId);
    if (cached && Date.now() - cached.at < TTL_MS) return cached.data;

    const base = "https://www.googleapis.com/youtube/v3/search";
    const common = `&channelId=${encodeURIComponent(data.channelId)}&type=video&maxResults=1&key=${apiKey}`;

    // Live check
    let isLive = false;
    let liveVideoId: string | null = null;
    try {
      const liveRes = await fetch(`${base}?part=snippet&eventType=live&order=date${common}`);
      if (liveRes.ok) {
        const j = (await liveRes.json()) as { items?: Array<{ id?: { videoId?: string } }> };
        const v = j.items?.[0]?.id?.videoId;
        if (v) {
          isLive = true;
          liveVideoId = v;
        }
      }
    } catch (e) {
      console.warn("[youtube] live check failed", e);
    }

    // Latest video
    let latestVideoId: string | null = null;
    let latestVideoTitle: string | null = null;
    let latestVideoPublishedAt: string | null = null;
    let latestVideoIsShort = false;
    try {
      const latestRes = await fetch(`${base}?part=snippet&order=date${common}`);
      if (latestRes.ok) {
        const j = (await latestRes.json()) as {
          items?: Array<{
            id?: { videoId?: string };
            snippet?: { title?: string; publishedAt?: string };
          }>;
        };
        const item = j.items?.[0];
        if (item?.id?.videoId) {
          latestVideoId = item.id.videoId;
          latestVideoTitle = item.snippet?.title ?? null;
          latestVideoPublishedAt = item.snippet?.publishedAt ?? null;
          latestVideoIsShort = await isShortById(latestVideoId);
        }
      }
    } catch (e) {
      console.warn("[youtube] latest fetch failed", e);
    }

    const result: YouTubeStatus = {
      isLive,
      liveVideoId,
      latestVideoId,
      latestVideoTitle,
      latestVideoPublishedAt,
      latestVideoIsShort,
    };
    cache.set(data.channelId, { at: Date.now(), data: result });
    return result;
  });
