import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, xpForNextLevel, xpProgress } from "@/hooks/useAuth";
import { SideNav } from "@/components/SideNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LogOut, Trophy, Star, Coins } from "lucide-react";
import { TournamentStats, RecentMatches } from "@/components/profile/TournamentStats";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "حسابي — Khayal Community" },
      { name: "description", content: "صفحة حساب العضو في مجتمع الخيال." },
    ],
  }),
  component: AccountPage,
});

const profileSchema = z.object({
  display_name: z.string().trim().min(2).max(40),
  discord_username: z.string().trim().max(40).optional().nullable(),
  favorite_game: z.string().trim().max(40).optional().nullable(),
  bio: z.string().trim().max(280).optional().nullable(),
  avatar_url: z.string().trim().max(500).optional().nullable(),
});

function AccountPage() {
  const { user, profile, loading, refresh, signOut } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    display_name: "",
    discord_username: "",
    favorite_game: "",
    bio: "",
    avatar_url: "",
  });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (profile) {
      setForm({
        display_name: profile.display_name ?? "",
        discord_username: profile.discord_username ?? "",
        favorite_game: profile.favorite_game ?? "",
        bio: profile.bio ?? "",
        avatar_url: profile.avatar_url ?? "",
      });
    }
  }, [profile]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setMsg(null);
    const parsed = profileSchema.safeParse(form);
    if (!parsed.success) { setMsg(parsed.error.issues[0].message); return; }
    setSaving(true);
    const { error } = await supabase.from("profiles").update(parsed.data).eq("user_id", user.id);
    setSaving(false);
    if (error) setMsg(error.message);
    else { setMsg("تم الحفظ ✓"); refresh(); }
  }

  if (loading || !profile) {
    return (
      <div dir="rtl" className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <SideNav />
        <p className="text-muted-foreground">جارٍ التحميل...</p>
      </div>
    );
  }

  const progress = xpProgress(profile.xp, profile.level);
  const need = xpForNextLevel(profile.level);

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <SideNav />
      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-accent font-bold tracking-widest text-sm mb-1">// MY ACCOUNT</p>
            <h1 className="text-4xl font-black">حسابي</h1>
          </div>
          <Button variant="outline" onClick={() => signOut().then(() => navigate({ to: "/" }))}>
            <LogOut className="w-4 h-4 ml-2" /> خروج
          </Button>
        </div>

        {/* XP / Level / Points card */}
        <div className="rounded-2xl bg-gradient-to-br from-accent/15 via-card to-card border border-accent/30 p-6 mb-8">
          <div className="flex items-center gap-5 mb-5">
            <div className="h-20 w-20 rounded-full overflow-hidden bg-muted ring-2 ring-accent/40 shrink-0">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl">👤</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-black truncate">{profile.display_name}</h2>
              {profile.discord_username && (
                <p className="text-sm text-muted-foreground">Discord: {profile.discord_username}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="rounded-xl bg-background/40 p-3 text-center">
              <Star className="w-5 h-5 text-accent mx-auto mb-1" />
              <div className="text-2xl font-black text-accent">{profile.level}</div>
              <div className="text-xs text-muted-foreground">المستوى</div>
            </div>
            <div className="rounded-xl bg-background/40 p-3 text-center">
              <Trophy className="w-5 h-5 text-accent mx-auto mb-1" />
              <div className="text-2xl font-black text-accent tabular-nums">{profile.xp}</div>
              <div className="text-xs text-muted-foreground">XP</div>
            </div>
            <div className="rounded-xl bg-background/40 p-3 text-center">
              <Coins className="w-5 h-5 text-accent mx-auto mb-1" />
              <div className="text-2xl font-black text-accent tabular-nums">{profile.points}</div>
              <div className="text-xs text-muted-foreground">نقطة</div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>تقدم المستوى {profile.level}</span>
              <span className="tabular-nums">{profile.xp} / {(profile.level) * 100} XP لمستوى {profile.level + 1}</span>
            </div>
            <div className="h-3 rounded-full bg-background/60 overflow-hidden">
              <div className="h-full bg-gradient-to-l from-accent to-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        {/* Tournament stats + recent matches */}
        <div className="space-y-6 mb-8">
          <TournamentStats userId={user!.id} />
          <RecentMatches userId={user!.id} limit={5} />
        </div>

        {/* Edit profile */}
        <form onSubmit={save} className="rounded-2xl bg-card border border-border p-6 space-y-4">
          <h3 className="text-xl font-black mb-2">معلومات الملف الشخصي</h3>
          <div>
            <Label>اسم العرض</Label>
            <Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} required />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>يوزر الديسكورد</Label>
              <Input value={form.discord_username} onChange={(e) => setForm({ ...form, discord_username: e.target.value })} />
            </div>
            <div>
              <Label>اللعبة المفضلة</Label>
              <Input value={form.favorite_game} onChange={(e) => setForm({ ...form, favorite_game: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>رابط الصورة</Label>
            <Input value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} placeholder="https://..." />
          </div>
          <div>
            <Label>نبذة عنك</Label>
            <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} maxLength={280} rows={3} />
          </div>
          {msg && <p className="text-sm text-accent">{msg}</p>}
          <Button type="submit" disabled={saving} className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold">
            {saving ? "..." : "حفظ التغييرات"}
          </Button>
        </form>
      </section>
    </div>
  );
}
