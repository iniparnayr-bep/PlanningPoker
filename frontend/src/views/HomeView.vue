<script setup lang="ts">
import CreateGame from "@/components/CreateGame.vue";
import JoinGame from "@/components/JoinGame.vue";
import { useRouter } from "vue-router";
import { getActiveSessions } from "@/api/actionsService";
import { ref, onMounted } from "vue";
import type { Ref } from "vue";
import type { ActiveSessions } from "@/models/ActiveSessions";
import Footer from "@/components/Footer.vue";
import environment from "@/environments/environments";

const router = useRouter();
const sessionToken = localStorage.getItem('sessionToken');
if (sessionToken) router.push('/game/' + sessionToken);

const activeSessions: Ref<ActiveSessions | null> = ref(null);
const mode = ref<'menu' | 'create' | 'join'>('menu');

onMounted(() => {
  getActiveSessions().then(info => { activeSessions.value = info; });
});
</script>

<template>
  <div class="home">

    <!-- Ambient ticker in corner -->
    <aside class="live-ticker" v-if="activeSessions !== null">
      <span class="live-dot"></span>
      <span class="label-xs">Live</span>
      <span class="ticker-num mono">{{ activeSessions.active }}</span>
      <span class="ticker-slash">/</span>
      <span class="ticker-total mono">{{ activeSessions.total }}</span>
    </aside>

    <!-- Hero -->
    <main class="stage">
      <div class="wordmark">
        <span class="wordmark-tag label-xs">Planning Poker · v0.2 beta</span>
        <h1 class="wordmark-title">
          Estimate<br />
          <span class="accent">together.</span>
        </h1>
        <p class="wordmark-sub">
          Spin up a room, deal the cards, reveal the spread.
          No ads, no signup, no corporate flavor.
        </p>
      </div>

      <!-- Deck of floating cards decoration -->
      <div class="deck" aria-hidden="true">
        <div class="deco-card c1"><span class="mono">3</span></div>
        <div class="deco-card c2"><span class="mono">5</span></div>
        <div class="deco-card c3"><span class="mono">8</span></div>
        <div class="deco-card c4"><span class="mono">13</span></div>
        <div class="deco-card c5"><span>☕</span></div>
      </div>

      <!-- Action panel -->
      <section class="panel">
        <div class="tabs">
          <button :class="['tab', mode === 'create' && 'tab-active', mode === 'menu' && 'tab-active']"
                  @click="mode = 'create'">
            <span class="label-xs">01 ·</span> Create
          </button>
          <button :class="['tab', mode === 'join' && 'tab-active']"
                  @click="mode = 'join'">
            <span class="label-xs">02 ·</span> Join
          </button>
        </div>

        <div class="tab-body">
          <CreateGame v-if="mode !== 'join'" />
          <JoinGame v-if="mode === 'join'" />
        </div>
      </section>
    </main>

    <div v-if="environment.devServer" class="testserver">
      <strong>⚠ Test server</strong> — some features may be rough.
      Check <RouterLink to="/changelog">changelogs</RouterLink>.
      Stable build <a :href="environment.productionAddress" target="_blank">here</a>.
    </div>

    <Footer />
  </div>
</template>

<style scoped>
.home {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 2rem 1.25rem 6rem;
  position: relative;
  overflow-x: hidden;
}

