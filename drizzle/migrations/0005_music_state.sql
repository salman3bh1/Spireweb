CREATE TABLE public.music_state (guild_id text PRIMARY KEY, state jsonb NOT NULL DEFAULT '{}'::jsonb, updated_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.music_state TO service_role;
ALTER TABLE public.music_state ENABLE ROW LEVEL SECURITY;