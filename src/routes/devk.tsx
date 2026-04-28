import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useSiteDataDraft, defaultData, normalizeDigits, type Game, type ServerStat, type ServerPerk, type CustomSection, type Block, type CardItem, type SocialItem, type Streamer, type LeaderboardEntry, type HallOfFameEntry } from "@/lib/khayal-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast, Toaster } from "sonner";
import { Trash2, Plus, Settings, Gamepad2, BarChart3, Sparkles, Video, Trophy, Crown, Layers, Users, Coins, ShoppingBag, Package, Save, RotateCcw, GripVertical, ArrowUp, ArrowDown } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/ImageUpload";
import { MembersAdmin, PointsAdmin, TournamentsAdmin, ShopAdmin, OrdersAdmin, RegistrationsAdmin, TeamsAdmin } from "@/routes/admin";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export const Route = createFileRoute("/devk")({
  head: () => ({ meta: [{ title: "Dev Panel" }, { name: "robots", content: "noindex" }] }),
  component: DevPanel,
});

function DevPanel() {
  const [authed, setAuthed] = useState(false);
  const [code, setCode] = useState("");

  if (!authed) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center bg-background p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const cleaned = normalizeDigits(code).trim();
            const expected = (import.meta.env.VITE_DEVK_PIN as string | undefined)?.trim() || "87";
            if (cleaned && cleaned === expected) {
              setAuthed(true);
              toast.success("مرحباً بك");
            } else {
              toast.error("كود خاطئ");
            }
          }}
          className="w-full max-w-sm bg-card border border-border rounded-2xl p-8 space-y-4"
        >
          <h1 className="text-2xl font-black text-center">🔒 دخول المطور</h1>
          <Input
            type="text"
            inputMode="numeric"
            placeholder="الكود السري"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="text-center text-lg"
            autoFocus
          />
          <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold">
            دخول
          </Button>
        </form>
        <Toaster richColors />
      </div>
    );
  }

  return <Panel />;
}

