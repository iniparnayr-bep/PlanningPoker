<script setup lang="ts">
import { dismissProNag } from '@/api/proService';
import { useRouter } from 'vue-router';

const router = useRouter();

function handleUpgrade() {
  dismissProNag();
  router.push('/pro');
}
</script>

<template>
  <Teleport to="body">
    <div class="nag-backdrop">
      <div class="nag-card">

        <!-- Sparkle header -->
        <div class="nag-hero">
          <div class="nag-icon">✦</div>
          <div class="nag-badge label-xs">Free limit reached</div>
        </div>

        <h2 class="nag-title">You've used your 5 free AI moves</h2>
        <p class="nag-sub">
          Unlock unlimited <code>/ask</code> and <code>/estimate</code> with a
          <strong>Pro account</strong> — plus priority responses and future features.
        </p>

        <ul class="nag-perks">
          <li><span class="perk-check">✓</span> Unlimited AI interactions</li>
          <li><span class="perk-check">✓</span> Faster responses</li>
          <li><span class="perk-check">✓</span> Session history & export <span class="perk-soon">soon</span></li>
          <li><span class="perk-check">✓</span> Custom deck types <span class="perk-soon">soon</span></li>
        </ul>

        <button class="btn-upgrade" @click="handleUpgrade">
          Create a Pro account →
        </button>

        <button class="btn-dismiss" @click="dismissProNag()">
          Not now — I'll play without AI
        </button>

      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.nag-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(6, 9, 13, 0.85);
  backdrop-filter: blur(10px);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  animation: fadeIn 0.2s ease;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.nag-card {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md), 0 0 80px rgba(212, 255, 58, 0.06);
  width: 100%;
  max-width: 420px;
  padding: 2rem 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1rem;
  animation: slideUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(16px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.nag-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}
.nag-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--lime-dim);
  border: 1px solid var(--lime);
  box-shadow: 0 0 32px var(--lime-dim);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  color: var(--lime);
  font-weight: 900;
  animation: pulse-glow 2.5s ease-in-out infinite;
}
@keyframes pulse-glow {
  0%,100% { box-shadow: 0 0 20px var(--lime-dim); }
  50%      { box-shadow: 0 0 40px var(--lime-glow); }
}
.nag-badge {
  display: inline-block;
  padding: 3px 10px;
  background: var(--lime-dim);
  border: 1px solid var(--lime);
  border-radius: 999px;
  color: var(--lime);
  letter-spacing: 0.1em;
}

.nag-title {
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.025em;
  font-variation-settings: 'opsz' 48;
  color: var(--cream);
  line-height: 1.1;
}
.nag-sub {
  color: var(--cream-dim);
  font-size: 0.95rem;
  line-height: 1.5;
  max-width: 320px;
}
.nag-sub code {
  background: var(--ink-soft);
  padding: 1px 6px;
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 0.88em;
  color: var(--lime);
}
.nag-sub strong { color: var(--cream); }

.nag-perks {
  list-style: none;
  width: 100%;
  background: var(--ink-soft);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  padding: 0.9rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  text-align: left;
}
.nag-perks li {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.92rem;
  color: var(--cream);
}
.perk-check {
  color: var(--lime);
  font-weight: 800;
  font-size: 0.9rem;
  flex-shrink: 0;
}
.perk-soon {
  font-size: 0.68rem;
  font-family: var(--font-label);
  background: var(--marigold);
  color: var(--ink);
  padding: 1px 6px;
  border-radius: 999px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin-left: auto;
}

.btn-upgrade {
  width: 100%;
  padding: 1rem;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.05rem;
  letter-spacing: -0.01em;
  background: var(--lime);
  color: var(--ink);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 2px 0 rgba(0,0,0,0.3), 0 0 20px var(--lime-dim);
}
.btn-upgrade:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px var(--lime-dim), 0 0 0 1px var(--lime);
}

.btn-dismiss {
  background: transparent;
  border: none;
  color: var(--muted);
  font-family: var(--font-display);
  font-size: 0.85rem;
  cursor: pointer;
  padding: 0.25rem;
  text-decoration: underline;
  text-underline-offset: 3px;
  transition: color 0.15s;
}
.btn-dismiss:hover { color: var(--cream-dim); }

@media (max-width: 480px) {
  .nag-card { padding: 1.5rem 1.25rem 1.25rem; }
  .nag-title { font-size: 1.3rem; }
}
</style>
