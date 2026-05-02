import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Crown, Swords, Star, Percent } from "lucide-react";

export type Stats = {
  tournaments_count: number;
  tournaments_won: number;
  matches_played: number;
  matches_won: number;
  mvp_count: number;
  win_rate: number;
};

const ZERO: Stats = {
  tournaments_count: 0,
  tournaments_won: 0,
  matches_played: 0,
  matches_won: 0,
  mvp_count: 0,
  win_rate: 0,
};

export function TournamentStats({ userId }: { userId: string }) {
  const [stats, setStats] = useState<Stats>(ZERO);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    (async () => {
      const { data } = await (supabase as any)
        .from("user_tournament_stats")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (!live) return;
      setStats((data as Stats) ?? ZERO);
      setLoading(false);
    })();
    return () => {
      live = false;
    };
  }, [userId]);

  const items = [
    { icon: Trophy, label: "بطولات", value: stats.tournaments_count, color: "text-accent" },
    { icon: Crown, label: "بطولات فاز بها", value: stats.tournaments_won, color: "text-yellow-400" },
    { icon: Swords, label: "مباريات", value: stats.matches_played, color: "text-accent" },
    { icon: Star, label: "MVP", value: stats.mvp_count, color: "text-purple-400" },
    { icon: Percent, label: "نسبة الفوز", value: `${stats.win_rate}%`, color: "text-emerald-400" },
  ];

  return (
    <div className="rounded-2xl bg-card border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-black text-lg">📊 إحصائيات البطولات</h3>
        {loading && <span className="text-xs text-muted-foreground">...</span>}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {items.map((it) => (
          <div key={it.label} className="rounded-xl bg-background/40 p-3 text-center border border-border/50">
            <it.icon className={`w-5 h-5 mx-auto mb-1 ${it.color}`} />
            <div className={`text-2xl font-black tabular-nums ${it.color}`}>{it.value}</div>
            <div className="text-[11px] text-muted-foreground">{it.label}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 text-xs text-muted-foreground text-center">
        فاز في {stats.matches_won} من {stats.matches_played} مباراة
      </div>
    </div>
  );
}

// ===== Recent Matches =====
type MatchRow = {
  id: string;
  tournament_id: string;
  round: string | null;
  scheduled_at: string | null;
  status: string;
  winner_side: string | null;
  score_a: number | null;
  score_b: number | null;
  side_a_team_id: string | null;
  side_b_team_id: string | null;
  side_a_user_id: string | null;
  side_b_user_id: string | null;
};

type Participant = {
  match_id: string;
  user_id: string;
  team_id: string | null;
  side: "a" | "b";
  is_mvp: boolean;
};

export function RecentMatches({ userId, limit = 5 }: { userId: string; limit?: number }) {
  const [rows, setRows] = useState<MatchRow[]>([]);
  const [parts, setParts] = useState<Participant[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, { display_name: string; avatar_url: string | null }>>({});
  const [teamsMap, setTeamsMap] = useState<Record<string, { name: string }>>({});
  const [tournamentsMap, setTournamentsMap] = useState<Record<string, { title: string; game: string }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    (async () => {
      // 1) which matches did this user participate in
      const { data: myParts } = await (supabase as any)
        .from("match_participants")
        .select("match_id, side")
        .eq("user_id", userId);
      const matchIds = (myParts ?? []).map((p: any) => p.match_id);
      if (matchIds.length === 0) {
        if (live) {
          setRows([]);
          setLoading(false);
        }
        return;
      }
      // 2) fetch those matches (latest first)
      const { data: matches } = await (supabase as any)
        .from("tournament_matches")
        .select("*")
        .in("id", matchIds)
        .order("scheduled_at", { ascending: false, nullsFirst: false })
        .limit(limit);
      const ms = (matches as MatchRow[]) ?? [];
      // 3) fetch all participants for these matches (for opponent/teammate avatars)
      const { data: allParts } = await (supabase as any)
        .from("match_participants")
        .select("*")
        .in("match_id", ms.map((m) => m.id));
      const allP = (allParts as Participant[]) ?? [];

      const userIds = Array.from(new Set(allP.map((p) => p.user_id)));
      const teamIds = Array.from(
        new Set(
          ms.flatMap((m) => [m.side_a_team_id, m.side_b_team_id]).filter(Boolean) as string[],
        ),
      );
      const tIds = Array.from(new Set(ms.map((m) => m.tournament_id)));

      const [{ data: profs }, { data: teams }, { data: tours }] = await Promise.all([
        userIds.length
          ? supabase.from("profiles").select("user_id, display_name, avatar_url").in("user_id", userIds)
          : Promise.resolve({ data: [] as any[] }),
        teamIds.length
          ? (supabase as any).from("tournament_teams").select("id, name").in("id", teamIds)
          : Promise.resolve({ data: [] as any[] }),
        tIds.length
          ? supabase.from("tournaments").select("id, title, game").in("id", tIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);

      const pm: Record<string, any> = {};
      (profs ?? []).forEach((p: any) => (pm[p.user_id] = p));
      const tm: Record<string, any> = {};
      (teams ?? []).forEach((t: any) => (tm[t.id] = t));
      const trm: Record<string, any> = {};
      (tours ?? []).forEach((t: any) => (trm[t.id] = t));

      if (!live) return;
      setRows(ms);
      setParts(allP);
      setProfilesMap(pm);
      setTeamsMap(tm);
      setTournamentsMap(trm);
      setLoading(false);
    })();
    return () => {
      live = false;
    };
  }, [userId, limit]);

  if (loading) return <div className="text-sm text-muted-foreground p-5">جارٍ تحميل المباريات...</div>;
  if (rows.length === 0)
    return (
      <div className="rounded-2xl bg-card border border-border p-5 text-sm text-muted-foreground text-center">
        لا توجد مباريات بعد.
      </div>
    );

  return (
    <div className="rounded-2xl bg-card border border-border p-5 space-y-3">
      <h3 className="font-black text-lg mb-1">🎯 آخر المباريات</h3>
      {rows.map((m) => {
        const me = parts.find((p) => p.match_id === m.id && p.user_id === userId);
        if (!me) return null;
        const mySide = me.side;
        const oppSide = mySide === "a" ? "b" : "a";

        // mates = same side, not me. opponents = other side.
        const mates = parts.filter((p) => p.match_id === m.id && p.side === mySide && p.user_id !== userId);
        const opps = parts.filter((p) => p.match_id === m.id && p.side === oppSide);

        const myScore = mySide === "a" ? m.score_a : m.score_b;
        const oppScore = mySide === "a" ? m.score_b : m.score_a;

        let result: "win" | "loss" | "draw" | "pending" = "pending";
        if (m.status === "completed") {
          if (m.winner_side === mySide) result = "win";
          else if (m.winner_side === "draw") result = "draw";
          else if (m.winner_side) result = "loss";
        }

        const t = tournamentsMap[m.tournament_id];
        const myTeamId = mySide === "a" ? m.side_a_team_id : m.side_b_team_id;
        const oppTeamId = oppSide === "a" ? m.side_a_team_id : m.side_b_team_id;

        return (
          <div key={m.id} className="rounded-xl bg-background/40 border border-border/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-muted-foreground">
                {t ? `${t.title} • ${t.game}` : "مباراة"}
                {m.round ? ` • ${m.round}` : ""}
              </div>
              <ResultBadge result={result} status={m.status} />
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              {/* MY SIDE */}
              <SideBlock
                label={myTeamId ? teamsMap[myTeamId]?.name ?? "فريقي" : "أنا"}
                players={[
                  { user_id: userId, is_mvp: me.is_mvp, isMe: true },
                  ...mates.map((p) => ({ user_id: p.user_id, is_mvp: p.is_mvp, isMe: false })),
                ]}
                profiles={profilesMap}
                align="right"
              />

              {/* SCORE */}
              <div className="text-center px-2">
                <div className="text-2xl font-black tabular-nums">
                  <span className={result === "win" ? "text-emerald-400" : result === "loss" ? "text-red-400" : ""}>
                    {myScore ?? "-"}
                  </span>
                  <span className="text-muted-foreground mx-1">:</span>
                  <span className={result === "loss" ? "text-emerald-400" : result === "win" ? "text-red-400" : ""}>
                    {oppScore ?? "-"}
                  </span>
                </div>
                {m.scheduled_at && (
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {new Date(m.scheduled_at).toLocaleDateString("ar")}
                  </div>
                )}
              </div>

              {/* OPP SIDE */}
              <SideBlock
                label={oppTeamId ? teamsMap[oppTeamId]?.name ?? "الخصم" : "الخصم"}
                players={opps.map((p) => ({ user_id: p.user_id, is_mvp: p.is_mvp, isMe: false }))}
                profiles={profilesMap}
                align="left"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ResultBadge({
  result,
  status,
}: {
  result: "win" | "loss" | "draw" | "pending";
  status: string;
}) {
  if (status !== "completed") {
    const map: Record<string, { t: string; c: string }> = {
      scheduled: { t: "قادمة", c: "bg-blue-500/20 text-blue-300" },
      live: { t: "مباشر", c: "bg-red-500/20 text-red-300 animate-pulse" },
      cancelled: { t: "ملغية", c: "bg-muted text-muted-foreground" },
    };
    const v = map[status] ?? { t: status, c: "bg-muted" };
    return <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${v.c}`}>{v.t}</span>;
  }
  const map: Record<string, { t: string; c: string }> = {
    win: { t: "فوز", c: "bg-emerald-500/20 text-emerald-300" },
    loss: { t: "خسارة", c: "bg-red-500/20 text-red-300" },
    draw: { t: "تعادل", c: "bg-muted text-muted-foreground" },
    pending: { t: "—", c: "bg-muted" },
  };
  const v = map[result];
  return <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${v.c}`}>{v.t}</span>;
}

function SideBlock({
  label,
  players,
  profiles,
  align,
}: {
  label: string;
  players: { user_id: string; is_mvp: boolean; isMe: boolean }[];
  profiles: Record<string, { display_name: string; avatar_url: string | null }>;
  align: "right" | "left";
}) {
  return (
    <div className={`flex flex-col gap-1 ${align === "left" ? "items-end" : "items-start"}`}>
      <div className="text-xs font-bold text-muted-foreground truncate max-w-full">{label}</div>
      <div className={`flex -space-x-2 -space-x-reverse ${align === "left" ? "flex-row-reverse space-x-reverse" : ""}`}>
        {players.slice(0, 5).map((p) => {
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
                <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[8px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                  ★
                </span>
              )}
            </Link>
          );
        })}
        {players.length > 5 && (
          <div className="h-9 w-9 rounded-full bg-muted text-[10px] flex items-center justify-center ring-2 ring-card">
            +{players.length - 5}
          </div>
        )}
      </div>
    </div>
  );
}
