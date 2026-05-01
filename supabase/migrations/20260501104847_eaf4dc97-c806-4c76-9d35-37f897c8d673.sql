-- Add stats fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tournaments_won integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tournaments_played integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS best_rank integer,
  ADD COLUMN IF NOT EXISTS team_name text,
  ADD COLUMN IF NOT EXISTS custom_title text,
  ADD COLUMN IF NOT EXISTS dev_notes text,
  ADD COLUMN IF NOT EXISTS username text;

-- Unique username (case-insensitive) for public profile URLs
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_idx
  ON public.profiles (lower(username))
  WHERE username IS NOT NULL;

-- Allow admins/mods to update any profile (for editing stats from /devk)
DROP POLICY IF EXISTS "Admins/mods can update any profile" ON public.profiles;
CREATE POLICY "Admins/mods can update any profile"
  ON public.profiles
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- Auto-increment tournaments_played when a registration is approved
CREATE OR REPLACE FUNCTION public.bump_tournaments_played()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    UPDATE public.profiles
      SET tournaments_played = tournaments_played + 1
      WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bump_tournaments_played ON public.tournament_registrations;
CREATE TRIGGER trg_bump_tournaments_played
  AFTER UPDATE OF status ON public.tournament_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.bump_tournaments_played();

-- Also bump on insert if registered directly as approved
CREATE OR REPLACE FUNCTION public.bump_tournaments_played_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' THEN
    UPDATE public.profiles
      SET tournaments_played = tournaments_played + 1
      WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bump_tournaments_played_ins ON public.tournament_registrations;
CREATE TRIGGER trg_bump_tournaments_played_ins
  AFTER INSERT ON public.tournament_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.bump_tournaments_played_insert();

-- Admin helper: increment win counter atomically
CREATE OR REPLACE FUNCTION public.admin_increment_wins(_user_id uuid, _delta integer DEFAULT 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator')) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE public.profiles
    SET tournaments_won = GREATEST(0, tournaments_won + _delta)
    WHERE user_id = _user_id;
END;
$$;