import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SideNav } from "@/components/SideNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus, Trophy, ShoppingBag, Package, Users, Sparkles, Pencil, RefreshCw, Save, X, Check, ShieldQuestion, UsersRound } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast, Toaster } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "لوحة الإدارة" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate({ to: "/" });
  }, [loading, user, isAdmin, navigate]);

  if (loading || !user || !isAdmin) {
    return <div dir="rtl" className="min-h-screen flex items-center justify-center bg-background text-muted-foreground"><SideNav />جارٍ التحقق...</div>;
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <SideNav />
      <Toaster richColors position="top-center" />
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        <h1 className="text-3xl md:text-4xl font-black mb-6">لوحة إدارة المجتمع</h1>
        <Tabs defaultValue="members">
          <TabsList className="mb-6 flex-wrap h-auto">
            <TabsTrigger value="members"><Users className="w-4 h-4 ml-1" /> الأعضاء</TabsTrigger>
            <TabsTrigger value="points"><Sparkles className="w-4 h-4 ml-1" /> نقاط و XP</TabsTrigger>
            <TabsTrigger value="tournaments"><Trophy className="w-4 h-4 ml-1" /> البطولات</TabsTrigger>
            <TabsTrigger value="registrations"><Users className="w-4 h-4 ml-1" /> التسجيلات</TabsTrigger>
            <TabsTrigger value="teams"><UsersRound className="w-4 h-4 ml-1" /> الفرق</TabsTrigger>
            <TabsTrigger value="shop"><ShoppingBag className="w-4 h-4 ml-1" /> المتجر</TabsTrigger>
            <TabsTrigger value="orders"><Package className="w-4 h-4 ml-1" /> الطلبات</TabsTrigger>
          </TabsList>
          <TabsContent value="members"><MembersAdmin /></TabsContent>
          <TabsContent value="points"><PointsAdmin /></TabsContent>
          <TabsContent value="tournaments"><TournamentsAdmin /></TabsContent>
          <TabsContent value="registrations"><RegistrationsAdmin /></TabsContent>
          <TabsContent value="teams"><TeamsAdmin /></TabsContent>
          <TabsContent value="shop"><ShopAdmin /></TabsContent>
          <TabsContent value="orders"><OrdersAdmin /></TabsContent>
        </Tabs>
      </section>
    </div>
  );
}