function Panel() {
  const { data, setData, save, reset, dirty, saving } = useSiteDataDraft();
  const update = (patch: Partial<typeof data>) => setData({ ...data, ...patch });

  // Games
  const updateGame = (id: string, patch: Partial<Game>) => update({ games: data.games.map((g) => g.id === id ? { ...g, ...patch } : g) });
  const deleteGame = (id: string) => update({ games: data.games.filter((g) => g.id !== id) });
  const addGame = () => update({ games: [...data.games, { id: Date.now().toString(), name: "لعبة جديدة", image: "https://placehold.co/600x800/0d3b3e/22d3ee?text=Game", link: "#", description: "وصف اللعبة" }] });

  // Server stats
  const updateStat = (id: string, patch: Partial<ServerStat>) => update({ serverStats: data.serverStats.map((s) => s.id === id ? { ...s, ...patch } : s) });
  const deleteStat = (id: string) => update({ serverStats: data.serverStats.filter((s) => s.id !== id) });
  const addStat = () => update({ serverStats: [...data.serverStats, { id: Date.now().toString(), label: "تسمية", value: "0", icon: "📊" }] });

  // Server perks
  const updatePerk = (id: string, patch: Partial<ServerPerk>) => update({ serverPerks: data.serverPerks.map((p) => p.id === id ? { ...p, ...patch } : p) });
  const deletePerk = (id: string) => update({ serverPerks: data.serverPerks.filter((p) => p.id !== id) });
  const addPerk = () => update({ serverPerks: [...data.serverPerks, { id: Date.now().toString(), title: "ميزة جديدة", description: "وصف", icon: "✨" }] });

  // Streamers
  const updateStreamer = (id: string, patch: Partial<Streamer>) => update({ streamers: data.streamers.map((s) => s.id === id ? { ...s, ...patch } : s) });
  const deleteStreamer = (id: string) => update({ streamers: data.streamers.filter((s) => s.id !== id) });
  const addStreamer = () => update({ streamers: [...data.streamers, { id: Date.now().toString(), name: "اسم الستريمر", image: "", platform: "Twitch", link: "https://", isLive: false }] });

  // Leaderboard
  const updateLeader = (id: string, patch: Partial<LeaderboardEntry>) => update({ leaderboard: data.leaderboard.map((p) => p.id === id ? { ...p, ...patch } : p) });
  const deleteLeader = (id: string) => update({ leaderboard: data.leaderboard.filter((p) => p.id !== id) });
  const addLeader = () => update({ leaderboard: [...data.leaderboard, { id: Date.now().toString(), rank: data.leaderboard.length + 1, name: "اسم اللاعب", image: "", points: 0, badge: "" }] });

  // Hall of Fame
  const updateHof = (id: string, patch: Partial<HallOfFameEntry>) => update({ hallOfFame: data.hallOfFame.map((c) => c.id === id ? { ...c, ...patch } : c) });
  const deleteHof = (id: string) => update({ hallOfFame: data.hallOfFame.filter((c) => c.id !== id) });
  const addHof = () => update({ hallOfFame: [...data.hallOfFame, { id: Date.now().toString(), championName: "اسم البطل", image: "", tournament: "اسم البطولة", year: new Date().getFullYear().toString() }] });

  // Custom sections
  const addSection = () => {
    const id = Date.now().toString();
    update({ customSections: [...data.customSections, { id, slug: `sec-${id}`, title: "قسم جديد", blocks: [] }] });
  };
  const updateSection = (id: string, patch: Partial<CustomSection>) => update({ customSections: data.customSections.map((s) => s.id === id ? { ...s, ...patch } : s) });
  const deleteSection = (id: string) => update({ customSections: data.customSections.filter((s) => s.id !== id) });
  const moveSection = (id: string, dir: -1 | 1) => {
    const arr = [...data.customSections];
    const i = arr.findIndex((s) => s.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    update({ customSections: arr });
  };

  const addBlock = (sectionId: string, type: Block["type"]) => {
    const id = Date.now().toString();
    let block: Block;
    if (type === "heading") block = { id, type, text: "عنوان جديد" };
    else if (type === "text") block = { id, type, text: "اكتب نصك هنا..." };
    else if (type === "image") block = { id, type, src: "https://placehold.co/800x500/0d3b3e/22d3ee?text=Image", alt: "صورة" };
    else if (type === "button") block = { id, type, text: "اضغط هنا", link: "#" };
    else if (type === "cards") block = { id, type, items: [{ id: id + "-c1", icon: "✨", title: "بطاقة", description: "وصف البطاقة", link: "#" }] };
    else if (type === "video") block = { id, type, url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", caption: "" };
    else if (type === "list") block = { id, type, items: ["نقطة أولى", "نقطة ثانية"] };
    else if (type === "divider") block = { id, type };
    else block = { id, type: "social", items: [{ id: id + "-s1", platform: "discord", label: "Discord", link: data.discordLink }] };
    updateSection(sectionId, { blocks: [...(data.customSections.find((s) => s.id === sectionId)?.blocks ?? []), block] });
  };
  const updateBlock = (sectionId: string, blockId: string, patch: Partial<Block>) => {
    const sec = data.customSections.find((s) => s.id === sectionId);
    if (!sec) return;
    updateSection(sectionId, { blocks: sec.blocks.map((b) => b.id === blockId ? ({ ...b, ...patch } as Block) : b) });
  };
  const deleteBlock = (sectionId: string, blockId: string) => {
    const sec = data.customSections.find((s) => s.id === sectionId);
    if (!sec) return;
    updateSection(sectionId, { blocks: sec.blocks.filter((b) => b.id !== blockId) });
  };
  const moveBlock = (sectionId: string, blockId: string, dir: -1 | 1) => {
    const sec = data.customSections.find((s) => s.id === sectionId);
    if (!sec) return;
    const arr = [...sec.blocks];
    const i = arr.findIndex((b) => b.id === blockId);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    updateSection(sectionId, { blocks: arr });
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3 sticky top-0 z-20 bg-background/80 backdrop-blur py-3 -mx-2 px-2 border-b border-border">
          <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2">
            <Settings className="w-7 h-7 text-accent" />
            لوحة المطور
            {dirty && <span className="text-xs font-normal px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-500 border border-yellow-500/30">تعديلات غير محفوظة</span>}
          </h1>
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              disabled={!dirty || saving}
              onClick={async () => {
                try {
                  await save();
                  toast.success("تم الحفظ ونشره للجميع");
                } catch (e: unknown) {
                  const msg = e instanceof Error ? e.message : "فشل الحفظ";
                  toast.error(msg);
                }
              }}
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold gap-1"
            >
              <Save className="w-4 h-4" />
              {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!dirty || saving}
              onClick={() => { if (confirm("تجاهل التعديلات غير المحفوظة؟")) { reset(); toast.info("تم التراجع"); } }}
              className="gap-1"
            >
              <RotateCcw className="w-4 h-4" />تراجع
            </Button>
            <Button variant="outline" size="sm" onClick={() => { if (confirm("استرجاع الإعدادات الافتراضية؟ (لن يُحفظ تلقائياً، اضغط حفظ بعدها)")) { setData(defaultData); toast.success("تم — اضغط حفظ للنشر"); } }}>استرجاع افتراضي</Button>
            <Button asChild variant="outline" size="sm"><a href="/">عرض الموقع</a></Button>
          </div>
        </div>

        <Tabs defaultValue="site" className="w-full">
          <TabsList className="flex-wrap h-auto justify-start gap-1 bg-muted/50 p-1.5">
            <TabsTrigger value="site" className="gap-1.5"><Settings className="w-4 h-4" />الموقع</TabsTrigger>
            <TabsTrigger value="games" className="gap-1.5"><Gamepad2 className="w-4 h-4" />الألعاب</TabsTrigger>
            <TabsTrigger value="stats" className="gap-1.5"><BarChart3 className="w-4 h-4" />إحصائيات</TabsTrigger>
            <TabsTrigger value="perks" className="gap-1.5"><Sparkles className="w-4 h-4" />مميزات</TabsTrigger>
            <TabsTrigger value="streamers" className="gap-1.5"><Video className="w-4 h-4" />ستريمرز</TabsTrigger>
            <TabsTrigger value="leaderboard" className="gap-1.5"><Trophy className="w-4 h-4" />التوب</TabsTrigger>
            <TabsTrigger value="hof" className="gap-1.5"><Crown className="w-4 h-4" />الأبطال</TabsTrigger>
            <TabsTrigger value="sections" className="gap-1.5"><Layers className="w-4 h-4" />أقسام</TabsTrigger>
            <TabsTrigger value="members" className="gap-1.5"><Users className="w-4 h-4" />الأعضاء</TabsTrigger>
            <TabsTrigger value="points" className="gap-1.5"><Coins className="w-4 h-4" />نقاط/XP</TabsTrigger>
            <TabsTrigger value="tournaments" className="gap-1.5"><Trophy className="w-4 h-4" />البطولات</TabsTrigger>
            <TabsTrigger value="registrations" className="gap-1.5"><Users className="w-4 h-4" />تسجيلات</TabsTrigger>
            <TabsTrigger value="teams" className="gap-1.5"><Users className="w-4 h-4" />الفرق</TabsTrigger>
            <TabsTrigger value="shop" className="gap-1.5"><ShoppingBag className="w-4 h-4" />المتجر</TabsTrigger>
            <TabsTrigger value="orders" className="gap-1.5"><Package className="w-4 h-4" />الطلبات</TabsTrigger>
          </TabsList>

          <TabsContent value="site" className="mt-4">
            <Section title="معلومات الموقع">
              <Field label="اسم الموقع"><Input value={data.siteName} onChange={(e) => update({ siteName: e.target.value })} /></Field>
              <Field label="الوصف"><Textarea value={data.tagline} onChange={(e) => update({ tagline: e.target.value })} /></Field>
              <Field label="رابط الديسكورد"><Input value={data.discordLink} onChange={(e) => update({ discordLink: e.target.value })} /></Field>
              <Field label="Discord Server ID (لعرض عدد المتصلين مباشرة — فعّل Widget من إعدادات السيرفر)">
                <Input value={data.discordServerId} onChange={(e) => update({ discordServerId: e.target.value })} placeholder="123456789012345678" />
              </Field>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <Label>عرض عداد الزوار في الصفحة الرئيسية</Label>
                <Switch checked={data.showVisitorCounter} onCheckedChange={(v) => update({ showVisitorCounter: v })} />
              </div>
            </Section>

            <div className="mt-6">
              <Section title="الإيفنت القادم (Countdown)" action={
                data.upcomingEvent
                  ? <Button variant="destructive" size="sm" onClick={() => update({ upcomingEvent: null })}><Trash2 className="w-4 h-4 ml-1" />حذف</Button>
                  : <Button size="sm" className="bg-accent text-accent-foreground" onClick={() => update({ upcomingEvent: { id: Date.now().toString(), title: "بطولة جديدة", description: "وصف الإيفنت", date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16) } })}><Plus className="w-4 h-4 ml-1" />إضافة</Button>
              }>
                {data.upcomingEvent ? (
                  <div className="space-y-3">
                    <Field label="عنوان الإيفنت"><Input value={data.upcomingEvent.title} onChange={(e) => update({ upcomingEvent: { ...data.upcomingEvent!, title: e.target.value } })} /></Field>
                    <Field label="الوصف"><Textarea value={data.upcomingEvent.description} onChange={(e) => update({ upcomingEvent: { ...data.upcomingEvent!, description: e.target.value } })} /></Field>
                    <Field label="التاريخ والوقت">
                      <Input type="datetime-local" value={data.upcomingEvent.date.slice(0, 16)} onChange={(e) => update({ upcomingEvent: { ...data.upcomingEvent!, date: new Date(e.target.value).toISOString() } })} />
                    </Field>
                  </div>
                ) : <p className="text-sm text-muted-foreground text-center py-2">لا يوجد إيفنت حالياً</p>}
              </Section>
            </div>
          </TabsContent>

          <TabsContent value="games" className="mt-4">
            <Section title={`الألعاب (${data.games.length})`} action={<Button onClick={addGame} size="sm" className="bg-accent text-accent-foreground"><Plus className="w-4 h-4 ml-1" />لعبة</Button>}>
              {data.games.map((g) => (
                <div key={g.id} className="border border-border rounded-xl p-4 space-y-3">
                  <div className="grid sm:grid-cols-2 gap-2">
                    <Input placeholder="الاسم" value={g.name} onChange={(e) => updateGame(g.id, { name: e.target.value })} />
                    <Input placeholder="الرابط" value={g.link} onChange={(e) => updateGame(g.id, { link: e.target.value })} />
                  </div>
                  <ImageUpload value={g.image} onChange={(v) => updateGame(g.id, { image: v })} placeholder="رابط الصورة أو ارفع ملف" />
                  <Input placeholder="الوصف" value={g.description} onChange={(e) => updateGame(g.id, { description: e.target.value })} />
                  <Button variant="destructive" size="sm" onClick={() => deleteGame(g.id)}><Trash2 className="w-4 h-4 ml-1" />حذف</Button>
                </div>
              ))}
            </Section>
          </TabsContent>

          <TabsContent value="stats" className="mt-4">
            <Section title={`إحصائيات السيرفر (${data.serverStats.length})`} action={<Button onClick={addStat} size="sm" className="bg-accent text-accent-foreground"><Plus className="w-4 h-4 ml-1" />إحصائية</Button>}>
              {data.serverStats.map((s) => (
                <div key={s.id} className="border border-border rounded-xl p-4 grid grid-cols-[60px_1fr] gap-3 items-start">
                  <Input value={s.icon} onChange={(e) => updateStat(s.id, { icon: e.target.value })} className="text-2xl text-center h-full" />
                  <div className="space-y-2">
                    <Input placeholder="القيمة (مثل 5,000+)" value={s.value} onChange={(e) => updateStat(s.id, { value: e.target.value })} />
                    <Input placeholder="التسمية (مثل عضو)" value={s.label} onChange={(e) => updateStat(s.id, { label: e.target.value })} />
                    <Button variant="destructive" size="sm" onClick={() => deleteStat(s.id)}><Trash2 className="w-4 h-4 ml-1" />حذف</Button>
                  </div>
                </div>
              ))}
            </Section>
          </TabsContent>

          <TabsContent value="perks" className="mt-4">
            <Section title={`مميزات السيرفر (${data.serverPerks.length})`} action={<Button onClick={addPerk} size="sm" className="bg-accent text-accent-foreground"><Plus className="w-4 h-4 ml-1" />ميزة</Button>}>
              {data.serverPerks.map((p) => (
                <div key={p.id} className="border border-border rounded-xl p-4 grid grid-cols-[60px_1fr] gap-3 items-start">
                  <Input value={p.icon} onChange={(e) => updatePerk(p.id, { icon: e.target.value })} className="text-2xl text-center h-full" />
                  <div className="space-y-2">
                    <Input placeholder="العنوان" value={p.title} onChange={(e) => updatePerk(p.id, { title: e.target.value })} />
                    <Input placeholder="الوصف" value={p.description} onChange={(e) => updatePerk(p.id, { description: e.target.value })} />
                    <Button variant="destructive" size="sm" onClick={() => deletePerk(p.id)}><Trash2 className="w-4 h-4 ml-1" />حذف</Button>
                  </div>
                </div>
              ))}
            </Section>
          </TabsContent>

          <TabsContent value="streamers" className="mt-4">
            <Section title={`الستريمرز / المبدعون (${data.streamers.length})`} action={<Button onClick={addStreamer} size="sm" className="bg-accent text-accent-foreground"><Plus className="w-4 h-4 ml-1" />ستريمر</Button>}>
              {data.streamers.map((s) => (
                <div key={s.id} className="border border-border rounded-xl p-4 space-y-3">
                  <div className="grid sm:grid-cols-2 gap-2">
                    <Input placeholder="الاسم" value={s.name} onChange={(e) => updateStreamer(s.id, { name: e.target.value })} />
                    <Input placeholder="المنصة (Twitch, YouTube, Kick, TikTok...)" value={s.platform} onChange={(e) => updateStreamer(s.id, { platform: e.target.value })} />
                  </div>
                  <Input placeholder="رابط القناة" value={s.link} onChange={(e) => updateStreamer(s.id, { link: e.target.value })} />
                  <ImageUpload value={s.image} onChange={(v) => updateStreamer(s.id, { image: v })} placeholder="صورة الستريمر" />
                  <div className="flex items-center justify-between rounded-lg bg-background/40 p-3">
                    <Label className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${s.isLive ? "bg-red-500 animate-pulse" : "bg-muted-foreground"}`} />
                      {s.isLive ? "حالياً LIVE 🔴" : "غير متصل"}
                    </Label>
                    <Switch checked={s.isLive} onCheckedChange={(v) => updateStreamer(s.id, { isLive: v })} />
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => deleteStreamer(s.id)}><Trash2 className="w-4 h-4 ml-1" />حذف</Button>
                </div>
              ))}
            </Section>
          </TabsContent>

          <TabsContent value="leaderboard" className="mt-4">
            <Section title={`أفضل اللاعبين (${data.leaderboard.length})`} action={<Button onClick={addLeader} size="sm" className="bg-accent text-accent-foreground"><Plus className="w-4 h-4 ml-1" />لاعب</Button>}>
              {data.leaderboard.map((p) => (
                <div key={p.id} className="border border-border rounded-xl p-4 space-y-3">
                  <div className="grid grid-cols-[80px_1fr] gap-2">
                    <Input type="number" placeholder="الترتيب" value={p.rank} onChange={(e) => updateLeader(p.id, { rank: Number(e.target.value) || 1 })} />
                    <Input placeholder="اسم اللاعب" value={p.name} onChange={(e) => updateLeader(p.id, { name: e.target.value })} />
                  </div>
                  <ImageUpload value={p.image} onChange={(v) => updateLeader(p.id, { image: v })} placeholder="صورة اللاعب" />
                  <div className="grid sm:grid-cols-2 gap-2">
                    <Input type="number" placeholder="النقاط" value={p.points} onChange={(e) => updateLeader(p.id, { points: Number(e.target.value) || 0 })} />
                    <Input placeholder="الشارة (مثل: محترف)" value={p.badge} onChange={(e) => updateLeader(p.id, { badge: e.target.value })} />
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => deleteLeader(p.id)}><Trash2 className="w-4 h-4 ml-1" />حذف</Button>
                </div>
              ))}
            </Section>
          </TabsContent>

          <TabsContent value="hof" className="mt-4">
            <Section title={`قاعة الأبطال (${data.hallOfFame.length})`} action={<Button onClick={addHof} size="sm" className="bg-accent text-accent-foreground"><Plus className="w-4 h-4 ml-1" />بطل</Button>}>
              {data.hallOfFame.map((c) => (
                <div key={c.id} className="border border-border rounded-xl p-4 space-y-3">
                  <Input placeholder="اسم البطل" value={c.championName} onChange={(e) => updateHof(c.id, { championName: e.target.value })} />
                  <ImageUpload value={c.image} onChange={(v) => updateHof(c.id, { image: v })} placeholder="صورة البطل" />
                  <div className="grid sm:grid-cols-2 gap-2">
                    <Input placeholder="اسم البطولة" value={c.tournament} onChange={(e) => updateHof(c.id, { tournament: e.target.value })} />
                    <Input placeholder="السنة" value={c.year} onChange={(e) => updateHof(c.id, { year: e.target.value })} />
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => deleteHof(c.id)}><Trash2 className="w-4 h-4 ml-1" />حذف</Button>
                </div>
              ))}
            </Section>
          </TabsContent>

          <TabsContent value="sections" className="mt-4">
            <Section title={`أقسام مخصصة (${data.customSections.length})`} action={<Button onClick={addSection} size="sm" className="bg-accent text-accent-foreground"><Plus className="w-4 h-4 ml-1" />قسم</Button>}>
              {data.customSections.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">لا توجد أقسام بعد. أضف واحداً وابدأ بإضافة نصوص، صور، وأزرار.</p>}
              {data.customSections.map((sec, idx) => (
                <div key={sec.id} className="border-2 border-accent/30 rounded-2xl p-4 space-y-3 bg-background/40">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Input value={sec.title} onChange={(e) => updateSection(sec.id, { title: e.target.value })} placeholder="عنوان القسم" className="flex-1 min-w-[150px] font-bold" />
                    <Button size="icon" variant="outline" onClick={() => moveSection(sec.id, -1)} disabled={idx === 0}><ArrowUp className="w-4 h-4" /></Button>
                    <Button size="icon" variant="outline" onClick={() => moveSection(sec.id, 1)} disabled={idx === data.customSections.length - 1}><ArrowDown className="w-4 h-4" /></Button>
                    <Button size="icon" variant="destructive" onClick={() => deleteSection(sec.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>

                  <div className="space-y-2 pl-2 border-r-2 border-accent/20 pr-3">
                    {sec.blocks.map((b, bi) => (
                      <div key={b.id} className="bg-card border border-border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-accent">{labelFor(b.type)}</span>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => moveBlock(sec.id, b.id, -1)} disabled={bi === 0}><ArrowUp className="w-3 h-3" /></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => moveBlock(sec.id, b.id, 1)} disabled={bi === sec.blocks.length - 1}><ArrowDown className="w-3 h-3" /></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteBlock(sec.id, b.id)}><Trash2 className="w-3 h-3" /></Button>
                          </div>
                        </div>
                        {b.type === "heading" && <Input value={b.text} onChange={(e) => updateBlock(sec.id, b.id, { text: e.target.value })} placeholder="عنوان" />}
                        {b.type === "text" && <Textarea value={b.text} onChange={(e) => updateBlock(sec.id, b.id, { text: e.target.value })} placeholder="نص" rows={3} />}
                        {b.type === "image" && (
                          <>
                            <ImageUpload value={b.src} onChange={(v) => updateBlock(sec.id, b.id, { src: v })} placeholder="رابط الصورة أو ارفع ملف" />
                            <Input value={b.alt} onChange={(e) => updateBlock(sec.id, b.id, { alt: e.target.value })} placeholder="وصف الصورة" />
                          </>
                        )}
                        {b.type === "button" && (
                          <>
                            <Input value={b.text} onChange={(e) => updateBlock(sec.id, b.id, { text: e.target.value })} placeholder="نص الزر" />
                            <Input value={b.link} onChange={(e) => updateBlock(sec.id, b.id, { link: e.target.value })} placeholder="الرابط" />
                          </>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                    <Button size="sm" variant="outline" onClick={() => addBlock(sec.id, "heading")}>+ عنوان</Button>
                    <Button size="sm" variant="outline" onClick={() => addBlock(sec.id, "text")}>+ نص</Button>
                    <Button size="sm" variant="outline" onClick={() => addBlock(sec.id, "image")}>+ صورة</Button>
                    <Button size="sm" variant="outline" onClick={() => addBlock(sec.id, "button")}>+ زر</Button>
                  </div>
                </div>
              ))}
            </Section>
          </TabsContent>

          <TabsContent value="members" className="mt-4"><MembersAdmin /></TabsContent>
          <TabsContent value="points" className="mt-4"><PointsAdmin /></TabsContent>
          <TabsContent value="tournaments" className="mt-4"><TournamentsAdmin /></TabsContent>
          <TabsContent value="registrations" className="mt-4"><RegistrationsAdmin /></TabsContent>
          <TabsContent value="teams" className="mt-4"><TeamsAdmin /></TabsContent>
          <TabsContent value="shop" className="mt-4"><ShopAdmin /></TabsContent>
          <TabsContent value="orders" className="mt-4"><OrdersAdmin /></TabsContent>
        </Tabs>

        <p className="text-center text-xs text-muted-foreground pb-6">التغييرات المحلية تُحفظ تلقائياً · بيانات الأعضاء والمتجر تُحفظ في قاعدة البيانات</p>
      </div>
      <Toaster richColors />
    </div>
  );
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-bold">{title}</h2>
        {action}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}

function labelFor(t: Block["type"]) {
  return t === "heading" ? "عنوان" : t === "text" ? "نص" : t === "image" ? "صورة" : "زر";
}
