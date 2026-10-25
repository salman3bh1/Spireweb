ALTER TABLE public.profile_style ADD COLUMN IF NOT EXISTS color text, ADD COLUMN IF NOT EXISTS frame text, ADD COLUMN IF NOT EXISTS effect text;
ALTER TABLE public.shop_purchases ADD COLUMN IF NOT EXISTS gifted_by text;
ALTER TABLE public.bot_jobs ADD COLUMN IF NOT EXISTS run_after timestamptz;

CREATE TABLE public.shop_items (
  id text PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('background','badge','frame','effect')),
  name text NOT NULL,
  emoji text,
  price bigint NOT NULL CHECK (price >= 0),
  active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.shop_items TO service_role;
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.post_likes (
  post_id uuid NOT NULL REFERENCES public.site_posts(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);
GRANT ALL ON public.post_likes TO service_role;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.dashboard_access (
  guild_id text NOT NULL,
  user_id text NOT NULL,
  role text NOT NULL CHECK (role IN ('moderator','manager')),
  username text,
  granted_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (guild_id, user_id)
);
GRANT ALL ON public.dashboard_access TO service_role;
ALTER TABLE public.dashboard_access ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.claim_bot_jobs(worker text, guild_ids text[])
 RETURNS SETOF bot_jobs
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
WITH selected AS (SELECT id FROM public.bot_jobs WHERE status='pending' AND guild_id=ANY(guild_ids) AND (run_after IS NULL OR run_after <= now()) ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 20)
UPDATE public.bot_jobs SET status='running',claimed_by=worker,claimed_at=now(),updated_at=now() WHERE id IN (SELECT id FROM selected) RETURNING *;
$function$;