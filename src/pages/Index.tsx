import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Session } from "@supabase/supabase-js";

const Index = () => {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md p-8 text-center space-y-6">
        <h1 className="text-3xl font-bold">مرحباً بك</h1>
        <p className="text-muted-foreground">طبّق تسجيل الدخول عبر Discord</p>
        <Button asChild size="lg" className="w-full">
          <Link to={session ? "/account" : "/login"}>
            {session ? "حسابي" : "تسجيل الدخول"}
          </Link>
        </Button>
      </Card>
    </main>
  );
};

export default Index;
