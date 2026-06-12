ALTER TABLE public.ritms
  ADD COLUMN IF NOT EXISTS request_type text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS operational_unit text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS requester_email text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS locality text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS pims text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS pep text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS observation text NOT NULL DEFAULT '';

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;

CREATE TABLE public.useful_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT '',
  url text NOT NULL,
  hotkey text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.useful_links TO authenticated;
GRANT ALL ON public.useful_links TO service_role;

ALTER TABLE public.useful_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own links"
  ON public.useful_links FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_useful_links_updated_at
  BEFORE UPDATE ON public.useful_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();