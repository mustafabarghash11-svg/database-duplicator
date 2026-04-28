-- ============= ENUMS =============
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.tournament_status AS ENUM ('upcoming', 'open', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.shop_order_status AS ENUM ('pending', 'fulfilled', 'cancelled');

-- ============= UPDATED_AT TRIGGER FUNCTION =============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============= PROFILES =============
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  discord_username TEXT,
  favorite_game TEXT,
  bio TEXT,
  points INTEGER NOT NULL DEFAULT 0,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= USER ROLES =============
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "User roles are viewable by everyone"
  ON public.user_roles FOR SELECT USING (true);
CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============= AUTO-CREATE PROFILE ON SIGNUP =============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, discord_username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'discord_username'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============= TOURNAMENTS =============
CREATE TABLE public.tournaments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  game TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  max_participants INTEGER NOT NULL DEFAULT 16,
  prize TEXT,
  status tournament_status NOT NULL DEFAULT 'upcoming',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tournaments viewable by everyone"
  ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "Admins/mods can manage tournaments"
  ON public.tournaments FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE TRIGGER update_tournaments_updated_at
  BEFORE UPDATE ON public.tournaments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= TOURNAMENT REGISTRATIONS =============
CREATE TABLE public.tournament_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  in_game_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, user_id)
);
ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Registrations viewable by everyone"
  ON public.tournament_registrations FOR SELECT USING (true);
CREATE POLICY "Users can register themselves"
  ON public.tournament_registrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can cancel own registration"
  ON public.tournament_registrations FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins/mods can manage registrations"
  ON public.tournament_registrations FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- ============= SHOP ITEMS =============
CREATE TABLE public.shop_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  price_points INTEGER NOT NULL CHECK (price_points >= 0),
  stock INTEGER NOT NULL DEFAULT -1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active items viewable by everyone"
  ON public.shop_items FOR SELECT USING (true);
CREATE POLICY "Admins/mods manage items"
  ON public.shop_items FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE TRIGGER update_shop_items_updated_at
  BEFORE UPDATE ON public.shop_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= SHOP ORDERS =============
CREATE TABLE public.shop_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.shop_items(id) ON DELETE RESTRICT,
  points_spent INTEGER NOT NULL,
  status shop_order_status NOT NULL DEFAULT 'pending',
  user_notes TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.shop_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own orders"
  ON public.shop_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins/mods see all orders"
  ON public.shop_orders FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));
CREATE POLICY "Users create own orders"
  ON public.shop_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins/mods update orders"
  ON public.shop_orders FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE TRIGGER update_shop_orders_updated_at
  BEFORE UPDATE ON public.shop_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= REDEEM POINTS RPC (atomic) =============
CREATE OR REPLACE FUNCTION public.redeem_shop_item(_item_id UUID, _user_notes TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_price INTEGER;
  v_stock INTEGER;
  v_active BOOLEAN;
  v_balance INTEGER;
  v_order_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Must be logged in';
  END IF;

  SELECT price_points, stock, is_active
    INTO v_price, v_stock, v_active
    FROM public.shop_items WHERE id = _item_id FOR UPDATE;

  IF NOT FOUND OR NOT v_active THEN
    RAISE EXCEPTION 'Item not available';
  END IF;
  IF v_stock = 0 THEN
    RAISE EXCEPTION 'Out of stock';
  END IF;

  SELECT points INTO v_balance FROM public.profiles WHERE user_id = v_user_id FOR UPDATE;
  IF v_balance < v_price THEN
    RAISE EXCEPTION 'Not enough points';
  END IF;

  UPDATE public.profiles SET points = points - v_price WHERE user_id = v_user_id;

  IF v_stock > 0 THEN
    UPDATE public.shop_items SET stock = stock - 1 WHERE id = _item_id;
  END IF;

  INSERT INTO public.shop_orders (user_id, item_id, points_spent, user_notes)
    VALUES (v_user_id, _item_id, v_price, _user_notes)
    RETURNING id INTO v_order_id;

  RETURN v_order_id;
END;
$$;

-- ============= AWARD POINTS ON TOURNAMENT REGISTRATION (XP/level) =============
CREATE OR REPLACE FUNCTION public.award_xp_on_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_xp INTEGER;
  v_new_level INTEGER;
BEGIN
  UPDATE public.profiles
    SET xp = xp + 50,
        points = points + 10
    WHERE user_id = NEW.user_id
    RETURNING xp INTO v_new_xp;

  -- level = floor(xp / 100) + 1
  v_new_level := GREATEST(1, (v_new_xp / 100) + 1);
  UPDATE public.profiles SET level = v_new_level WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER award_xp_after_registration
  AFTER INSERT ON public.tournament_registrations
  FOR EACH ROW EXECUTE FUNCTION public.award_xp_on_registration();