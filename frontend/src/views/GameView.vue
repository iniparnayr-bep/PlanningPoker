<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import { tryReconnectFromBrowserStorage, spectateGame } from "@/api/joinLeaveService";
import userRef from "@/reactive/useUser";
import sessionRef from "@/reactive/useSession";
import User from "@/components/User.vue";
import EstimateOptions from "@/components/EstimateOptions.vue";
import { computed, ref, watch } from "vue";
import { message } from 'ant-design-vue';
import Chat from "@/components/Chat.vue";
import { clearMessages } from "@/api/chatService";
import estimationHistogram from "@/reactive/useEstimationHistogram";
import Histogram from "@/components/Histogram.vue";
import TopBar from "@/components/TopBar.vue";
import { socketExit } from "@/api/socketService";
import { openSession } from "@/api/actionsService";
import { rainEmoji } from "@/api/emojiRainService";
import env from "@/environments/environments";
import {
  EyeOutlined, EyeInvisibleOutlined, MessageOutlined, CloseOutlined,
  SmileOutlined, LinkOutlined
} from "@ant-design/icons-vue";

const router = useRouter();
const route = useRoute();
const gameToken: string = (typeof route.params.token === 'object' ? route.params.token[0] : route.params.token);
const estimateOptionsRef = ref(null);

const chatOpen  = ref(false);
const emojiOpen = ref(false);
const toggling  = ref(false);

const estimationOptions = computed(() => sessionRef.value?.estimationValues);
const playerCount = computed(() => sessionRef.value?.players?.length ?? 0);
const readyCount = computed(() =>
  sessionRef.value?.players?.filter(p => p.estimate !== null).length ?? 0
);
const isOwner      = computed(() => !!userRef.value?.isOwner);
const isRevealed   = computed(() => !!sessionRef.value?.open);
const emojisEnabled = computed(() => sessionRef.value?.emojisEnabled !== false);

// ── Reconnect / spectate bootstrap ──
if (sessionRef.value === null) {
  if (!localStorage.getItem('userToken')) {
    spectateGame(gameToken).then(() => {
      message.success('You are now spectating.');
    }).catch(() => {
      socketExit(); clearMessages(); localStorage.clear();
      router.push('/');
      message.error('The session has expired, please create a new one.');
    });
  } else {
    tryReconnectFromBrowserStorage(gameToken).then(() => {
      message.success('You have rejoined the session.');
    }).catch(() => {
      socketExit(); clearMessages(); localStorage.clear();
      router.push('/');
      message.error('The session has expired, please create a new one.');
    });
  }
}

watch(sessionRef, (newValue, oldValue) => {
  if (newValue?.open === false && oldValue?.open === true)
    // @ts-ignore
    estimateOptionsRef?.value?.resetSelection();
  if (newValue?.estimationOptions !== oldValue?.estimationOptions)
    // @ts-ignore
    estimateOptionsRef?.value?.resetSelection();
});

async function toggleReveal() {
  if (!sessionRef.value || toggling.value) return;
  toggling.value = true;
  const wasOpen = sessionRef.value.open;
  try {
    await openSession(!wasOpen);
  } catch (e: any) {
    const status = e?.response?.status;
    if (status === 403) message.error('Only the session host can reveal estimates.');
    else if (status === 404) message.error('Session not found — try rejoining.');
    else message.error('Could not update the session.');
  } finally {
    setTimeout(() => { toggling.value = false; }, 400);
  }
}

const rainPresets = ['🎉', '🔥', '💰', '🌧️', '🍀', '💜', '⭐', '💸', '🎊', '✨', '💥', '❤️'];

function copyInvite() {
  navigator.clipboard.writeText(env.joinAddress + gameToken).then(() => {
    message.success('Invite link copied.');
  });
}
function fireRain(emoji: string) {
  rainEmoji(emoji);
  emojiOpen.value = false;
}
</script>

