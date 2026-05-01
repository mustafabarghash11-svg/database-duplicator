import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  discord_username: string | null;
  favorite_game: string | null;
  bio: string | null;
  points: number;
  xp: number;
  level: number;
};

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setTimeout(() => loadProfile(s.user.id), 0);
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) loadProfile(s.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function loadProfile(userId: string) {
    const { data: p } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    setProfile(p as Profile | null);

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    setIsAdmin(true);
  }

  async function refresh() {
    if (user) await loadProfile(user.id);
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return { session, user, profile, isAdmin, loading, refresh, signOut };
}

export function xpForNextLevel(level: number) {
  return level * 100;
}
export function xpProgress(xp: number, level: number) {
  const base = (level - 1) * 100;
  const need = 100;
  const into = Math.max(0, xp - base);
  return Math.min(100, Math.round((into / need) * 100));
}
