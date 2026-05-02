-- 1) match status enum
DO $$ BEGIN
  CREATE TYPE public.match_status AS ENUM ('scheduled', 'live', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) matches table
CREATE TABLE IF NOT EXISTS public.tournament_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  round text,
  match_order integer DEFAULT 0,
  scheduled_at timestamptz,

  side_a_team_id uuid REFERENCES public.tournament_teams(id) ON DELETE SET NULL,
  side_b_team_id uuid REFERENCES public.tournament_teams(id) ON DELETE SET NULL,
  side_a_user_id uuid,
  side_b_user_id uuid,

  score_a integer,
  score_b integer,

  status public.match_status NOT NULL DEFAULT 'scheduled',
  winner_side text,
  notes text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_matches_tournament ON public.tournament_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_team_a ON public.tournament_matches(side_a_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_team_b ON public.tournament_matches(side_b_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_user_a ON public.tournament_matches(side_a_user_id);
CREATE INDEX IF NOT EXISTS idx_matches_user_b ON public.tournament_matches(side_b_user_id);

ALTER TABLE public.tournament_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Matches viewable by everyone" ON public.tournament_matches;
CREATE POLICY "Matches viewable by everyone"
  ON public.tournament_matches FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins/mods manage matches" ON public.tournament_matches;
CREATE POLICY "Admins/mods manage matches"
  ON public.tournament_matches FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

DROP TRIGGER IF EXISTS update_tournament_matches_updated_at ON public.tournament_matches;
CREATE TRIGGER update_tournament_matches_updated_at
  BEFORE UPDATE ON public.tournament_matches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) match_participants
CREATE TABLE IF NOT EXISTS public.match_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.tournament_matches(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  team_id uuid REFERENCES public.tournament_teams(id) ON DELETE SET NULL,
  side text NOT NULL CHECK (side IN ('a','b')),
  is_mvp boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (match_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_mp_user ON public.match_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_mp_match ON public.match_participants(match_id);

ALTER TABLE public.match_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Match participants viewable by everyone" ON public.match_participants;
CREATE POLICY "Match participants viewable by everyone"
  ON public.match_participants FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins/mods manage match participants" ON public.match_participants;
CREATE POLICY "Admins/mods manage match participants"
  ON public.match_participants FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- 4) View: per-user tournament stats (security_invoker so RLS of base tables applies)
CREATE OR REPLACE VIEW public.user_tournament_stats
WITH (security_invoker = on) AS
WITH played AS (
  SELECT
    mp.user_id,
    m.id AS match_id,
    m.tournament_id,
    m.status,
    m.winner_side,
    m.match_order,
    mp.side,
    mp.is_mvp,
    CASE
      WHEN m.status = 'completed' AND m.winner_side IS NOT NULL AND m.winner_side = mp.side THEN 1
      ELSE 0
    END AS won
  FROM public.match_participants mp
  JOIN public.tournament_matches m ON m.id = mp.match_id
),
tournaments_played AS (
  SELECT user_id, COUNT(DISTINCT tournament_id) AS tournaments_count
  FROM played GROUP BY user_id
),
tournaments_won AS (
  SELECT p.user_id, COUNT(DISTINCT p.tournament_id) AS tournaments_won
  FROM played p
  WHERE p.won = 1
    AND p.match_order = (
      SELECT MAX(m2.match_order)
      FROM public.tournament_matches m2
      WHERE m2.tournament_id = p.tournament_id AND m2.status = 'completed'
    )
  GROUP BY p.user_id
),
match_stats AS (
  SELECT
    user_id,
    COUNT(*) FILTER (WHERE status = 'completed') AS matches_played,
    SUM(won) AS matches_won,
    SUM(CASE WHEN is_mvp THEN 1 ELSE 0 END) AS mvp_count
  FROM played GROUP BY user_id
)
SELECT
  COALESCE(tp.user_id, ms.user_id, tw.user_id) AS user_id,
  COALESCE(tp.tournaments_count, 0) AS tournaments_count,
  COALESCE(tw.tournaments_won, 0) AS tournaments_won,
  COALESCE(ms.matches_played, 0) AS matches_played,
  COALESCE(ms.matches_won, 0) AS matches_won,
  COALESCE(ms.mvp_count, 0) AS mvp_count,
  CASE
    WHEN COALESCE(ms.matches_played, 0) = 0 THEN 0
    ELSE ROUND(COALESCE(ms.matches_won, 0)::numeric * 100 / ms.matches_played, 1)
  END AS win_rate
FROM tournaments_played tp
FULL OUTER JOIN match_stats ms ON ms.user_id = tp.user_id
FULL OUTER JOIN tournaments_won tw ON tw.user_id = COALESCE(tp.user_id, ms.user_id);

GRANT SELECT ON public.user_tournament_stats TO anon, authenticated;