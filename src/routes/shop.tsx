import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SideNav } from "@/components/SideNav";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Coins, Package } from "lucide-react";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "متجر النقاط — Khayal Community" },
      { name: "description", content: "استبدل نقاطك بجوائز حصرية." },
    ],
  }),
  component: ShopPage,
});

type Item = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price_points: number;
  stock: number;
  is_active: boolean;
};

type Order = {
  id: string;
  item_id: string;
  points_spent: number;
  status: string;
  created_at: string;
  shop_items?: { name: string };
};

function ShopPage() {
  const { user, profile, refresh } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("shop_items").select("*").eq("is_active", true).order("price_points");
    setItems((data as Item[]) ?? []);
    if (user) {
      const { data: o } = await supabase
        .from("shop_orders")
        .select("id, item_id, points_spent, status, created_at, shop_items(name)")
        .order("created_at", { ascending: false });
      setOrders((o as any[]) ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [user?.id]);

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <SideNav />
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="flex items-center justify-between mb-12 flex-wrap gap-4">
          <div>
            <p className="text-accent font-bold tracking-widest text-sm mb-3">// SHOP</p>
            <h1 className="text-4xl md:text-6xl font-black">متجر النقاط</h1>
            <p className="text-muted-foreground mt-3">استبدل نقاطك بجوائز حصرية</p>
          </div>
          {profile && (
            <div className="rounded-2xl bg-gradient-to-br from-accent/20 to-card border border-accent/30 px-5 py-3 flex items-center gap-3">
              <Coins className="w-6 h-6 text-accent" />
              <div>
                <div className="text-2xl font-black text-accent tabular-nums">{profile.points}</div>
                <div className="text-xs text-muted-foreground">رصيدك</div>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground">جارٍ التحميل...</p>
        ) : items.length === 0 ? (
          <div className="text-center text-muted-foreground py-20">لا توجد منتجات حالياً.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((it) => (
              <ItemCard key={it.id} item={it} userLoggedIn={!!user} balance={profile?.points ?? 0} onChange={() => { load(); refresh(); }} />
            ))}
          </div>
        )}

        {user && orders.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-black mb-5 flex items-center gap-2"><Package className="w-6 h-6 text-accent" /> طلباتي</h2>
            <div className="space-y-3">
              {orders.map((o) => (
                <div key={o.id} className="rounded-xl bg-card border border-border p-4 flex items-center justify-between">
                  <div>
                    <div className="font-bold">{o.shop_items?.name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("ar")} · {o.points_spent} نقطة</div>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: "قيد المعالجة", cls: "bg-yellow-500/20 text-yellow-400" },
    fulfilled: { label: "تم التسليم", cls: "bg-green-500/20 text-green-400" },
    cancelled: { label: "ملغي", cls: "bg-red-500/20 text-red-400" },
  };
  const s = map[status] ?? map.pending;
  return <span className={`text-xs font-bold px-3 py-1 rounded-full ${s.cls}`}>{s.label}</span>;
}

function ItemCard({ item, userLoggedIn, balance, onChange }: {
  item: Item; userLoggedIn: boolean; balance: number; onChange: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const canAfford = balance >= item.price_points;
  const inStock = item.stock !== 0;

  async function redeem() {
    setBusy(true); setErr(null);
    const { error } = await supabase.rpc("redeem_shop_item", { _item_id: item.id, _user_notes: notes.trim().slice(0, 280) || "" });
    setBusy(false);
    if (error) setErr(error.message);
    else { setOpen(false); setNotes(""); onChange(); }
  }

  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden hover:border-accent transition-all flex flex-col">
      <div className="aspect-video bg-muted">
        {item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" /> :
          <div className="w-full h-full flex items-center justify-center text-5xl">🎁</div>}
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-black text-lg mb-1">{item.name}</h3>
        {item.description && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{item.description}</p>}
        <div className="flex items-center justify-between mt-auto mb-3">
          <div className="flex items-center gap-1 text-accent font-black text-xl">
            <Coins className="w-5 h-5" />{item.price_points}
          </div>
          {item.stock > 0 && <span className="text-xs text-muted-foreground">متوفر: {item.stock}</span>}
          {item.stock === 0 && <span className="text-xs text-red-500">نفدت الكمية</span>}
        </div>

        {!userLoggedIn ? (
          <Button asChild variant="outline"><Link to="/auth">سجل دخول</Link></Button>
        ) : !inStock ? (
          <Button disabled>غير متوفر</Button>
        ) : (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button disabled={!canAfford} className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold">
                {canAfford ? "استبدال" : `تحتاج ${item.price_points - balance} نقطة`}
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
              <DialogHeader><DialogTitle>استبدال {item.name}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">سيتم خصم <b>{item.price_points}</b> نقطة من رصيدك. الإدارة ستتواصل معك لتسليم الجائزة.</p>
                <div>
                  <Label>ملاحظات للإدارة (اختياري)</Label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={280} rows={3} placeholder="مثلاً: ID الديسكورد أو تفاصيل التواصل" />
                </div>
                {err && <p className="text-sm text-red-500">{err}</p>}
                <Button onClick={redeem} disabled={busy} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold">
                  {busy ? "..." : "تأكيد الاستبدال"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
