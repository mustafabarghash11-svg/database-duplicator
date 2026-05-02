import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Swords } from "lucide-react";

type MatchRow = {
  id: string;
  round: string | null;
  match_order: number | null;
  scheduled_at: string | null;
  side_a_team_id: string | null;
  side_b_team_id: string | null;
  score_a: number | null;
  score_b: number | null;
  status: string;
  winner_side: string | null;
};
type Part = { match_id: string; user_id: string; side: "a" | "b"; is_mvp: boolean };

export function TournamentMatchesDialog({ tournamentId, tournamentTitle }: { tournamentId: string; tournamentTitle: string }) {
  const [open, setOpen] = useState(false);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { display_name: string; avatar_url: string | null }>>({});
  const [teams, setTeams] = useState<Record<string, { name: string }>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let live = true;
    (async () => {
      setLoading(true);
      const { data: ms } = await (supabase as any)
        .from("tournament_matches")
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("match_order", { ascending: true });
      const matchList = (ms as MatchRow[]) ?? [];
      const ids = matchList.map((m) => m.id);
      const { data: ps } = ids.length
        ? await (supabase as any).from("match_participants").select("match_id, user_id, side, is_mvp").in("match_id", ids)
        : { data: [] as Part[] };
      const userIds = Array.from(new Set((ps ?? []).map((p: any) => p.user_id))) as string[];
      const teamIds = Array.from(
        new Set(matchList.flatMap((m) => [m.side_a_team_id, m.side_b_team_id]).filter(Boolean) as string[]),
      ) as string[];
      const [{ data: profs }, { data: tms }] = await Promise.all([
        userIds.length
          ? supabase.from("profiles").select("user_id, display_name, avatar_url").in("user_id", userIds)
          : Promise.resolve({ data: [] as any[] }),
        teamIds.length
          ? (supabase as any).from("tournament_teams").select("id, name").in("id", teamIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);
      const pm: Record<string, any> = {};
      (profs ?? []).forEach((p: any) => (pm[p.user_id] = p));
      const tm: Record<string, any> = {};
      (tms ?? []).forEach((t: any) => (tm[t.id] = t));
      if (!live) return;
      setMatches(matchList);
      setParts((ps as Part[]) ?? []);
      setProfiles(pm);
      setTeams(tm);
      setLoading(false);
    })();
    return () => { live = false; };
  }, [open, tournamentId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="mt-2 w-full">
          <Swords className="w-4 h-4 ml-1" /> المباريات
        </Button>
      </DialogTrigger>
      <DialogContent dir="rtl" className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>مباريات: {tournamentTitle}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <p className="text-muted-foreground text-center py-6">جارٍ التحميل...</p>
        ) : matches.length === 0 ? (
          <p className="text-muted-foreground text-center py-6">لا مباريات بعد.</p>
        ) : (
          <div className="space-y-3">
            {matches.map((m) => (
              <MatchRowView key={m.id} m={m} parts={parts} profiles={profiles} teams={teams} />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function MatchRowView({
  m, parts, profiles, teams,
}: {
  m: MatchRow;
  parts: Part[];
  profiles: Record<string, { display_name: string; avatar_url: string | null }>;
  teams: Record<string, { name: string }>;
}) {
  const a = parts.filter((p) => p.match_id === m.id && p.side === "a");
  const b = parts.filter((p) => p.match_id === m.id && p.side === "b");
  const labelA = m.side_a_team_id ? teams[m.side_a_team_id]?.name ?? "فريق A" : a.length === 1 ? profiles[a[0].user_id]?.display_name ?? "لاعب A" : "الطرف A";
  const labelB = m.side_b_team_id ? teams[m.side_b_team_id]?.name ?? "فريق B" : b.length === 1 ? profiles[b[0].user_id]?.display_name ?? "لاعب B" : "الطرف B";

  const winA = m.status === "completed" && m.winner_side === "a";
  const winB = m.status === "completed" && m.winner_side === "b";

  return (
    <div className="rounded-xl border border-border/60 bg-background/40 p-4">
      <div className="flex items-center justify-between mb-3 text-xs text-muted-foreground">
        <span>{m.round ?? `مباراة ${m.match_order ?? ""}`}</span>
        <StatusPill s={m.status} />
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
        <PlayerStack players={a} profiles={profiles} label={labelA} highlight={winA} align="right" />
        <div className="text-center px-2">
          <div className="text-2xl font-black tabular-nums">
            <span className={winA ? "text-emerald-400" : ""}>{m.score_a ?? "-"}</span>
            <span className="text-muted-foreground mx-1">:</span>
            <span className={winB ? "text-emerald-400" : ""}>{m.score_b ?? "-"}</span>
          </div>
          {m.scheduled_at && (
            <div className="text-[10px] text-muted-foreground mt-1">
              {new Date(m.scheduled_at).toLocaleString("ar")}
            </div>
          )}
        </div>
        <PlayerStack players={b} profiles={profiles} label={labelB} highlight={winB} align="left" />
      </div>
    </div>
  );
}

function StatusPill({ s }: { s: string }) {
  const map: Record<string, { t: string; c: string }> = {
    scheduled: { t: "قادمة", c: "bg-blue-500/20 text-blue-300" },
    live: { t: "مباشر", c: "bg-red-500/20 text-red-300 animate-pulse" },
    completed: { t: "منتهية", c: "bg-emerald-500/20 text-emerald-300" },
    cancelled: { t: "ملغية", c: "bg-muted text-muted-foreground" },
  };
  const v = map[s] ?? { t: s, c: "bg-muted" };
  return <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${v.c}`}>{v.t}</span>;
}

function PlayerStack({
  players, profiles, label, highlight, align,
}: {
  players: Part[];
  profiles: Record<string, { display_name: string; avatar_url: string | null }>;
  label: string;
  highlight: boolean;
  align: "right" | "left";
}) {
  return (
    <div className={`flex flex-col gap-1 min-w-0 ${align === "left" ? "items-end" : "items-start"}`}>
      <div className={`text-xs font-bold truncate max-w-full ${highlight ? "text-emerald-400" : ""}`}>{label}</div>
      <div className={`flex -space-x-2 -space-x-reverse ${align === "left" ? "flex-row-reverse space-x-reverse" : ""}`}>
        {players.slice(0, 6).map((p) => {
          const prof = profiles[p.user_id];
          const name = prof?.display_name ?? "لاعب";
          return (
            <Link
              key={p.user_id}
              to="/u/$userId"
              params={{ userId: p.user_id }}
              title={`${name}${p.is_mvp ? " ⭐ MVP" : ""}`}
              className="relative h-9 w-9 rounded-full overflow-hidden bg-muted ring-2 ring-card hover:ring-accent transition shrink-0"
            >
              {prof?.avatar_url ? (
                <img src={prof.avatar_url} alt={name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm">👤</div>
              )}
              {p.is_mvp && (
                <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[8px] font-black rounded-full w-4 h-4 flex items-center justify-center">★</span>
              )}
            </Link>
          );
        })}
        {players.length > 6 && (
          <div className="h-9 w-9 rounded-full bg-muted text-[10px] flex items-center justify-center ring-2 ring-card">
            +{players.length - 6}
          </div>
        )}
      </div>
    </div>
  );
}