<template>
  <TopBar />

  <main class="game">
    <section class="board">
      <div class="board-head">
        <div class="board-head-left">
          <span class="label-xs">Table</span>
          <span class="board-count mono">
            <span class="ready">{{ readyCount }}</span> / {{ playerCount }}
          </span>
        </div>
        <button
          v-if="isOwner"
          class="reveal-btn"
          :class="{ 'reveal-pending': !isRevealed, 'reveal-active': isRevealed }"
          :disabled="toggling"
          @click="toggleReveal"
        >
          <EyeOutlined v-if="!isRevealed" />
          <EyeInvisibleOutlined v-else />
          <span>{{ isRevealed ? 'New round' : 'Reveal estimates' }}</span>
        </button>
      </div>

      <div class="players" v-if="sessionRef">
        <User
          v-for="user of sessionRef.players"
          :key="user.id"
          :id="user.id"
          :estimate="user.estimate"
          :username="user.name"
          :avatar="user.avatar"
        />
      </div>
    </section>
  </main>

  <Histogram v-if="sessionRef && estimationHistogram" :data="estimationHistogram" :hide="!isRevealed" />
  <EstimateOptions
    v-if="sessionRef && userRef"
    ref="estimateOptionsRef"
    :estimation-options="estimationOptions"
    :hide="isRevealed"
  />

  <!-- ── Action FAB stack (bottom right) ── -->
  <div class="fab-stack" :class="{ 'fab-stack-lifted': !isRevealed && userRef }">
    <button class="fab" @click="copyInvite" aria-label="Copy invite link" title="Copy invite">
      <LinkOutlined />
    </button>

    <button v-if="emojisEnabled" class="fab fab-emoji" :class="{ active: emojiOpen }" @click="emojiOpen = !emojiOpen" aria-label="Rain emoji">
      <SmileOutlined v-if="!emojiOpen" />
      <CloseOutlined v-else />
    </button>

    <button class="fab fab-chat" :class="{ active: chatOpen }" @click="chatOpen = !chatOpen" aria-label="Chat">
      <MessageOutlined v-if="!chatOpen" />
      <CloseOutlined v-else />
    </button>
  </div>

  <!-- ── Emoji popover ── -->
  <transition name="pop">
    <div v-if="emojiOpen" class="emoji-popover" @click.self="emojiOpen = false">
      <div class="emoji-pop-card" @click.stop>
        <div class="emoji-pop-head">
          <span class="label-xs">Make it rain 🌧</span>
          <button class="pop-close" @click="emojiOpen = false" aria-label="Close">✕</button>
        </div>
        <div class="emoji-pop-grid">
          <button v-for="e in rainPresets" :key="e" class="emoji-pop-btn" @click="fireRain(e)">{{ e }}</button>
        </div>
      </div>
    </div>
  </transition>

  <!-- ── Chat drawer (right side on PC, fullscreen on mobile) ── -->
  <transition name="chat-fade">
    <div v-if="chatOpen" class="chat-backdrop" @click.self="chatOpen = false"></div>
  </transition>
  <transition name="chat-slide">
    <aside v-if="chatOpen" class="chat-drawer">
      <header class="chat-drawer-head">
        <span class="label-xs">Chat</span>
        <button class="chat-drawer-close" @click="chatOpen = false" aria-label="Close chat">✕</button>
      </header>
      <div class="chat-drawer-body">
        <Chat />
      </div>
    </aside>
  </transition>
</template>

<style scoped>
.game {
  min-height: calc(100vh - 64px);
  padding-bottom: 12rem;
  position: relative;
}

.board {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem 1.25rem 1rem;
}
.board-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.board-head-left {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
}
.board-count {
  font-size: 1.1rem;
  color: var(--muted);
  letter-spacing: 0.05em;
}
.board-count .ready { color: var(--lime); font-weight: 700; }

.reveal-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.7rem 1.4rem;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.95rem;
  letter-spacing: -0.01em;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  border: 1px solid transparent;
}
.reveal-btn:disabled { opacity: 0.6; cursor: wait; }
.reveal-pending {
  background: var(--lime);
  color: var(--ink);
  border-color: var(--lime);
  box-shadow: 0 2px 0 rgba(0,0,0,0.3), 0 0 16px var(--lime-dim);
  animation: reveal-pulse 2.5s ease-in-out infinite;
}
.reveal-pending:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px var(--lime-dim), 0 0 0 1px var(--lime);
}
@keyframes reveal-pulse {
  0%,100% { box-shadow: 0 2px 0 rgba(0,0,0,0.3), 0 0 16px var(--lime-dim); }
  50%     { box-shadow: 0 2px 0 rgba(0,0,0,0.3), 0 0 24px var(--lime-glow); }
}
.reveal-active {
  background: var(--panel-raised);
  color: var(--cream);
  border-color: var(--line);
}
.reveal-active:hover:not(:disabled) {
  border-color: var(--ice);
  color: var(--ice);
}

