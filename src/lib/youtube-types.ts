export type YouTubeStatus = {
  isLive: boolean;
  liveVideoId: string | null;
  latestVideoId: string | null;
  latestVideoTitle: string | null;
  latestVideoPublishedAt: string | null;
  latestVideoIsShort: boolean;
};
