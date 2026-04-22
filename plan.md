# Emoji Poker — Laravel Rewrite Plan

## Overview
Full rewrite of the Node.js/Vue/Ant Design app to:
- **Backend:** PHP 8.3 + Laravel 11 (replacing Express + Socket.io)
- **Frontend:** Vue 3 + PrimeVue (replacing Ant Design Vue)
- **Realtime:** Laravel Reverb (replacing Socket.io)
- **Database:** SQLite via Eloquent (replacing in-memory array)
- **AI:** Laravel AI SDK → Anthropic Claude
- **Billing:** Laravel Cashier + Stripe (mocked until live keys)
- **Auth:** Laravel Breeze (optional; required for Pro)

## Task List

### Phase 0 — Environment Setup
- [ ] **0.1** Install PHP 8.3, Composer on EC2
- [ ] **0.2** Install Laravel installer, create new Laravel project in `/Projects/PlanningPokerV2`
- [ ] **0.3** Install Node 22 tooling for Vite/Vue frontend (already installed)
- [ ] **0.4** Verify `php artisan serve` and Vite dev server work

### Phase 1 — Laravel Foundation
- [ ] **1.1** Configure SQLite database (`.env`: `DB_CONNECTION=sqlite`)
- [ ] **1.2** Install Laravel Reverb (`composer require laravel/reverb`) and configure
- [ ] **1.3** Install Laravel Breeze with Vue/Inertia stack
- [ ] **1.4** Install Laravel Cashier Stripe (`composer require laravel/cashier`) — mock Stripe keys for now
- [ ] **1.5** Install Laravel AI SDK and configure Anthropic key
- [ ] **1.6** Install PrimeVue + PrimeIcons in frontend (`npm install primevue @primevue/themes primeicons`)
- [ ] **1.7** Strip Ant Design Vue, keep only: vue, vue-router, vite, primevue, rxjs, @vueuse/core, axios
- [ ] **COMMIT: Phase 1 — Laravel foundation scaffolded**

### Phase 2 — Database Models & Migrations
- [ ] **2.1** Migration: `sessions` table (id, token [uppercase 5-char], name, color, emojis_enabled, rosebud, is_open, owner_id, created_at)
- [ ] **2.2** Migration: `players` table (id, session_token, user_id [nullable], name, avatar, is_owner, estimate [nullable], socket_id, created_at)
- [ ] **2.3** Migration: `messages` table (id, session_token, player_name, message, type [std/ai/server], created_at)
- [ ] **2.4** Migration: `images` table (id, filename, session_token, expires_at)
- [ ] **2.5** Eloquent models: Session, Player, Message, Image
- [ ] **2.6** User model updates: add `is_pro`, `stripe_id`, `subscribed` via Cashier
- [ ] **COMMIT: Phase 2 — Migrations and models**

### Phase 3 — Core Game API (REST)
- [ ] **3.1** `POST /api/sessions` — create session (returns token + owner player token)
- [ ] **3.2** `POST /api/sessions/{token}/join` — join session (returns player token)
- [ ] **3.3** `GET  /api/sessions/{token}` — get session state
- [ ] **3.4** `PUT  /api/sessions/{token}/open` — reveal/hide estimates (owner only)
- [ ] **3.5** `PUT  /api/sessions/{token}/estimate` — submit estimate
- [ ] **3.6** `PUT  /api/sessions/{token}/settings` — color, emojis, rename, deck (owner only)
- [ ] **3.7** `POST /api/sessions/{token}/kick` — kick player (owner only)
- [ ] **3.8** `PUT  /api/sessions/{token}/make-admin` — transfer ownership
- [ ] **3.9** `PUT  /api/players/{token}` — rename self + change avatar
- [ ] **3.10** Fix make-admin bug: transfer owner flag atomically, ensure old owner loses it reliably
- [ ] **COMMIT: Phase 3 — Core game REST API**

### Phase 4 — Realtime with Laravel Reverb
- [ ] **4.1** Define Reverb channels: `session.{token}` (presence channel)
- [ ] **4.2** Events: SessionUpdated, PlayerJoined, PlayerLeft, EstimateSubmitted, SessionOpened, ChatMessage, EmojiThrown, SessionSettings
- [ ] **4.3** Frontend: replace Socket.io client with Laravel Echo + Pusher-js (Reverb uses Pusher protocol)
- [ ] **4.4** Presence channel: track connected players, handle disconnect/reconnect
- [ ] **COMMIT: Phase 4 — Reverb realtime events**

