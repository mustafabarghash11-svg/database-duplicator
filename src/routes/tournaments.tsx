import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SideNav } from "@/components/SideNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trophy, Users, Calendar, Gift } from "lucide-react";
import { TournamentMatchesDialog } from "@/components/TournamentMatchesDialog";

export const Route = createFileRoute("/tournaments")({
  head: () => ({
    meta: [
      { title: "البطولات — Khayal Community" },
      { name: "description", content: "سجّل في بطولات مجتمع الخيال أونلاين." },
    ],
  }),
  component: TournamentsPage,
});

type Tournament = {
  id: string;
  title: string;
  game: string;
  description: string | null;
  image_url: string | null;
  start_date: string;
  max_participants: number;
  prize: string | null;
  status: string;
};

function TournamentsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Tournament[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [registered, setRegistered] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data: t } = await supabase
      .from("tournaments")
      .select("*")
      .neq("status", "cancelled")
      .order("start_date", { ascending: true });
    setItems((t as Tournament[]) ?? []);

    const { data: regs } = await supabase
      .from("tournament_registrations")
      .select("tournament_id, user_id");
    const c: Record<string, number> = {};
    const mine = new Set<string>();
    (regs ?? []).forEach((r: any) => {
      c[r.tournament_id] = (c[r.tournament_id] ?? 0) + 1;
      if (user && r.user_id === user.id) mine.add(r.tournament_id);
    });
    setCounts(c);
    setRegistered(mine);
    setLoading(false);
  }

  useEffect(() => { load(); }, [user?.id]);

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <SideNav />
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <p className="text-accent font-bold tracking-widest text-sm mb-3">// TOURNAMENTS</p>
          <h1 className="text-4xl md:text-6xl font-black">البطولات</h1>
          <p className="text-muted-foreground mt-4">سجّل في البطولات واربح نقاط XP وجوائز قيمة</p>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground">جارٍ التحميل...</p>
        ) : items.length === 0 ? (
          <div className="text-center text-muted-foreground py-20">لا توجد بطولات حالياً.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((t) => (
              <TournamentCard
                key={t.id}
                t={t}
                count={counts[t.id] ?? 0}
                isRegistered={registered.has(t.id)}
                userLoggedIn={!!user}
                onChange={load}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function TournamentCard({ t, count, isRegistered, userLoggedIn, onChange }: {
  t: Tournament; count: number; isRegistered: boolean; userLoggedIn: boolean; onChange: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [realName, setRealName] = useState("");
  const [age, setAge] = useState("");
  const [inGameName, setInGameName] = useState("");
  const [inGameId, setInGameId] = useState("");
  const [discordUsername, setDiscordUsername] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const full = count >= t.max_participants;
  const isOpen = t.status === "open" || t.status === "upcoming";

  async function register() {
    setErr(null);
    if (!realName.trim()) return setErr("الاسم الحقيقي مطلوب");
    const ageNum = Number(age);
    if (!ageNum || ageNum < 8 || ageNum > 100) return setErr("العمر غير صحيح");
    if (!inGameName.trim()) return setErr("اسمك في اللعبة مطلوب");
    if (!inGameId.trim()) return setErr("ID داخل اللعبة مطلوب");
    if (!discordUsername.trim()) return setErr("يوزر الديسكورد مطلوب");

    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setErr("سجل دخول أولاً"); setBusy(false); return; }
    const { error } = await supabase.from("tournament_registrations").insert({
      tournament_id: t.id,
      user_id: user.id,
      real_name: realName.trim().slice(0, 80),
      age: ageNum,
      in_game_id: inGameId.trim().slice(0, 60),
      discord_username: discordUsername.trim().slice(0, 60),
      notes: (inGameName.trim() ? `اسم في اللعبة: ${inGameName.trim().slice(0, 60)}` : "") +
             (notes.trim() ? `\n${notes.trim().slice(0, 280)}` : "") || null,
    });
    setBusy(false);
    if (error) setErr(error.message);
    else { setOpen(false); onChange(); }
  }

  async function cancel() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("tournament_registrations").delete().eq("tournament_id", t.id).eq("user_id", user.id);
    onChange();
  }

  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden hover:border-accent transition-all flex flex-col">
      <div className="aspect-video bg-muted relative">
        {t.image_url ? <img src={t.image_url} alt={t.title} className="w-full h-full object-cover" /> :
          <div className="w-full h-full flex items-center justify-center text-5xl">🏆</div>}
        <div className="absolute top-3 right-3 bg-accent text-accent-foreground text-xs font-black px-3 py-1 rounded-full">
          {t.game}
        </div>
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-black text-lg mb-1">{t.title}</h3>
        {t.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{t.description}</p>}
        <div className="space-y-1.5 text-xs text-muted-foreground mt-auto">
          <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{new Date(t.start_date).toLocaleString("ar")}</div>
          <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{count} / {t.max_participants}</div>
          {t.prize && <div className="flex items-center gap-1.5"><Gift className="w-3.5 h-3.5" />{t.prize}</div>}
        </div>

        {!userLoggedIn ? (
          <Button asChild variant="outline" className="mt-4"><Link to="/auth">سجل دخول للتسجيل</Link></Button>
        ) : isRegistered ? (
          <Button onClick={cancel} variant="outline" className="mt-4">إلغاء التسجيل ✓ (قيد المراجعة)</Button>
        ) : !isOpen ? (
          <Button disabled className="mt-4">مغلقة</Button>
        ) : full ? (
          <Button disabled className="mt-4">ممتلئة</Button>
        ) : (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="mt-4 bg-accent hover:bg-accent/90 text-accent-foreground font-bold">
                <Trophy className="w-4 h-4 ml-2" /> سجّل الآن
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>التسجيل في {t.title}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>الاسم الحقيقي *</Label>
                  <Input value={realName} onChange={(e) => setRealName(e.target.value)} maxLength={80} placeholder="اسمك الكامل" />
                </div>
                <div>
                  <Label>العمر *</Label>
                  <Input type="number" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} min={8} max={100} placeholder="مثلاً: 18" />
                </div>
                <div>
                  <Label>اسمك في اللعبة *</Label>
                  <Input value={inGameName} onChange={(e) => setInGameName(e.target.value)} maxLength={60} placeholder="Username داخل اللعبة" />
                </div>
                <div>
                  <Label>ID داخل اللعبة *</Label>
                  <Input value={inGameId} onChange={(e) => setInGameId(e.target.value)} maxLength={60} placeholder="مثلاً: 1234567890" />
                </div>
                <div>
                  <Label>يوزر الديسكورد *</Label>
                  <Input value={discordUsername} onChange={(e) => setDiscordUsername(e.target.value)} maxLength={60} placeholder="مثلاً: khayal_pro" />
                </div>
                <div>
                  <Label>ملاحظات (اختياري)</Label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={280} rows={2} />
                </div>
                {err && <p className="text-sm text-red-500">{err}</p>}
                <p className="text-xs text-muted-foreground">سيتم مراجعة طلبك من قبل المطور وإشعارك بالقبول أو الرفض.</p>
                <Button onClick={register} disabled={busy} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold">
                  {busy ? "جارٍ الإرسال..." : "إرسال طلب التسجيل"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
        <TournamentMatchesDialog tournamentId={t.id} tournamentTitle={t.title} />
      </div>
    </div>
  );
}
