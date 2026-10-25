CREATE OR REPLACE FUNCTION public.interaction_top(p_limit int DEFAULT 50)
RETURNS TABLE(user_id text, username text, avatar text, messages bigint, voice_seconds bigint, xp bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT m.user_id, max(m.username), max(m.avatar), sum(m.messages)::bigint, sum(m.voice_seconds)::bigint, sum(m.xp)::bigint
  FROM public.member_stats m GROUP BY m.user_id ORDER BY sum(m.xp) DESC, m.user_id LIMIT least(greatest(p_limit,1),100);
$$;
REVOKE ALL ON FUNCTION public.interaction_top(int) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.interaction_top(int) TO service_role;

CREATE OR REPLACE FUNCTION public.member_totals(p_user text)
RETURNS TABLE(messages bigint, voice_seconds bigint, xp bigint, max_level int, interaction_rank bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  WITH t AS (SELECT user_id, sum(xp)::bigint xp FROM public.member_stats GROUP BY user_id),
  me AS (SELECT coalesce(sum(messages),0)::bigint messages, coalesce(sum(voice_seconds),0)::bigint voice_seconds, coalesce(sum(xp),0)::bigint xp, coalesce(max(level),0) max_level FROM public.member_stats WHERE user_id = p_user)
  SELECT me.messages, me.voice_seconds, me.xp, me.max_level, (SELECT count(*) FROM t WHERE t.xp > me.xp) + 1 FROM me;
$$;
REVOKE ALL ON FUNCTION public.member_totals(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.member_totals(text) TO service_role;