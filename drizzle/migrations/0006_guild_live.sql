CREATE TABLE public.guild_live (
  guild_id text PRIMARY KEY,
  live jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.guild_live TO service_role;
ALTER TABLE public.guild_live ENABLE ROW LEVEL SECURITY;