// Reusable wrapper
function TableShell({ title, count, onReload, children }: { title: string; count: number; onReload: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <h3 className="font-black">{title} <span className="text-xs text-muted-foreground">({count})</span></h3>
        <Button variant="outline" size="sm" onClick={onReload}><RefreshCw className="w-4 h-4 ml-1" /> تحديث</Button>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

// ============= TOURNAMENTS =============
export function TournamentsAdmin() {
  const [list, setList] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", game: "", description: "", image_url: "", start_date: "", max_participants: 16, prize: "", status: "open" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  async function load() {
    const { data } = await supabase.from("tournaments").select("*").order("start_date", { ascending: false });
    setList(data ?? []);
  }
  useEffect(() => { load(); }, []);

  async function add() {
    if (!form.title || !form.game || !form.start_date) return toast.error("املأ الحقول الأساسية");
    const { error } = await supabase.from("tournaments").insert({ ...form, status: form.status as any, max_participants: Number(form.max_participants) || 16 });
    if (error) toast.error(error.message); else { toast.success("تمت الإضافة"); setForm({ title: "", game: "", description: "", image_url: "", start_date: "", max_participants: 16, prize: "", status: "open" }); load(); }
  }
  async function remove(id: string) {
    if (!confirm("حذف البطولة؟")) return;
    const { error } = await supabase.from("tournaments").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("تم الحذف"); load(); }
  }
  function startEdit(t: any) {
    setEditingId(t.id);
    setEditForm({
      title: t.title, game: t.game, description: t.description ?? "", image_url: t.image_url ?? "",
      start_date: t.start_date ? new Date(t.start_date).toISOString().slice(0, 16) : "",
      max_participants: t.max_participants, prize: t.prize ?? "", status: t.status,
    });
  }
  async function saveEdit() {
    if (!editingId) return;
    const { error } = await supabase.from("tournaments").update({
      title: editForm.title, game: editForm.game, description: editForm.description || null,
      image_url: editForm.image_url || null,
      start_date: editForm.start_date ? new Date(editForm.start_date).toISOString() : new Date().toISOString(),
      max_participants: Number(editForm.max_participants) || 16,
      prize: editForm.prize || null, status: editForm.status as any,
    }).eq("id", editingId);
    if (error) toast.error(error.message); else { toast.success("تم الحفظ"); setEditingId(null); load(); }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-card border border-border p-5 space-y-3">
        <h3 className="font-black mb-2">إضافة بطولة جديدة</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div><Label>العنوان *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><Label>اللعبة *</Label><Input value={form.game} onChange={(e) => setForm({ ...form, game: e.target.value })} /></div>
          <div><Label>التاريخ *</Label><Input type="datetime-local" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
          <div><Label>الحد الأقصى</Label><Input type="number" min={2} value={form.max_participants} onChange={(e) => setForm({ ...form, max_participants: +e.target.value })} /></div>
          <div><Label>الجائزة</Label><Input value={form.prize} onChange={(e) => setForm({ ...form, prize: e.target.value })} /></div>
          <div><Label>رابط الصورة</Label><Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} /></div>
        </div>
        <div><Label>الوصف</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
        <Button onClick={add} className="bg-accent text-accent-foreground"><Plus className="w-4 h-4 ml-1" /> إضافة</Button>
      </div>

      <TableShell title="جدول البطولات" count={list.length} onReload={load}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الصورة</TableHead>
              <TableHead>العنوان</TableHead>
              <TableHead>اللعبة</TableHead>
              <TableHead>التاريخ</TableHead>
              <TableHead>الحد</TableHead>
              <TableHead>الجائزة</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>الوصف</TableHead>
              <TableHead className="text-left">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.length === 0 && <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">لا توجد بطولات</TableCell></TableRow>}
            {list.map((t) => editingId === t.id ? (
              <TableRow key={t.id} className="bg-muted/20">
                <TableCell><Input value={editForm.image_url} onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })} className="w-32" /></TableCell>
                <TableCell><Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} /></TableCell>
                <TableCell><Input value={editForm.game} onChange={(e) => setEditForm({ ...editForm, game: e.target.value })} /></TableCell>
                <TableCell><Input type="datetime-local" value={editForm.start_date} onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })} /></TableCell>
                <TableCell><Input type="number" value={editForm.max_participants} onChange={(e) => setEditForm({ ...editForm, max_participants: +e.target.value })} className="w-20" /></TableCell>
                <TableCell><Input value={editForm.prize} onChange={(e) => setEditForm({ ...editForm, prize: e.target.value })} /></TableCell>
                <TableCell>
                  <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className="bg-background border border-border rounded px-2 py-1 text-sm">
                    <option value="upcoming">قادمة</option><option value="open">مفتوحة</option><option value="in_progress">جارية</option><option value="completed">منتهية</option><option value="cancelled">ملغاة</option>
                  </select>
                </TableCell>
                <TableCell><Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={1} className="min-w-48" /></TableCell>
                <TableCell><div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={saveEdit}><Save className="w-4 h-4 text-green-500" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}><X className="w-4 h-4" /></Button>
                </div></TableCell>
              </TableRow>
            ) : (
              <TableRow key={t.id}>
                <TableCell>{t.image_url ? <img src={t.image_url} alt="" className="w-12 h-12 object-cover rounded" /> : <span className="text-muted-foreground text-xs">—</span>}</TableCell>
                <TableCell className="font-bold">{t.title}</TableCell>
                <TableCell>{t.game}</TableCell>
                <TableCell className="text-xs whitespace-nowrap">{new Date(t.start_date).toLocaleString("ar")}</TableCell>
                <TableCell>{t.max_participants}</TableCell>
                <TableCell className="text-xs">{t.prize ?? "—"}</TableCell>
                <TableCell><span className="text-xs px-2 py-1 rounded bg-muted">{t.status}</span></TableCell>
                <TableCell className="text-xs max-w-xs truncate">{t.description ?? "—"}</TableCell>
                <TableCell><div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => startEdit(t)}><Pencil className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(t.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                </div></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableShell>
    </div>
  );
}

