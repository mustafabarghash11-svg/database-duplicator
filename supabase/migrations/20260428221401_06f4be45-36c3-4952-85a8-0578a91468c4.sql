
-- 1) Status enum for registration approval
DO $$ BEGIN
  CREATE TYPE public.registration_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Add new fields to tournament_registrations
ALTER TABLE public.tournament_registrations
  ADD COLUMN IF NOT EXISTS real_name text,
  ADD COLUMN IF NOT EXISTS age integer,
  ADD COLUMN IF NOT EXISTS discord_username text,
  ADD COLUMN IF NOT EXISTS status public.registration_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS admin_notes text,
  ADD COLUMN IF NOT EXISTS team_id uuid;

-- 3) Restrict users to only see their own registrations (was viewable by everyone)
DROP POLICY IF EXISTS "Registrations viewable by everyone" ON public.tournament_registrations;

CREATE POLICY "Users see own registrations"
  ON public.tournament_registrations FOR SELECT
  USING (auth.uid() = user_id);

-- (Admins/mods ALL policy already exists and covers their visibility.)

-- 4) Teams table
CREATE TABLE IF NOT EXISTS public.tournament_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  name text NOT NULL,
  captain_user_id uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tournament_teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teams viewable by everyone" ON public.tournament_teams;
CREATE POLICY "Teams viewable by everyone"
  ON public.tournament_teams FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins/mods manage teams" ON public.tournament_teams;
CREATE POLICY "Admins/mods manage teams"
  ON public.tournament_teams FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- 5) Trigger to update teams' updated_at
DROP TRIGGER IF EXISTS update_tournament_teams_updated_at ON public.tournament_teams;
CREATE TRIGGER update_tournament_teams_updated_at
  BEFORE UPDATE ON public.tournament_teams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6) FK from registrations to teams (after team table exists)
DO $$ BEGIN
  ALTER TABLE public.tournament_registrations
    ADD CONSTRAINT tournament_registrations_team_id_fkey
    FOREIGN KEY (team_id) REFERENCES public.tournament_teams(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
