import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function VisitorCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const SESSION_KEY = "khayal-visit-counted";

    async function load() {
      try {
        if (!sessionStorage.getItem(SESSION_KEY)) {
          sessionStorage.setItem(SESSION_KEY, "1");
          const { data, error } = await supabase.rpc("increment_visitor_count");
          if (!error && !cancelled && typeof data === "number") {
            setCount(data);
            return;
          }
        }
        const { data } = await supabase
          .from("visitor_counter")
          .select("count")
          .eq("id", 1)
          .single();
        if (!cancelled && data) setCount(Number(data.count));
      } catch {
        // silent
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (count === null) return null;

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 backdrop-blur px-4 py-2 text-sm">
      <span className="text-accent">👁️</span>
      <span className="text-muted-foreground">عدد الزوار:</span>
      <span className="font-black text-accent tabular-nums">{count.toLocaleString("en-US")}</span>
    </div>
  );
}
