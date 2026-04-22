# Planning Poker

A sleek, real-time planning poker app for agile teams. No signup, no ads, no database — sessions are ephemeral and live in memory.

## Features

**Sessions**
- Create or join a room with a 5-character token
- Share the invite link via the 🔗 button
- Rename the room at any time (host only)

**Estimation**
- Four deck types: Fibonacci, Powers of Two, T-Shirt Sizes, Person-Days
- Host reveals all estimates at once — cards flip simultaneously
- Average, median, and suggested value posted to chat on reveal
- Start a new round with one tap

**Players**
- Pick an emoji avatar and display name on join
- Click your name chip at any time to change name or avatar
- Ready / thinking status shown per player
- Host can kick players or promote others to host

**Chat**
- Unified chat with three slash commands:
  - `/ask <question>` — ask the AI a question in context of your session
  - `/estimate <description>` — get an AI-suggested card value
  - `/image <url>` — share an image or GIF inline

**Emoji interactions** (can be disabled by host)
- Throw emojis at other players
- Make it rain — shower the room with a chosen emoji from the top of the screen
- Shake a player's screen

**Room settings** (host only, synced to all players in real time)
- Color theme (7 options, changes accent color for everyone)
- Enable / disable emoji interactions
- Rename the room

## Tech stack

- **Frontend:** Vue 3 + Vite + Ant Design Vue
- **Backend:** Node.js + Express + Socket.io
- **AI:** Claude (Anthropic) via direct API — powers `/ask` and `/estimate`
- **Storage:** In-memory (no database — sessions are ephemeral)

## Self-hosting

**Requirements:** Node.js 18+, npm

```bash
# Clone
git clone https://github.com/iniparnayr-bep/PlanningPoker.git
cd PlanningPoker

# Backend
cd backend
npm install && npx tsc
cp .env.example .env   # set DOMAIN, BACKEND_PORT, ANTHROPIC_API_KEY
node src/index.js

# Frontend (separate terminal)
cd frontend
npm install
cp .env.example .env   # set VITE_DOMAIN, VITE_PROTOCOL, VITE_BACKEND_PORT
npm run build
# Serve frontend/dist/ as static files
```

Point nginx (or any reverse proxy) at the backend for `/api/` and `/socket.io/`, and serve `frontend/dist/` for everything else.
