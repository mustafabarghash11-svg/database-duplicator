import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SideNav } from "@/components/SideNav";
import { Trophy, Star, Coins, Gamepad2 } from "lucide-react";

export const Route = createFileRoute("/u/$username")({
  head: ({ params }) => ({
    meta: [
      { title: `@${params.username} — Khayal Community` },
      { name: "description", content: `بروفايل اللاعب @${params.username} في مجتمع الخيال للألعاب.` },
    ],
  }),
  component: PublicProfile,
});

type Profile = {
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  favorite_game: string | null;
  discord_username: string | null;
  level: number;
  xp: number;
  points: number;
  tournaments_won: number;
  tournaments_played: number;
  best_rank: number | null;
  team_name: string | null;
  custom_title: string | null;
  username: string;
  created_at: string;
};

function PublicProfile() {
  const { username } = Route.useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, avatar_url, bio, favorite_game, discord_username, level, xp, points, tournaments_won, tournaments_played, best_rank, team_name, custom_title, username, created_at")
        .ilike("username", username)
        .maybeSingle();
      setProfile(data as Profile | null);
      setLoading(false);
    })();
  }, [username]);

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <SideNav />
        <p className="text-muted-foreground">جارٍ التحميل...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div dir="rtl" className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <SideNav />
        <div className="text-center">
          <p className="text-2xl font-black mb-2">اللاعب غير موجود</p>
          <p className="text-muted-foreground mb-4">@{username}</p>
          <Link to="/" className="text-accent hover:underline">العودة للرئيسية</Link>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <SideNav />
      <section className="max-w-3xl mx-auto px-6 py-20">
        <div className="rounded-3xl bg-gradient-to-br from-accent/15 via-card to-card border border-accent/30 p-8">
          <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
            <div className="h-28 w-28 rounded-full overflow-hidden bg-muted ring-4 ring-accent/40 shrink-0">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl">👤</div>
              )}
            </div>
            <div className="text-center sm:text-right flex-1 min-w-0">
              <h1 className="text-3xl font-black mb-1">{profile.display_name}</h1>
              <p className="text-accent text-sm mb-2">@{profile.username}</p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                {profile.custom_title && (
                  <span className="px-3 py-1 rounded-full bg-accent/20 border border-accent/40 text-accent text-xs font-bold">⭐ {profile.custom_title}</span>
                )}
                {profile.team_name && (
                  <span className="px-3 py-1 rounded-full bg-primary/20 border border-primary/40 text-xs font-bold">⚔️ {profile.team_name}</span>
                )}
              </div>
            </div>
          </div>

          {profile.bio && <p className="text-muted-foreground text-center sm:text-right mb-6 leading-relaxed">{profile.bio}</p>}

          {/* Level + XP + Points */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Stat icon={<Star className="w-5 h-5 text-accent" />} value={profile.level} label="المستوى" />
            <Stat icon={<Trophy className="w-5 h-5 text-accent" />} value={profile.xp} label="XP" />
            <Stat icon={<Coins className="w-5 h-5 text-accent" />} value={profile.points} label="نقطة" />
          </div>

          {/* Tournament stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Stat emoji="🏆" value={profile.tournaments_won} label="فاز" />
            <Stat emoji="🎮" value={profile.tournaments_played} label="شارك" />
            <Stat emoji="🥇" value={profile.best_rank ?? "—"} label="أفضل مركز" />
          </div>

          {(profile.favorite_game || profile.discord_username) && (
            <div className="border-t border-border pt-4 space-y-2 text-sm">
              {profile.favorite_game && (
                <p className="flex items-center gap-2"><Gamepad2 className="w-4 h-4 text-accent" /> اللعبة المفضلة: <strong>{profile.favorite_game}</strong></p>
              )}
              {profile.discord_username && (
                <p className="text-muted-foreground">Discord: <span className="text-foreground">{profile.discord_username}</span></p>
              )}
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center mt-6">
            عضو منذ {new Date(profile.created_at).toLocaleDateString("ar")}
          </p>
        </div>
      </section>
    </div>
  );
}

function Stat({ icon, emoji, value, label }: { icon?: React.ReactNode; emoji?: string; value: number | string; label: string }) {
  return (
    <div className="rounded-xl bg-background/40 p-3 text-center">
      <div className="mb-1 flex justify-center">{icon ?? <span className="text-2xl">{emoji}</span>}</div>
      <div className="text-2xl font-black text-accent tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
