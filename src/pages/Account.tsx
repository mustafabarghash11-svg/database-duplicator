import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Session } from "@supabase/supabase-js";

type Profile = {
  username: string | null;
  avatar_url: string | null;
  email: string | null;
  discord_id: string | null;
  created_at: string;
};

const Account = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "حسابي";
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (!s) navigate("/login", { replace: true });
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) navigate("/login", { replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!session?.user) return;
    setLoading(true);
    supabase
      .from("profiles")
      .select("username, avatar_url, email, discord_id, created_at")
      .eq("user_id", session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        setProfile(data);
        setLoading(false);
      });
  }, [session]);

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  if (!session) return null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-lg p-8 space-y-6 shadow-lg">
        <header className="text-center space-y-1">
          <h1 className="text-3xl font-bold">حسابي</h1>
          <p className="text-muted-foreground text-sm">معلومات حسابك المرتبط بـ Discord</p>
        </header>

        {loading ? (
          <p className="text-center text-muted-foreground">جاري التحميل...</p>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-3">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile?.avatar_url ?? undefined} />
                <AvatarFallback>{profile?.username?.[0]?.toUpperCase() ?? "U"}</AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-semibold">{profile?.username ?? "مستخدم"}</h2>
            </div>

            <dl className="divide-y rounded-lg border">
              <Row label="البريد الإلكتروني" value={profile?.email ?? "—"} />
              <Row label="Discord ID" value={profile?.discord_id ?? "—"} />
              <Row
                label="تاريخ الانضمام"
                value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString("ar") : "—"}
              />
            </dl>

            <Button variant="outline" className="w-full" onClick={logout}>
              تسجيل الخروج
            </Button>
          </div>
        )}
      </Card>
    </main>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between p-3 text-sm">
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="font-medium">{value}</dd>
  </div>
);

export default Account;
           
