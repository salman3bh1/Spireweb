CREATE TABLE public.user_profiles (
  user_id text PRIMARY KEY,
  username text,
  avatar text,
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.user_profiles TO service_role;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.shop_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  item_id text NOT NULL,
  price bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_id)
);
GRANT ALL ON public.shop_purchases TO service_role;
ALTER TABLE public.shop_purchases ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.profile_style (
  user_id text PRIMARY KEY,
  background text,
  badges jsonb NOT NULL DEFAULT '[]'::jsonb,
  bio text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.profile_style TO service_role;
ALTER TABLE public.profile_style ENABLE ROW LEVEL SECURITY;