/* ── Live ticker (top right corner) ── */
.live-ticker {
  position: fixed;
  top: 1rem;
  right: 1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.85rem;
  background: rgba(22, 28, 37, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid var(--line);
  border-radius: 999px;
  font-size: 0.75rem;
  z-index: 50;
}
.live-dot {
  width: 7px; height: 7px;
  background: var(--lime);
  border-radius: 50%;
  box-shadow: 0 0 10px var(--lime);
  animation: pulse 2s ease-in-out infinite;
}
@keyframes pulse { 50% { opacity: 0.4; transform: scale(0.75); } }
.ticker-num { color: var(--lime); font-weight: 700; }
.ticker-slash, .ticker-total { color: var(--muted); }

/* ── Stage layout ── */
.stage {
  flex: 1;
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-top: 2rem;
  position: relative;
}

.wordmark {
  margin-bottom: 3.5rem;
  position: relative;
  z-index: 2;
}
.wordmark-tag {
  display: block;
  color: var(--lime);
  margin-bottom: 1rem;
  animation: fade-up 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
.wordmark-title {
  font-size: clamp(3rem, 10vw, 6.5rem);
  line-height: 0.9;
  font-weight: 800;
  letter-spacing: -0.04em;
  font-variation-settings: 'opsz' 96;
  color: var(--cream);
  animation: fade-up 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both;
}
.accent {
  background: linear-gradient(105deg, var(--lime) 0%, var(--ice) 50%, var(--violet) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-style: italic;
  font-variation-settings: 'opsz' 96;
}
.wordmark-sub {
  margin-top: 1.25rem;
  color: var(--cream-dim);
  font-size: 1.05rem;
  max-width: 30rem;
  line-height: 1.5;
  animation: fade-up 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both;
}

/* ── Decorative floating card deck ── */
.deck {
  position: absolute;
  right: -1rem;
  top: 2rem;
  width: 280px; height: 280px;
  pointer-events: none;
  z-index: 1;
}
.deco-card {
  position: absolute;
  width: 80px;
  height: 110px;
  background: linear-gradient(155deg, var(--panel-raised), var(--panel));
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-family: var(--font-mono);
  font-weight: 600;
  color: var(--cream);
  box-shadow: var(--shadow-md);
  animation: float 6s ease-in-out infinite;
}
.c1 { top:   0; right:  70px; transform: rotate(-12deg); animation-delay: 0s;   color: var(--lime); }
.c2 { top:  30px; right: 145px; transform: rotate(-20deg); animation-delay: 0.4s; }
.c3 { top:  70px; right:  20px; transform: rotate(8deg);   animation-delay: 0.8s; color: var(--coral); }
.c4 { top: 140px; right: 100px; transform: rotate(-4deg);  animation-delay: 1.2s; }
.c5 { top: 170px; right: 200px; transform: rotate(18deg);  animation-delay: 1.6s; color: var(--marigold); }
@keyframes float {
  0%,100% { transform: translateY(0) rotate(var(--r, 0deg)); }
  50% { transform: translateY(-8px) rotate(var(--r, 0deg)); }
}

/* ── Action panel ── */
.panel {
  position: relative;
  z-index: 2;
  max-width: 34rem;
  background: rgba(22, 28, 37, 0.7);
  backdrop-filter: blur(20px);
  border: 1px solid var(--line);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-md), 0 0 100px rgba(212, 255, 58, 0.04);
  animation: fade-up 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both;
}
.tabs {
  display: flex;
  gap: 0;
  padding: 0.5rem;
  border-bottom: 1px solid var(--line);
  background: var(--ink-deep);
}
.tab {
  flex: 1;
  padding: 0.85rem 1rem;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 0.95rem;
  background: transparent;
  color: var(--muted);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}
.tab .label-xs { color: inherit; opacity: 0.5; }
.tab:hover { color: var(--cream); }
.tab-active {
  background: var(--panel-raised);
  color: var(--lime);
  box-shadow: 0 1px 0 rgba(255,255,255,0.05) inset;
}
.tab-active .label-xs { color: var(--lime); opacity: 1; }
.tab-body { padding: 1.5rem; }

.testserver {
  max-width: 34rem;
  margin: 1.5rem auto 0;
  padding: 1rem 1.25rem;
  background: var(--coral-dim);
  border: 1px solid rgba(255, 90, 107, 0.3);
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  color: var(--cream);
  line-height: 1.5;
}
.testserver strong { color: var(--coral); letter-spacing: -0.01em; }
.testserver a { color: var(--lime); text-decoration: underline; }

@keyframes fade-up {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Mobile ── */
@media (max-width: 720px) {
  .deck { opacity: 0.5; transform: scale(0.7); top: 1rem; right: -3rem; }
  .wordmark { margin-bottom: 2.5rem; }
  .wordmark-sub { font-size: 0.95rem; }
}
@media (max-width: 480px) {
  .home { padding: 1.5rem 1rem 5rem; }
  .deck { display: none; }
  .tab { font-size: 0.85rem; padding: 0.75rem 0.5rem; }
  .tab-body { padding: 1.25rem; }
}
</style>
