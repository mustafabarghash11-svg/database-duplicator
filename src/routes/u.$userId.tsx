import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SideNav } from "@/components/SideNav";
import { TournamentStats, RecentMatches } from "@/components/profile/TournamentStats";

export const Route = createFileRoute("/u/$userId")({
  head: () => ({
    meta: [
      { title: "بروفايل اللاعب — Khayal" },
      { name: "description", content: "بروفايل عام للاعب في مجتمع الخيال." },
    ],
  }),
  component: PublicProfilePage,
});

type Profile = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  discord_username: string | null;
  favorite_game: string | null;
  bio: string | null;
  level: number;
  xp: number;
  points: number;
};

function PublicProfilePage() {
  const { userId } = useParams({ from: "/u/$userId" });
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let live = true;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select(
          "user_id, display_name, avatar_url, discord_username, favorite_game, bio, level, xp, points",
        )
        .eq("user_id", userId)
        .maybeSingle();
      if (!live) return;
      if (!data) setNotFound(true);
      else setProfile(data as Profile);
      setLoading(false);
    })();
    return () => {
      live = false;
    };
  }, [userId]);

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <SideNav />
      <section className="max-w-4xl mx-auto px-6 py-20">
        {loading ? (
          <p className="text-center text-muted-foreground">جارٍ التحميل...</p>
        ) : notFound || !profile ? (
          <div className="text-center py-20">
            <p className="text-2xl font-black mb-2">😕 لم يتم العثور على اللاعب</p>
            <p className="text-muted-foreground">قد يكون الحساب محذوفاً أو الرابط غير صحيح.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="rounded-2xl bg-gradient-to-br from-accent/15 via-card to-card border border-accent/30 p-6 mb-6">
              <div className="flex items-center gap-5">
                <div className="h-24 w-24 rounded-full overflow-hidden bg-muted ring-2 ring-accent/40 shrink-0">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.display_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">👤</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-3xl font-black truncate">{profile.display_name}</h1>
                  {profile.discord_username && (
                    <p className="text-sm text-muted-foreground">
                      Discord: {profile.discord_username}
                    </p>
                  )}
                  {profile.favorite_game && (
                    <p className="text-sm text-muted-foreground">
                      🎮 {profile.favorite_game}
                    </p>
                  )}
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs bg-accent/20 text-accent font-bold px-2 py-1 rounded-full">
                      Lv {profile.level}
                    </span>
                    <span className="text-xs bg-background/40 px-2 py-1 rounded-full tabular-nums">
                      {profile.xp} XP
                    </span>
                    <span className="text-xs bg-background/40 px-2 py-1 rounded-full tabular-nums">
                      {profile.points} نقطة
                    </span>
                  </div>
                </div>
              </div>
              {profile.bio && (
                <p className="mt-4 text-sm text-muted-foreground whitespace-pre-wrap">
                  {profile.bio}
                </p>
              )}
            </div>

            <div className="space-y-6">
              <TournamentStats userId={userId} />
              <RecentMatches userId={userId} limit={10} />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