// ============= REGISTRATIONS =============
export function RegistrationsAdmin() {
  const [list, setList] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [teams, setTeams] = useState<any[]>([]);
  const [editingNote, setEditingNote] = useState<Record<string, string>>({});

  async function load() {
    const { data } = await supabase
      .from("tournament_registrations")
      .select("id, in_game_id, notes, created_at, user_id, tournament_id, real_name, age, discord_username, status, admin_notes, team_id, tournaments(title, game)")
      .order("created_at", { ascending: false });
    if (data && data.length) {
      const userIds = Array.from(new Set(data.map((d: any) => d.user_id)));
      const { data: profs } = await supabase.from("profiles").select("user_id, display_name, discord_username").in("user_id", userIds);
      const map: Record<string, any> = {};
      (profs ?? []).forEach((p: any) => { map[p.user_id] = p; });
      setList(data.map((d: any) => ({ ...d, profile: map[d.user_id] })));
    } else setList([]);
    const { data: tms } = await supabase.from("tournament_teams").select("id, name, tournament_id");
    setTeams(tms ?? []);
  }
  useEffect(() => { load(); }, []);

  async function setStatus(id: string, status: "approved" | "rejected" | "pending") {
    const adminNote = editingNote[id];
    const patch: any = { status };
    if (adminNote !== undefined) patch.admin_notes = adminNote || null;
    const { error } = await supabase.from("tournament_registrations").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(status === "approved" ? "تم القبول" : status === "rejected" ? "تم الرفض" : "أُعيد للمراجعة");
      load();
    }
  }

  async function assignTeam(id: string, teamId: string | null) {
    const { error } = await supabase.from("tournament_registrations").update({ team_id: teamId }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("تم تعيين الفريق"); load(); }
  }

  async function remove(id: string) {
    if (!confirm("حذف التسجيل نهائياً؟")) return;
    const { error } = await supabase.from("tournament_registrations").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("حُذف"); load(); }
  }

  const filtered = filter === "all" ? list : list.filter((r) => r.status === filter);
  const counts = {
    pending: list.filter((r) => r.status === "pending").length,
    approved: list.filter((r) => r.status === "approved").length,
    rejected: list.filter((r) => r.status === "rejected").length,
  };

  return (
    <TableShell title="طلبات التسجيل" count={filtered.length} onReload={load}>
      <div className="flex flex-wrap gap-2 mb-4">
        <Button size="sm" variant={filter === "pending" ? "default" : "outline"} onClick={() => setFilter("pending")}>
          <ShieldQuestion className="w-4 h-4 ml-1" />قيد المراجعة ({counts.pending})
        </Button>
        <Button size="sm" variant={filter === "approved" ? "default" : "outline"} onClick={() => setFilter("approved")}>
          <Check className="w-4 h-4 ml-1" />مقبولة ({counts.approved})
        </Button>
        <Button size="sm" variant={filter === "rejected" ? "default" : "outline"} onClick={() => setFilter("rejected")}>
          <X className="w-4 h-4 ml-1" />مرفوضة ({counts.rejected})
        </Button>
        <Button size="sm" variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>
          الكل ({list.length})
        </Button>
      </div>
      <div className="space-y-3">
        {filtered.length === 0 && <p className="text-center py-8 text-muted-foreground">لا توجد تسجيلات</p>}
        {filtered.map((r) => {
          const tournamentTeams = teams.filter((tm) => tm.tournament_id === r.tournament_id);
          return (
            <div key={r.id} className="border border-border rounded-xl p-4 space-y-3 bg-card">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-black text-lg">{r.real_name ?? r.profile?.display_name ?? "—"}</h4>
                    {r.status === "pending" && <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">قيد المراجعة</Badge>}
                    {r.status === "approved" && <Badge className="bg-green-600 text-white">مقبول</Badge>}
                    {r.status === "rejected" && <Badge variant="destructive">مرفوض</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {r.tournaments?.title} • {r.tournaments?.game} • {new Date(r.created_at).toLocaleString("ar")}
                  </p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                <div><span className="text-muted-foreground">العمر:</span> {r.age ?? "—"}</div>
                <div><span className="text-muted-foreground">ID اللعبة:</span> {r.in_game_id ?? "—"}</div>
                <div><span className="text-muted-foreground">ديسكورد:</span> {r.discord_username ?? r.profile?.discord_username ?? "—"}</div>
              </div>

              {r.notes && <div className="text-xs bg-muted/40 rounded-lg p-2"><span className="text-muted-foreground">ملاحظة العضو: </span>{r.notes}</div>}

              <div className="space-y-2">
                <Label className="text-xs">ملاحظة المطور (اختياري)</Label>
                <Textarea
                  rows={2}
                  defaultValue={r.admin_notes ?? ""}
                  onChange={(e) => setEditingNote((s) => ({ ...s, [r.id]: e.target.value }))}
                  placeholder="ستظهر للعضو إن أردت..."
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {r.status !== "approved" && (
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => setStatus(r.id, "approved")}>
                    <Check className="w-4 h-4 ml-1" />قبول
                  </Button>
                )}
                {r.status !== "rejected" && (
                  <Button size="sm" variant="destructive" onClick={() => setStatus(r.id, "rejected")}>
                    <X className="w-4 h-4 ml-1" />رفض
                  </Button>
                )}
                {r.status !== "pending" && (
                  <Button size="sm" variant="outline" onClick={() => setStatus(r.id, "pending")}>
                    <RefreshCw className="w-4 h-4 ml-1" />إعادة للمراجعة
                  </Button>
                )}

                {r.status === "approved" && (
                  <div className="flex items-center gap-2 mr-auto">
                    <Label className="text-xs">الفريق:</Label>
                    <Select value={r.team_id ?? "none"} onValueChange={(v) => assignTeam(r.id, v === "none" ? null : v)}>
                      <SelectTrigger className="h-8 w-48"><SelectValue placeholder="بدون فريق" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">بدون فريق</SelectItem>
                        {tournamentTeams.map((tm) => <SelectItem key={tm.id} value={tm.id}>{tm.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </TableShell>
  );
}

// ============= TEAMS =============
export function TeamsAdmin() {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [members, setMembers] = useState<Record<string, any[]>>({});
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [newName, setNewName] = useState("");

  async function load() {
    const { data: ts } = await supabase.from("tournaments").select("id, title, game").order("start_date", { ascending: false });
    setTournaments(ts ?? []);
    if (ts && ts.length && !selectedTournament) setSelectedTournament(ts[0].id);

    const { data: tms } = await supabase.from("tournament_teams").select("*").order("created_at");
    setTeams(tms ?? []);

    const { data: regs } = await supabase
      .from("tournament_registrations")
      .select("id, real_name, in_game_id, team_id, user_id, status")
      .eq("status", "approved");
    if (regs && regs.length) {
      const userIds = Array.from(new Set(regs.map((r: any) => r.user_id)));
      const { data: profs } = await supabase.from("profiles").select("user_id, display_name").in("user_id", userIds);
      const profMap: Record<string, any> = {};
      (profs ?? []).forEach((p: any) => { profMap[p.user_id] = p; });
      const grouped: Record<string, any[]> = {};
      (regs ?? []).forEach((r: any) => {
        if (!r.team_id) return;
        if (!grouped[r.team_id]) grouped[r.team_id] = [];
        grouped[r.team_id].push({ ...r, profile: profMap[r.user_id] });
      });
      setMembers(grouped);
    } else setMembers({});
  }
  useEffect(() => { load(); }, []);

  async function addTeam() {
    if (!newName.trim() || !selectedTournament) return toast.error("اختر بطولة واسم الفريق");
    const { error } = await supabase.from("tournament_teams").insert({
      name: newName.trim().slice(0, 80),
      tournament_id: selectedTournament,
    });
    if (error) toast.error(error.message); else { toast.success("أُضيف الفريق"); setNewName(""); load(); }
  }

  async function removeTeam(id: string) {
    if (!confirm("حذف الفريق؟ سيتم فك ارتباط أعضائه.")) return;
    const { error } = await supabase.from("tournament_teams").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("حُذف"); load(); }
  }

  async function renameTeam(id: string, name: string) {
    const { error } = await supabase.from("tournament_teams").update({ name: name.trim().slice(0, 80) }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("تم"); load(); }
  }

  const visibleTeams = teams.filter((t) => t.tournament_id === selectedTournament);

  return (
    <TableShell title="إدارة الفرق" count={visibleTeams.length} onReload={load}>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[200px]">
            <Label className="text-xs">البطولة</Label>
            <Select value={selectedTournament} onValueChange={setSelectedTournament}>
              <SelectTrigger><SelectValue placeholder="اختر بطولة" /></SelectTrigger>
              <SelectContent>
                {tournaments.map((t) => <SelectItem key={t.id} value={t.id}>{t.title} — {t.game}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <Label className="text-xs">اسم فريق جديد</Label>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="مثلاً: Team Alpha" maxLength={80} />
          </div>
          <Button onClick={addTeam} className="bg-accent text-accent-foreground"><Plus className="w-4 h-4 ml-1" />إنشاء</Button>
        </div>

        {visibleTeams.length === 0 && <p className="text-center py-8 text-muted-foreground">لا توجد فرق لهذه البطولة بعد</p>}

        {visibleTeams.map((tm) => (
          <div key={tm.id} className="border border-border rounded-xl p-4 bg-card">
            <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
              <Input
                defaultValue={tm.name}
                onBlur={(e) => { if (e.target.value !== tm.name) renameTeam(tm.id, e.target.value); }}
                className="font-black text-lg max-w-xs"
              />
              <div className="flex items-center gap-2">
                <Badge variant="outline">{(members[tm.id] ?? []).length} عضو</Badge>
                <Button size="icon" variant="ghost" onClick={() => removeTeam(tm.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
              </div>
            </div>
            <div className="space-y-1.5">
              {(members[tm.id] ?? []).length === 0 && <p className="text-xs text-muted-foreground">لا أعضاء — عيّن من تبويب التسجيلات</p>}
              {(members[tm.id] ?? []).map((m) => (
                <div key={m.id} className="text-sm flex items-center gap-2 bg-muted/30 rounded-lg p-2">
                  <span className="font-bold">{m.real_name ?? m.profile?.display_name ?? "—"}</span>
                  {m.in_game_id && <span className="text-xs text-muted-foreground">• {m.in_game_id}</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </TableShell>
  );
}

// ============= SHOP =============
export function ShopAdmin() {
  const [list, setList] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", description: "", image_url: "", price_points: 100, stock: -1, is_active: true });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  async function load() {
    const { data } = await supabase.from("shop_items").select("*").order("created_at", { ascending: false });
    setList(data ?? []);
  }
  useEffect(() => { load(); }, []);

  async function add() {
    if (!form.name) return toast.error("الاسم مطلوب");
    const { error } = await supabase.from("shop_items").insert({ ...form, price_points: Number(form.price_points), stock: Number(form.stock) });
    if (error) toast.error(error.message); else { toast.success("تمت الإضافة"); setForm({ name: "", description: "", image_url: "", price_points: 100, stock: -1, is_active: true }); load(); }
  }
  async function remove(id: string) {
    if (!confirm("حذف المنتج؟")) return;
    const { error } = await supabase.from("shop_items").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("حُذف"); load(); }
  }
  async function toggleActive(id: string, v: boolean) { await supabase.from("shop_items").update({ is_active: v }).eq("id", id); load(); }
  function startEdit(it: any) {
    setEditingId(it.id);
    setEditForm({ name: it.name, description: it.description ?? "", image_url: it.image_url ?? "", price_points: it.price_points, stock: it.stock, is_active: it.is_active });
  }
  async function saveEdit() {
    if (!editingId) return;
    if (!editForm.name) return toast.error("الاسم مطلوب");
    const { error } = await supabase.from("shop_items").update({
      name: editForm.name, description: editForm.description || null, image_url: editForm.image_url || null,
      price_points: Number(editForm.price_points), stock: Number(editForm.stock), is_active: !!editForm.is_active,
    }).eq("id", editingId);
    if (error) toast.error(error.message); else { toast.success("تم الحفظ"); setEditingId(null); load(); }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-card border border-border p-5 space-y-3">
        <h3 className="font-black mb-2">إضافة منتج</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div><Label>الاسم *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>السعر بالنقاط</Label><Input type="number" min={0} value={form.price_points} onChange={(e) => setForm({ ...form, price_points: +e.target.value })} /></div>
          <div><Label>الكمية (-1 = لا محدودة)</Label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: +e.target.value })} /></div>
          <div><Label>رابط الصورة</Label><Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} /></div>
        </div>
        <div><Label>الوصف</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
        <Button onClick={add} className="bg-accent text-accent-foreground"><Plus className="w-4 h-4 ml-1" /> إضافة</Button>
      </div>

      <TableShell title="جدول منتجات المتجر" count={list.length} onReload={load}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الصورة</TableHead>
              <TableHead>الاسم</TableHead>
              <TableHead>السعر</TableHead>
              <TableHead>الكمية</TableHead>
              <TableHead>مفعل</TableHead>
              <TableHead>الوصف</TableHead>
              <TableHead>أنشئ في</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">لا توجد منتجات</TableCell></TableRow>}
            {list.map((it) => editingId === it.id ? (
              <TableRow key={it.id} className="bg-muted/20">
                <TableCell><Input value={editForm.image_url} onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })} className="w-32" /></TableCell>
                <TableCell><Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></TableCell>
                <TableCell><Input type="number" value={editForm.price_points} onChange={(e) => setEditForm({ ...editForm, price_points: +e.target.value })} className="w-24" /></TableCell>
                <TableCell><Input type="number" value={editForm.stock} onChange={(e) => setEditForm({ ...editForm, stock: +e.target.value })} className="w-24" /></TableCell>
                <TableCell><input type="checkbox" checked={!!editForm.is_active} onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })} /></TableCell>
                <TableCell><Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={1} className="min-w-48" /></TableCell>
                <TableCell className="text-xs">{new Date(it.created_at).toLocaleDateString("ar")}</TableCell>
                <TableCell><div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={saveEdit}><Save className="w-4 h-4 text-green-500" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}><X className="w-4 h-4" /></Button>
                </div></TableCell>
              </TableRow>
            ) : (
              <TableRow key={it.id}>
                <TableCell>{it.image_url ? <img src={it.image_url} alt="" className="w-12 h-12 object-cover rounded" /> : <span className="text-muted-foreground text-xs">—</span>}</TableCell>
                <TableCell className="font-bold">{it.name}</TableCell>
                <TableCell>{it.price_points}</TableCell>
                <TableCell>{it.stock < 0 ? "∞" : it.stock}</TableCell>
                <TableCell>
                  <button onClick={() => toggleActive(it.id, !it.is_active)} className={`text-xs px-2 py-1 rounded ${it.is_active ? "bg-green-500/20 text-green-500" : "bg-muted text-muted-foreground"}`}>
                    {it.is_active ? "نعم" : "لا"}
                  </button>
                </TableCell>
                <TableCell className="text-xs max-w-xs truncate">{it.description ?? "—"}</TableCell>
                <TableCell className="text-xs whitespace-nowrap">{new Date(it.created_at).toLocaleDateString("ar")}</TableCell>
                <TableCell><div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => startEdit(it)}><Pencil className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(it.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                </div></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableShell>
    </div>
  );
}

// ============= ORDERS =============
export function OrdersAdmin() {
  const [list, setList] = useState<any[]>([]);

  async function load() {
    const { data } = await supabase
      .from("shop_orders")
      .select("*, shop_items(name, image_url)")
      .order("created_at", { ascending: false });
    if (data && data.length) {
      const userIds = Array.from(new Set(data.map((d: any) => d.user_id)));
      const { data: profs } = await supabase.from("profiles").select("user_id, display_name, discord_username").in("user_id", userIds);
      const map: Record<string, any> = {};
      (profs ?? []).forEach((p: any) => { map[p.user_id] = p; });
      setList(data.map((d: any) => ({ ...d, profile: map[d.user_id] })));
    } else setList([]);
  }
  useEffect(() => { load(); }, []);

  async function setStatus(id: string, status: string) {
    const { error } = await supabase.from("shop_orders").update({ status: status as any }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("تحدّث"); load(); }
  }
  async function saveAdminNote(id: string, note: string) {
    const { error } = await supabase.from("shop_orders").update({ admin_notes: note }).eq("id", id);
    if (error) toast.error(error.message); else toast.success("تم حفظ الملاحظة");
  }

  return (
    <TableShell title="جدول طلبات المتجر" count={list.length} onReload={load}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>المنتج</TableHead>
            <TableHead>العضو</TableHead>
            <TableHead>Discord</TableHead>
            <TableHead>النقاط</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead>ملاحظة العضو</TableHead>
            <TableHead>ملاحظة الإدارة</TableHead>
            <TableHead>التاريخ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">لا توجد طلبات</TableCell></TableRow>}
          {list.map((o) => (
            <TableRow key={o.id}>
              <TableCell className="font-bold flex items-center gap-2">
                {o.shop_items?.image_url && <img src={o.shop_items.image_url} alt="" className="w-8 h-8 object-cover rounded" />}
                {o.shop_items?.name ?? "—"}
              </TableCell>
              <TableCell>{o.profile?.display_name ?? "—"}</TableCell>
              <TableCell className="text-xs">{o.profile?.discord_username ?? "—"}</TableCell>
              <TableCell>{o.points_spent}</TableCell>
              <TableCell>
                <select value={o.status} onChange={(e) => setStatus(o.id, e.target.value)} className="bg-background border border-border rounded px-2 py-1 text-sm">
                  <option value="pending">قيد المعالجة</option>
                  <option value="fulfilled">تم التسليم</option>
                  <option value="cancelled">ملغي</option>
                </select>
              </TableCell>
              <TableCell className="text-xs max-w-xs">{o.user_notes ?? "—"}</TableCell>
              <TableCell>
                <Input
                  defaultValue={o.admin_notes ?? ""}
                  placeholder="أضف ملاحظة..."
                  onBlur={(e) => { if (e.target.value !== (o.admin_notes ?? "")) saveAdminNote(o.id, e.target.value); }}
                  className="min-w-40 text-xs"
                />
              </TableCell>
              <TableCell className="text-xs whitespace-nowrap">{new Date(o.created_at).toLocaleString("ar")}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableShell>
  );
}

// ============= POINTS & XP =============
export function PointsAdmin() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [pointsAmount, setPointsAmount] = useState(50);
  const [xpAmount, setXpAmount] = useState(100);

  async function find() {
    let q = supabase.from("profiles").select("user_id, display_name, discord_username, avatar_url, points, level, xp").order("xp", { ascending: false }).limit(50);
    if (search.trim()) q = supabase.from("profiles").select("user_id, display_name, discord_username, avatar_url, points, level, xp").or(`display_name.ilike.%${search}%,discord_username.ilike.%${search}%`).limit(50);
    const { data } = await q;
    setResults(data ?? []);
  }
  useEffect(() => { find(); }, []);

  async function awardPoints(userId: string, delta: number) {
    const { data: p } = await supabase.from("profiles").select("points").eq("user_id", userId).maybeSingle();
    if (!p) return toast.error("لم يُعثر");
    const { error } = await supabase.from("profiles").update({ points: Math.max(0, p.points + delta) }).eq("user_id", userId);
    if (error) toast.error(error.message); else { toast.success(`${delta > 0 ? "أضيف" : "خُصم"} ${Math.abs(delta)} نقطة`); find(); }
  }
  async function awardXp(userId: string, delta: number) {
    const { data: p } = await supabase.from("profiles").select("xp").eq("user_id", userId).maybeSingle();
    if (!p) return toast.error("لم يُعثر");
    const newXp = Math.max(0, (p.xp ?? 0) + delta);
    const newLevel = Math.max(1, Math.floor(newXp / 100) + 1);
    const { error } = await supabase.from("profiles").update({ xp: newXp, level: newLevel }).eq("user_id", userId);
    if (error) toast.error(error.message); else { toast.success(`${delta > 0 ? "أضيف" : "خُصم"} ${Math.abs(delta)} XP · Lv ${newLevel}`); find(); }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-card border border-border p-5 space-y-3">
        <h3 className="font-black">منح / خصم نقاط و XP</h3>
        <div className="flex gap-2">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث باسم العضو أو الديسكورد..." onKeyDown={(e) => e.key === "Enter" && find()} />
          <Button onClick={find} className="bg-accent text-accent-foreground">بحث</Button>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-2"><Label className="shrink-0">قيمة نقاط:</Label><Input type="number" value={pointsAmount} onChange={(e) => setPointsAmount(+e.target.value)} /></div>
          <div className="flex items-center gap-2"><Label className="shrink-0">قيمة XP:</Label><Input type="number" value={xpAmount} onChange={(e) => setXpAmount(+e.target.value)} /></div>
        </div>
      </div>

      <TableShell title="جدول الأعضاء" count={results.length} onReload={find}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>العضو</TableHead>
              <TableHead>Discord</TableHead>
              <TableHead>المستوى</TableHead>
              <TableHead>XP</TableHead>
              <TableHead>النقاط</TableHead>
              <TableHead>إجراء النقاط</TableHead>
              <TableHead>إجراء XP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">لا توجد نتائج</TableCell></TableRow>}
            {results.map((r) => (
              <TableRow key={r.user_id}>
                <TableCell className="flex items-center gap-2 font-bold">
                  {r.avatar_url && <img src={r.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />}
                  {r.display_name}
                </TableCell>
                <TableCell className="text-xs">{r.discord_username ?? "—"}</TableCell>
                <TableCell>{r.level}</TableCell>
                <TableCell>{r.xp ?? 0}</TableCell>
                <TableCell>{r.points}</TableCell>
                <TableCell><div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => awardPoints(r.user_id, -pointsAmount)}>− {pointsAmount}</Button>
                  <Button size="sm" className="bg-accent text-accent-foreground" onClick={() => awardPoints(r.user_id, pointsAmount)}>+ {pointsAmount}</Button>
                </div></TableCell>
                <TableCell><div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => awardXp(r.user_id, -xpAmount)}>− {xpAmount}</Button>
                  <Button size="sm" className="bg-primary text-primary-foreground" onClick={() => awardXp(r.user_id, xpAmount)}>+ {xpAmount}</Button>
                </div></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableShell>
    </div>
  );
}

// ============= MEMBERS =============
export function MembersAdmin() {
  const [search, setSearch] = useState("");
  const [list, setList] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [roles, setRoles] = useState<Record<string, string>>({});

  async function load() {
    let q = supabase.from("profiles").select("*").order("xp", { ascending: false }).limit(100);
    if (search.trim()) q = supabase.from("profiles").select("*").or(`display_name.ilike.%${search}%,discord_username.ilike.%${search}%`).limit(100);
    const { data } = await q;
    setList(data ?? []);
    if (data && data.length) {
      const { data: rs } = await supabase.from("user_roles").select("user_id, role").in("user_id", data.map((d) => d.user_id));
      const map: Record<string, string> = {};
      (rs ?? []).forEach((r: any) => { map[r.user_id] = r.role; });
      setRoles(map);
    }
  }
  useEffect(() => { load(); }, []);

  function startEdit(p: any) {
    setEditingId(p.user_id);
    setEditForm({
      display_name: p.display_name ?? "", discord_username: p.discord_username ?? "",
      favorite_game: p.favorite_game ?? "", bio: p.bio ?? "", avatar_url: p.avatar_url ?? "",
      points: p.points ?? 0, xp: p.xp ?? 0, level: p.level ?? 1,
      tournaments_won: p.tournaments_won ?? 0,
      tournaments_played: p.tournaments_played ?? 0,
      best_rank: p.best_rank ?? "",
      team_name: p.team_name ?? "",
      custom_title: p.custom_title ?? "",
      dev_notes: p.dev_notes ?? "",
      username: p.username ?? "",
    });
  }
  async function saveEdit() {
    if (!editingId) return;
    const { error } = await supabase.from("profiles").update({
      display_name: editForm.display_name, discord_username: editForm.discord_username || null,
      favorite_game: editForm.favorite_game || null, bio: editForm.bio || null,
      avatar_url: editForm.avatar_url || null,
      points: Math.max(0, Number(editForm.points) || 0),
      xp: Math.max(0, Number(editForm.xp) || 0),
      level: Math.max(1, Number(editForm.level) || 1),
      tournaments_won: Math.max(0, Number(editForm.tournaments_won) || 0),
      tournaments_played: Math.max(0, Number(editForm.tournaments_played) || 0),
      best_rank: editForm.best_rank === "" || editForm.best_rank == null ? null : Math.max(1, Number(editForm.best_rank)),
      team_name: editForm.team_name || null,
      custom_title: editForm.custom_title || null,
      dev_notes: editForm.dev_notes || null,
      username: editForm.username ? String(editForm.username).trim().toLowerCase().replace(/[^a-z0-9_-]/g, "") || null : null,
    }).eq("user_id", editingId);
    if (error) toast.error(error.message); else { toast.success("تم الحفظ"); setEditingId(null); load(); }
  }
  async function quickWinBump(userId: string, delta: number) {
    const { error } = await supabase.rpc("admin_increment_wins", { _user_id: userId, _delta: delta });
    if (error) toast.error(error.message); else { toast.success(delta > 0 ? "+1 فوز" : "-1 فوز"); load(); }
  }
  async function changeRole(userId: string, role: string) {
    await supabase.from("user_roles").delete().eq("user_id", userId);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: role as any });
    if (error) toast.error(error.message); else { toast.success("تم تغيير الرتبة"); load(); }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-card border border-border p-5">
        <div className="flex gap-2">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث بالاسم أو الديسكورد..." onKeyDown={(e) => e.key === "Enter" && load()} />
          <Button onClick={load} className="bg-accent text-accent-foreground">بحث</Button>
        </div>
      </div>

      <TableShell title="جدول الأعضاء" count={list.length} onReload={load}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الصورة</TableHead>
              <TableHead>الاسم</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Discord</TableHead>
              <TableHead>اللعبة</TableHead>
              <TableHead>المستوى</TableHead>
              <TableHead>XP</TableHead>
              <TableHead>النقاط</TableHead>
              <TableHead>🏆 فاز</TableHead>
              <TableHead>🎮 شارك</TableHead>
              <TableHead>أفضل مركز</TableHead>
              <TableHead>الفريق</TableHead>
              <TableHead>اللقب</TableHead>
              <TableHead>الرتبة</TableHead>
              <TableHead>ملاحظات المطور</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.length === 0 && <TableRow><TableCell colSpan={16} className="text-center py-8 text-muted-foreground">لا يوجد أعضاء</TableCell></TableRow>}
            {list.map((p) => editingId === p.user_id ? (
              <TableRow key={p.user_id} className="bg-muted/20">
                <TableCell><Input value={editForm.avatar_url} onChange={(e) => setEditForm({ ...editForm, avatar_url: e.target.value })} className="w-32" placeholder="URL" /></TableCell>
                <TableCell><Input value={editForm.display_name} onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })} /></TableCell>
                <TableCell><Input value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} placeholder="username" className="w-28" /></TableCell>
                <TableCell><Input value={editForm.discord_username} onChange={(e) => setEditForm({ ...editForm, discord_username: e.target.value })} /></TableCell>
                <TableCell><Input value={editForm.favorite_game} onChange={(e) => setEditForm({ ...editForm, favorite_game: e.target.value })} /></TableCell>
                <TableCell><Input type="number" value={editForm.level} onChange={(e) => setEditForm({ ...editForm, level: +e.target.value })} className="w-20" /></TableCell>
                <TableCell><Input type="number" value={editForm.xp} onChange={(e) => setEditForm({ ...editForm, xp: +e.target.value })} className="w-24" /></TableCell>
                <TableCell><Input type="number" value={editForm.points} onChange={(e) => setEditForm({ ...editForm, points: +e.target.value })} className="w-24" /></TableCell>
                <TableCell><Input type="number" value={editForm.tournaments_won} onChange={(e) => setEditForm({ ...editForm, tournaments_won: +e.target.value })} className="w-20" /></TableCell>
                <TableCell><Input type="number" value={editForm.tournaments_played} onChange={(e) => setEditForm({ ...editForm, tournaments_played: +e.target.value })} className="w-20" /></TableCell>
                <TableCell><Input type="number" value={editForm.best_rank} onChange={(e) => setEditForm({ ...editForm, best_rank: e.target.value })} className="w-20" placeholder="—" /></TableCell>
                <TableCell><Input value={editForm.team_name} onChange={(e) => setEditForm({ ...editForm, team_name: e.target.value })} className="w-32" /></TableCell>
                <TableCell><Input value={editForm.custom_title} onChange={(e) => setEditForm({ ...editForm, custom_title: e.target.value })} className="w-32" placeholder="أسطورة..." /></TableCell>
                <TableCell>
                  <select value={roles[p.user_id] ?? "user"} onChange={(e) => changeRole(p.user_id, e.target.value)} className="bg-background border border-border rounded px-2 py-1 text-sm">
                    <option value="user">عضو</option><option value="moderator">مشرف</option><option value="admin">أدمن</option>
                  </select>
                </TableCell>
                <TableCell><Textarea value={editForm.dev_notes} onChange={(e) => setEditForm({ ...editForm, dev_notes: e.target.value })} rows={1} className="min-w-48" /></TableCell>
                <TableCell><div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={saveEdit}><Save className="w-4 h-4 text-green-500" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}><X className="w-4 h-4" /></Button>
                </div></TableCell>
              </TableRow>
            ) : (
              <TableRow key={p.user_id}>
                <TableCell>{p.avatar_url ? <img src={p.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" /> : <span className="text-muted-foreground text-xs">—</span>}</TableCell>
                <TableCell className="font-bold">{p.display_name}{p.custom_title && <span className="block text-[10px] text-accent">{p.custom_title}</span>}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{p.username ?? "—"}</TableCell>
                <TableCell className="text-xs">{p.discord_username ?? "—"}</TableCell>
                <TableCell className="text-xs">{p.favorite_game ?? "—"}</TableCell>
                <TableCell>{p.level}</TableCell>
                <TableCell>{p.xp ?? 0}</TableCell>
                <TableCell>{p.points}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => quickWinBump(p.user_id, -1)}>−</Button>
                    <span className="font-bold tabular-nums w-6 text-center">{p.tournaments_won ?? 0}</span>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => quickWinBump(p.user_id, 1)}>+</Button>
                  </div>
                </TableCell>
                <TableCell className="tabular-nums">{p.tournaments_played ?? 0}</TableCell>
                <TableCell className="tabular-nums">{p.best_rank ?? "—"}</TableCell>
                <TableCell className="text-xs">{p.team_name ?? "—"}</TableCell>
                <TableCell className="text-xs">{p.custom_title ?? "—"}</TableCell>
                <TableCell>
                  <select value={roles[p.user_id] ?? "user"} onChange={(e) => changeRole(p.user_id, e.target.value)} className="bg-background border border-border rounded px-2 py-1 text-sm">
                    <option value="user">عضو</option><option value="moderator">مشرف</option><option value="admin">أدمن</option>
                  </select>
                </TableCell>
                <TableCell className="text-xs max-w-xs truncate">{p.dev_notes ?? "—"}</TableCell>
                <TableCell><Button size="icon" variant="ghost" onClick={() => startEdit(p)}><Pencil className="w-4 h-4" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableShell>
    </div>
  );
}