.players {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.85rem;
}

/* ── FAB stack ── */
.fab-stack {
  position: fixed;
  right: 1.25rem;
  bottom: 9.5rem;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.6rem;
  z-index: 25;
  transition: bottom 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.fab-stack-lifted { bottom: 10.5rem; }
.fab {
  width: 48px;
  height: 48px;
  border-radius: 999px;
  background: var(--panel-raised);
  border: 1px solid var(--line);
  color: var(--cream);
  font-size: 1.15rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: var(--shadow-md);
}
.fab:hover { transform: translateY(-2px) scale(1.06); border-color: var(--lime); color: var(--lime); }
.fab-chat.active, .fab-emoji.active {
  background: var(--lime); color: var(--ink); border-color: var(--lime);
}

/* ── Emoji popover ── */
.emoji-popover {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 1.25rem;
  padding-bottom: 15rem;
  background: rgba(6, 9, 13, 0.55);
  backdrop-filter: blur(4px);
}
.emoji-pop-card {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md), 0 0 60px rgba(0,0,0,0.5);
  width: 340px;
  max-width: calc(100vw - 2.5rem);
}
.emoji-pop-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1.1rem;
  border-bottom: 1px solid var(--line);
}
.pop-close {
  background: var(--ink-soft);
  border: 1px solid var(--line);
  color: var(--cream-dim);
  width: 28px; height: 28px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.8rem;
}
.pop-close:hover { color: var(--coral); border-color: var(--coral); }
.emoji-pop-grid {
  padding: 1rem;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}
.emoji-pop-btn {
  aspect-ratio: 1;
  background: var(--ink-soft);
  border: 1px solid var(--line);
  color: var(--cream);
  font-size: 1.6rem;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
  display: flex; align-items: center; justify-content: center;
}
.emoji-pop-btn:hover { transform: translateY(-2px) scale(1.1); border-color: var(--ice); background: var(--panel-raised); }

.pop-enter-active, .pop-leave-active { transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); }
.pop-enter-from, .pop-leave-to { opacity: 0; transform: translateY(20px) scale(0.95); }

/* ── Chat drawer ── */
.chat-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(6, 9, 13, 0.55);
  backdrop-filter: blur(4px);
  z-index: 70;
}
.chat-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(420px, 100vw);
  background: var(--panel);
  border-left: 1px solid var(--line);
  box-shadow: -12px 0 40px rgba(0,0,0,0.5);
  z-index: 75;
  display: flex;
  flex-direction: column;
}
.chat-drawer-head {
  padding: 0.85rem 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--line);
  flex-shrink: 0;
  min-height: 56px;
}
.chat-drawer-close {
  background: var(--ink-soft);
  border: 1px solid var(--line);
  color: var(--cream-dim);
  width: 30px;
  height: 30px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.85rem;
}
.chat-drawer-close:hover { color: var(--coral); border-color: var(--coral); }
.chat-drawer-body { flex: 1; overflow: hidden; display: flex; flex-direction: column; }

.chat-fade-enter-active, .chat-fade-leave-active { transition: opacity 0.25s; }
.chat-fade-enter-from, .chat-fade-leave-to { opacity: 0; }
.chat-slide-enter-active, .chat-slide-leave-active { transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.chat-slide-enter-from, .chat-slide-leave-to { transform: translateX(100%); }

/* ── Mobile ── */
@media (max-width: 640px) {
  .board { padding: 1rem 0.75rem 1rem; }
  .players { gap: 0.5rem; }
  .fab-stack { right: 1rem; bottom: 11rem; gap: 0.5rem; }
  .fab-stack-lifted { bottom: 12rem; }
  .fab { width: 44px; height: 44px; font-size: 1.05rem; }
  .emoji-popover { padding: 1rem; padding-bottom: 16rem; }
  .emoji-pop-card { width: 100%; }

  .reveal-btn { padding: 0.6rem 1.1rem; font-size: 0.88rem; }

  .chat-drawer { width: 100vw; top: 0; }
}

@media (max-width: 480px) {
  .board-head { gap: 0.6rem; }
  .reveal-btn { padding: 0.55rem 0.9rem; font-size: 0.82rem; }
  .board-count { font-size: 1rem; }
}
</style>
