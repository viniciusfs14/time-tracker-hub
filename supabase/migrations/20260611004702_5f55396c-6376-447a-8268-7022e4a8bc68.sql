-- Chamados (RITMs)
CREATE TABLE public.ritms (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  code text NOT NULL,
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  requester text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open',
  pending_reason text NOT NULL DEFAULT '',
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, code)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ritms TO authenticated;
GRANT ALL ON public.ritms TO service_role;

ALTER TABLE public.ritms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own ritms"
  ON public.ritms FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all ritms"
  ON public.ritms FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_ritms_updated_at
  BEFORE UPDATE ON public.ritms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Histórico de alterações dos chamados
CREATE TABLE public.ritm_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ritm_id uuid NOT NULL REFERENCES public.ritms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  field text NOT NULL,
  old_value text,
  new_value text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ritm_history TO authenticated;
GRANT ALL ON public.ritm_history TO service_role;

ALTER TABLE public.ritm_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own ritm history"
  ON public.ritm_history FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ritm history"
  ON public.ritm_history FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all ritm history"
  ON public.ritm_history FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_ritm_history_ritm_id ON public.ritm_history(ritm_id);
CREATE INDEX idx_ritms_user_id ON public.ritms(user_id);