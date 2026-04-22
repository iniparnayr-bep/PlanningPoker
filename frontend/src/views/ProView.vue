<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router  = useRouter();
const email   = ref('');
const loading = ref(false);
const done    = ref(false);

function handleSubmit() {
  if (!email.value.includes('@')) return;
  loading.value = true;
  // TODO: wire up real auth/payment backend
  setTimeout(() => {
    loading.value = false;
    done.value    = true;
  }, 1200);
}
</script>

<template>
  <div class="pro-page">

    <button class="back-btn" @click="router.push('/')" aria-label="Back">
      ← Back
    </button>

    <div class="pro-card">

      <!-- Success state -->
      <transition name="fade">
        <div v-if="done" class="success-state">
          <div class="success-icon">🎉</div>
          <h2 class="success-title">You're on the list!</h2>
          <p class="success-sub">
            We'll email you at <strong>{{ email }}</strong> when Pro launches.
            In the meantime, enjoy the app!
          </p>
          <button class="btn-primary" @click="router.push('/')">Back to Planning Poker</button>
        </div>
      </transition>

      <!-- Signup form -->
      <transition name="fade">
        <div v-if="!done" class="form-state">
          <div class="pro-hero">
            <div class="pro-icon">✦</div>
          </div>

          <h1 class="pro-title">Planning Poker<br /><span class="pro-accent">Pro</span></h1>
          <p class="pro-sub">
            Unlimited AI estimations, faster responses, and more features on the way.
            Sign up to get early access.
          </p>

          <div class="features">
            <div class="feature">
              <span class="feature-icon">🤖</span>
              <div>
                <div class="feature-title">Unlimited AI</div>
                <div class="feature-desc">No caps on <code>/ask</code> and <code>/estimate</code></div>
              </div>
            </div>
            <div class="feature">
              <span class="feature-icon">⚡</span>
              <div>
                <div class="feature-title">Priority responses</div>
                <div class="feature-desc">Your AI calls skip the queue</div>
              </div>
            </div>
            <div class="feature">
              <span class="feature-icon">📊</span>
              <div>
                <div class="feature-title">Session history</div>
                <div class="feature-desc">Export estimates after the meeting <span class="badge-soon">soon</span></div>
              </div>
            </div>
            <div class="feature">
              <span class="feature-icon">🃏</span>
              <div>
                <div class="feature-title">Custom decks</div>
                <div class="feature-desc">Build your own estimation scale <span class="badge-soon">soon</span></div>
              </div>
            </div>
          </div>

          <div class="signup-form">
            <input
              v-model="email"
              type="email"
              placeholder="you@company.com"
              @keydown.enter="handleSubmit"
              :disabled="loading"
            />
            <button
              class="btn-primary"
              @click="handleSubmit"
              :disabled="loading || !email.includes('@')"
            >
              {{ loading ? 'Joining…' : 'Get early access →' }}
            </button>
            <p class="signup-note">No credit card required to join the waitlist.</p>
          </div>
        </div>
      </transition>

    </div>
  </div>
</template>

<style scoped>
.pro-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1.25rem;
  position: relative;
}

.back-btn {
  position: fixed;
  top: 1.25rem;
  left: 1.25rem;
  background: var(--panel-raised);
  border: 1px solid var(--line);
  color: var(--cream-dim);
  padding: 0.5rem 1rem;
  border-radius: 999px;
  cursor: pointer;
  font-family: var(--font-display);
  font-size: 0.88rem;
  font-weight: 600;
  transition: all 0.15s;
}
.back-btn:hover { color: var(--lime); border-color: var(--lime); }

.pro-card {
  width: 100%;
  max-width: 480px;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md), 0 0 100px rgba(212, 255, 58, 0.06);
  padding: 2.5rem 2rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.pro-hero {
  display: flex;
  justify-content: center;
}
.pro-icon {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--lime-dim);
  border: 1px solid var(--lime);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: var(--lime);
  font-weight: 900;
  box-shadow: 0 0 40px var(--lime-dim);
  animation: float 4s ease-in-out infinite;
}
@keyframes float {
  0%,100% { transform: translateY(0); }
  50%      { transform: translateY(-6px); }
}

.pro-title {
  font-size: clamp(2rem, 8vw, 3rem);
  font-weight: 800;
  letter-spacing: -0.035em;
  font-variation-settings: 'opsz' 72;
  color: var(--cream);
  line-height: 1.0;
  text-align: center;
}
.pro-accent {
  background: linear-gradient(105deg, var(--lime) 0%, var(--ice) 60%, var(--violet) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-style: italic;
}
.pro-sub {
  text-align: center;
  color: var(--cream-dim);
  font-size: 0.95rem;
  line-height: 1.5;
}

.features {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.feature {
  display: flex;
  align-items: flex-start;
  gap: 0.9rem;
  padding: 0.85rem 1rem;
  background: var(--ink-soft);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
}
.feature-icon { font-size: 1.3rem; flex-shrink: 0; }
.feature-title { font-weight: 700; color: var(--cream); font-size: 0.92rem; }
.feature-desc {
  color: var(--muted);
  font-size: 0.8rem;
  margin-top: 0.1rem;
}
.feature-desc code {
  font-family: var(--font-mono);
  font-size: 0.88em;
  color: var(--lime);
  background: var(--ink);
  padding: 1px 5px;
  border-radius: 3px;
}
.badge-soon {
  font-size: 0.65rem;
  background: var(--marigold);
  color: var(--ink);
  padding: 1px 6px;
  border-radius: 999px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  vertical-align: middle;
  margin-left: 4px;
}

.signup-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.signup-form input {
  background: var(--ink-soft);
  border: 1px solid var(--line);
  color: var(--cream);
  padding: 0.85rem 1rem;
  border-radius: var(--radius-md);
  font-family: var(--font-display);
  font-size: 1rem;
  outline: none;
  transition: all 0.15s;
}
.signup-form input:focus { border-color: var(--lime); box-shadow: 0 0 0 3px var(--lime-dim); }
.signup-form input::placeholder { color: var(--muted); }
.signup-form input:disabled { opacity: 0.6; }

.btn-primary {
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
.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px var(--lime-dim), 0 0 0 1px var(--lime);
}
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
.signup-note { color: var(--muted); font-size: 0.78rem; text-align: center; }

/* Success */
.success-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
  padding: 1rem 0;
}
.success-icon { font-size: 3rem; }
.success-title { font-size: 1.75rem; font-weight: 800; letter-spacing: -0.025em; color: var(--cream); }
.success-sub { color: var(--cream-dim); font-size: 0.95rem; line-height: 1.5; }
.success-sub strong { color: var(--lime); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.25s, transform 0.25s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(8px); }

@media (max-width: 480px) {
  .pro-card { padding: 1.75rem 1.25rem 1.5rem; }
}
</style>
