
CREATE TABLE public.visitor_counter (
  id INT PRIMARY KEY DEFAULT 1,
  count BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO public.visitor_counter (id, count) VALUES (1, 0);

ALTER TABLE public.visitor_counter ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read counter"
  ON public.visitor_counter FOR SELECT
  USING (true);

CREATE POLICY "Anyone can update counter"
  ON public.visitor_counter FOR UPDATE
  USING (id = 1) WITH CHECK (id = 1);

CREATE OR REPLACE FUNCTION public.increment_visitor_count()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count BIGINT;
BEGIN
  UPDATE public.visitor_counter
    SET count = count + 1, updated_at = now()
    WHERE id = 1
    RETURNING count INTO new_count;
  RETURN new_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_visitor_count() TO anon, authenticated;
