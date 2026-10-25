<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Preserve the imported TanStack routes and Discord-owned encrypted sessions; Cloud stores app data, while each privileged request verifies Discord guild access.
- Keep overview presentation in server-stats and global semantic CSS tokens; shared module schemas own embed defaults so editor and API stay consistent.
- External bot workers use authenticated public bot APIs; never simulate a permanent bot process in the website runtime.
- The bot owns credit balances; the site stores pushed balances/transfer events and asks the bot to apply site-side credit changes (e.g. daily reward) through bot jobs, so the two never diverge.
- Member pages (/home, /leaderboard, /updates, /daily, /transactions) share AppShell and read only through server functions that check the Discord session.
- Server dashboard access goes through assertGuildAccess(session, guild, need): Discord admins are "owner", others need a dashboard_access grant ("manager" all settings, "moderator" members/activity), so every server function states its minimum role.
- Shop catalog = code defaults in src/lib/shop.ts merged with owner rows in shop_items, so prices can change without a deploy while built-in cosmetics keep their CSS looks.
- Scheduled bot work uses bot_jobs.run_after (claim_bot_jobs skips future jobs); repeating announcements are re-queued by the jobs POST handler after each run.
- Overview live numbers come from guild_live (bot pushes changed servers every ~3s via /api/public/bot/live); the 2-minute guild_telemetry snapshot stays for history charts, so live and historical data never block each other.
- Generated shop cosmetics live in src/lib/shop-extra.ts + generated CSS, mirrored to the bot's features/shop-looks.json, so site and /profile images share the same colors.
