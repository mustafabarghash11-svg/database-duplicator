import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const DiscordIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
    <path d="M20.317 4.369A19.79 19.79 0 0 0 16.558 3a13.7 13.7 0 0 0-.617 1.265 18.524 18.524 0 0 0-5.882 0A12.78 12.78 0 0 0 9.44 3a19.736 19.736 0 0 0-3.762 1.369C2.04 9.89.987 15.27 1.514 20.566a19.93 19.93 0 0 0 6.073 3.058c.49-.66.927-1.36 1.302-2.094a12.86 12.86 0 0 1-2.05-.984c.172-.126.34-.257.502-.39a14.193 14.193 0 0 0 12.317 0c.164.137.332.268.504.39-.654.39-1.343.72-2.052.985.376.733.812 1.434 1.303 2.093a19.9 19.9 0 0 0 6.075-3.057c.617-6.142-1.05-11.474-4.171-16.198ZM8.68 17.36c-1.183 0-2.157-1.085-2.157-2.42 0-1.334.955-2.42 2.157-2.42 1.21 0 2.176 1.094 2.157 2.42 0 1.335-.955 2.42-2.157 2.42Zm6.64 0c-1.183 0-2.157-1.085-2.157-2.42 0-1.334.955-2.42 2.157-2.42 1.21 0 2.176 1.094 2.157 2.42 0 1.335-.946 2.42-2.157 2.42Z" />
  </svg>
);

const Login = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    document.title = "تسجيل الدخول";
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/account", { replace: true });
      else setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s) navigate("/account", { replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const loginWithDiscord = () => {
    const origin = encodeURIComponent(`${window.location.origin}/account`);
    window.location.href = `${SUPABASE_URL}/functions/v1/discord-callback?action=login&origin=${origin}`;
  };

  if (checking) return null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md p-8 text-center space-y-6 shadow-lg">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">تسجيل الدخول</h1>
          <p className="text-muted-foreground">استخدم حساب Discord للمتابعة</p>
        </div>
        <Button
          onClick={loginWithDiscord}
          className="w-full gap-2 bg-[#5865F2] text-white hover:bg-[#4752c4]"
          size="lg"
        >
          <DiscordIcon />
          تسجيل الدخول عبر Discord
        </Button>
      </Card>
    </main>
  );
};

export default Login;
  
