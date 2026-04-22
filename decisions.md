# Decisions & Open Questions

## Resolved

| # | Question | Decision |
|---|----------|----------|
| 1 | Domain | `emoji-poker.com` — Ryan buying it; current sandbox uses Tailscale hostname |
| 2 | Stripe keys | Mocked for now; `$9/month` Pro seat when live |
| 3 | Image storage | Local `storage/app/public/chat-images/`, filename = `{timestamp}_{sessionToken}_{random}.{ext}`, cleanup cron every hour |
| 4 | Auth model | Anonymous play always free; Pro requires login + subscription; room creator's Pro status determines room features |
| 5 | Migration strategy | Replace Node app in-place; build in `/Projects/PlanningPokerV2`, switch nginx when ready |
| 6 | Reverb vs Socket.io | Reverb uses Pusher protocol; frontend uses `laravel-echo` + `pusher-js` |

## Open / Assumptions Made

| # | Question | Assumption |
|---|----------|------------|
| A | PHP version | Installing PHP 8.3 (LTS, Laravel 11 minimum) |
| B | SQLite WAL | Enabled for concurrent reads during presence channel updates |
| C | Queue driver | Using `database` queue (SQLite) — no Redis needed for this scale |
| D | Reverb port | Internal port `8080` (Reverb), nginx proxies `/app/` websocket path |
| E | Pro room logo | Small crown/star badge on the session name in the game room topbar |
| F | Make-admin bug fix | Will wrap owner transfer in a DB transaction; frontend will optimistically update but rollback on error |
| G | Image file types | Accept: image/jpeg, image/png, image/gif, image/webp. Max size: 5MB |
| H | Cashier mock | `is_pro` column on users table; `POST /billing/subscribe` sets it directly until real Stripe keys provided |
| I | Inertia vs SPA | Using Inertia.js for auth pages (register/login/billing), pure Vue SPA for the game itself |
| J | Emoji-poker.com future | Current codebase will be the source; CI/CD pipeline to be handled separately by Ryan |