### Phase 5 — Chat + AI + Image Upload
- [ ] **5.1** `POST /api/sessions/{token}/chat` — send message, broadcast via Reverb
- [ ] **5.2** AI commands: `/ask` and `/estimate` via Laravel AI SDK → Anthropic
- [ ] **5.3** Rate limiting: 5 AI calls per IP (Laravel rate limiter), 100/hour global
- [ ] **5.4** Rosebud cheat code: bypass rate limits for sessions named "rosebud"
- [ ] **5.5** Image upload: `POST /api/sessions/{token}/images` — store in `storage/app/public/chat-images/{timestamp}_{token}_{random}.{ext}`, return URL
- [ ] **5.6** Image cleanup: artisan command `images:cleanup` — delete files + DB rows older than 1 hour; register in scheduler
- [ ] **COMMIT: Phase 5 — Chat, AI, image upload**

### Phase 6 — Auth + Pro + Billing (mocked Stripe)
- [ ] **6.1** Laravel Breeze auth routes: register, login, logout, profile
- [ ] **6.2** Pro check middleware: `CheckProSubscription` — allow if subscribed OR rosebud room
- [ ] **6.3** `GET  /billing` — subscription dashboard (plan status, upgrade CTA, cancel)
- [ ] **6.4** `POST /billing/subscribe` — initiate Stripe checkout (mocked: set `is_pro=true` for now)
- [ ] **6.5** `POST /billing/cancel` — cancel subscription
- [ ] **6.6** Pro room indicator: if session owner is Pro (or rosebud), broadcast `is_pro: true` in session state
- [ ] **6.7** Pro nag modal (5 free AI uses → upgrade prompt) — same logic as current frontend
- [ ] **COMMIT: Phase 6 — Auth, Pro tier, billing mock**

### Phase 7 — Frontend PrimeVue Redesign
- [ ] **7.1** Port all components from Ant Design Vue → PrimeVue equivalents
  - Cards, Buttons, Inputs, Dialogs, Drawers (Sidebar), Tabs, Menus
- [ ] **7.2** Keep exact same visual aesthetic (Neon Deck: midnight navy, electric lime, Bricolage Grotesque)
  — PrimeVue theming via CSS variables, no default PrimeVue theme
- [ ] **7.3** Landing page fixes:
  - Fix "together." gradient clip on mobile (use `display:inline-block; padding-right`)
  - Remove Changelog / Suggest a change / Report a bug footer links
  - Remove version/beta designation from top
  - Live session count: show single number (active sessions only)
  - New tagline: "Spin up a room and start planning your sprints! No ads, no signup required. Chat, plan, and vote for free!"
  - Planning Poker blurb + feature showcase (decks, voting, AI chat, emoji throwing)
  - "Support further development of emoji-poker.com" CTA
- [ ] **7.4** Mobile viewport: all pages fit 100dvh, no vertical scroll on main pages
  - Keyboard-aware layout (use `visualViewport` API to shrink chat when keyboard opens)
- [ ] **7.5** Replace `/image` command with attach-image button (file picker → upload API)
- [ ] **7.6** Pro room logo indicator at top of game room
- [ ] **7.7** Subscription dashboard UI
- [ ] **COMMIT: Phase 7 — PrimeVue frontend complete**

### Phase 8 — Wiring, Cleanup, Deploy
- [ ] **8.1** Switch nginx + Tailscale serve to point at Laravel (port 8000 or via php-fpm)
- [ ] **8.2** Set up supervisord/systemd for: Laravel queue worker, Reverb server, scheduler
- [ ] **8.3** Replace Node systemd services (`planningpoker.service`, `todo.service` stays)
- [ ] **8.4** Run full test pass: create session, join, vote, reveal, chat, AI, image, emoji, Pro flow
- [ ] **8.5** Final git commit with updated README
- [ ] **COMMIT: Phase 8 — Production wiring, final cleanup**

---

## Architecture Notes

```
Browser ←→ nginx/Tailscale serve
              ↓ /api/*         → Laravel (php-fpm or artisan serve)
              ↓ /app/ws        → Laravel Reverb (websocket server)
              ↓ /storage/*     → Laravel public storage (images)
              ↓ /projects/todo → Node todo app (unchanged)

Laravel stack:
  - Routes:   routes/api.php (game API), routes/web.php (auth + billing + SPA)
  - Queue:    database driver (SQLite)
  - Cache:    file driver
  - Sessions: database driver
  - Reverb:   standalone process on port 8080 (internal)
```

## Decisions (open questions → see decisions.md)
