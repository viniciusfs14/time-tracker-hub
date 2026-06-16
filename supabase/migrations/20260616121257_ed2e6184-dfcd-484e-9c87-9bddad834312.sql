-- 1. Allow admins to manage roles
CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2. Seed first admin
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'vitinhovinicius8@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 3. Microsoft calendar OAuth tokens (per user)
CREATE TABLE public.microsoft_calendar_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_email TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.microsoft_calendar_tokens TO authenticated;
GRANT ALL ON public.microsoft_calendar_tokens TO service_role;

ALTER TABLE public.microsoft_calendar_tokens ENABLE ROW LEVEL SECURITY;

-- Users can see/manage whether they are connected (tokens are read server-side via service role)
CREATE POLICY "Users can view their own MS connection"
  ON public.microsoft_calendar_tokens FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own MS connection"
  ON public.microsoft_calendar_tokens FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_microsoft_calendar_tokens_updated_at
  BEFORE UPDATE ON public.microsoft_calendar_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();