import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { SideNav } from "@/components/SideNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KhayalLogo } from "@/components/KhayalLogo";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — Khayal Community" },
      { name: "description", content: "سجّل دخول أو أنشئ حسابك في مجتمع الخيال." },
    ],
  }),
  component: AuthPage,
});

const signupSchema = z.object({
  email: z.string().trim().email("بريد غير صحيح").max(255),
  password: z.string().min(8, "كلمة السر 8 أحرف على الأقل").max(72),
  displayName: z.string().trim().min(2, "الاسم قصير").max(40),
  discord: z.string().trim().max(40).optional(),
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [discord, setDiscord] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate({ to: "/account" });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const parsed = signupSchema.safeParse({ email, password, displayName, discord });
        if (!parsed.success) {
          setErr(parsed.error.issues[0].message);
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/account`,
            data: {
              display_name: parsed.data.displayName,
              discord_username: parsed.data.discord || null,
            },
          },
        });
        if (error) {
          setErr(error.message.includes("registered") ? "هذا الإيميل مسجل مسبقاً" : error.message);
          setLoading(false);
          return;
        }
        navigate({ to: "/account" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setErr("الإيميل أو كلمة السر خطأ");
          setLoading(false);
          return;
        }
        navigate({ to: "/account" });
      }
    } catch (e: any) {
      setErr(e.message || "خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground flex items-center justify-center px-6 py-20">
      <SideNav />
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center mb-6">
          <KhayalLogo className="h-20 w-20" />
        </Link>
        <div className="rounded-2xl bg-card border border-border p-8 shadow-2xl">
          <div className="flex gap-2 mb-6 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-2 rounded-md text-sm font-bold transition ${mode === "login" ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}
            >
              تسجيل دخول
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 rounded-md text-sm font-bold transition ${mode === "signup" ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}
            >
              إنشاء حساب
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div>
                  <Label htmlFor="dn">اسم العرض</Label>
                  <Input id="dn" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="مثلاً: Khayal_Pro" required />
                </div>
                <div>
                  <Label htmlFor="dc">يوزر الديسكورد (اختياري)</Label>
                  <Input id="dc" value={discord} onChange={(e) => setDiscord(e.target.value)} placeholder="username" />
                </div>
              </>
            )}
            <div>
              <Label htmlFor="em">الإيميل</Label>
              <Input id="em" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="pw">كلمة السر</Label>
              <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            </div>

            {err && <div className="text-sm text-red-500 bg-red-500/10 p-3 rounded-lg">{err}</div>}

            <Button type="submit" disabled={loading} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold">
              {loading ? "..." : mode === "login" ? "دخول" : "إنشاء الحساب"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
