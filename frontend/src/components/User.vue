<script setup lang="ts">
import Card from "@/components/Card.vue";
import reactiveUser from "@/reactive/useUser";
import { kickPlayer, makeOtherPlayerAdmin, shake, throwEmoji, paperThrowSubject } from "@/api/actionsService";
import { rainEmoji } from "@/api/emojiRainService";
import { onMounted, onUnmounted, ref, computed } from "vue";
import { Subject, takeUntil } from "rxjs";
import sessionRef from "@/reactive/useSession";
import ThrowItem from "@/components/ThrowItem.vue";
import { message } from "ant-design-vue";

const props = defineProps<{
  username: string,
  estimate: string | number | null,
  id: string,
  avatar?: string,
}>();

const sheetOpen = ref(false);
const actionCooldown = ref(false);
const throwItems = ref<{ id: number, emoji: string }[]>([]);
const unsubscribe = new Subject<void>();

// Custom emojis (localStorage)
const customIcons = ref<string[]>(JSON.parse(localStorage.getItem('emojis') || '[]'));
const newEmoji = ref('');

const isSelf = computed(() => reactiveUser.value?.id === props.id);
const hasEstimate = computed(() => props.estimate !== null);
const emojisEnabled = computed(() => sessionRef.value?.emojisEnabled !== false);

// Defaults
const defaultEmojis = ['🚀', '🎉', '🔥', '❤️', '👍', '👎', '🤣', '💀', '🎱', '🍕', '🫶', '💩'];
const rainPresets    = ['🎉', '🔥', '💰', '🌧️', '🍀', '💜', '⭐', '💸'];

onMounted(() => {
  paperThrowSubject.pipe(takeUntil(unsubscribe)).subscribe((data) => {
    if (data.id !== props.id) return;
    if (!emojisEnabled.value) return;  // honor room setting
    if (data.emoji?.startsWith('🌧')) {
      rainEmoji(data.emoji.slice(1), { count: 45, durationMs: 3800 });
    } else {
      triggerThrowAnim(data.emoji);
    }
  });
});
onUnmounted(() => { unsubscribe.complete(); });

const triggerCooldown = () => {
  actionCooldown.value = true;
  setTimeout(() => actionCooldown.value = false, 4500);
};

const triggerThrowAnim = (emoji: string) => {
  throwItems.value.push({ id: Math.floor(Math.random() * 9999999), emoji });
  setTimeout(() => throwItems.value.shift(), 1100);
};

const openSheet = () => {
  if (isSelf.value) return;
  sheetOpen.value = true;
};
const closeSheet = () => { sheetOpen.value = false; };

const handleShake = () => {
  shake(props.id);
  triggerCooldown();
  closeSheet();
};

const handleThrow = (emoji: string) => {
  throwEmoji(props.id, emoji);
  closeSheet();
};

const handleRain = (emoji: string) => {
  // Everyone sees the rain (local only for the sender; server broadcast below mirrors to others)
  rainEmoji(emoji, { count: 45, durationMs: 3800 });
  // Piggy-back on throwEmoji with a special marker so other clients can rain too
  throwEmoji(props.id, '🌧' + emoji);
  closeSheet();
};

const handleAddEmoji = () => {
  const emoji = newEmoji.value.trim();
  if (!emoji) { message.error('Empty emoji'); return; }
  if (customIcons.value.includes(emoji)) { message.error('Already in your set'); return; }
  customIcons.value.push(emoji);
  localStorage.setItem('emojis', JSON.stringify(customIcons.value));
  newEmoji.value = '';
};
const handleResetCustom = () => {
  customIcons.value = [];
  localStorage.removeItem('emojis');
};

const handleKick = () => { kickPlayer(props.id); closeSheet(); };
const handlePromote = () => { makeOtherPlayerAdmin(props.id); closeSheet(); };
</script>

<template>
  <div class="user-tile" :class="{ 'is-self': isSelf, 'is-ready': hasEstimate }" @click="openSheet">
    <div class="user-avatar-badge" v-if="avatar">{{ avatar }}</div>
    <div class="user-card-wrap">
      <Card :estimate="estimate" />
      <ThrowItem v-for="data in throwItems" :key="data.id" :ballid="'ball' + data.id" :emoji="data.emoji" />
    </div>
    <div class="user-name">
      <span class="user-name-text">{{ username }}</span>
      <span v-if="isSelf" class="user-self-pill label-xs">you</span>
    </div>
    <div class="user-status">
      <span v-if="hasEstimate" class="status status-ready label-xs">
        <span class="status-dot"></span> ready
      </span>
      <span v-else class="status status-waiting label-xs">
        <span class="status-dot"></span> thinking
      </span>
    </div>

    <!-- ── Bottom sheet for actions ── -->
    <Teleport to="body">
      <transition name="sheet-fade">
        <div v-if="sheetOpen" class="sheet-backdrop" @click.self="closeSheet">
          <transition name="sheet-slide">
            <div v-if="sheetOpen" class="sheet" @click.stop>
              <div class="sheet-handle"></div>
              <div class="sheet-head">
                <h3 class="sheet-title">{{ username }}</h3>
                <button class="sheet-close" @click="closeSheet" aria-label="Close">✕</button>
              </div>

              <template v-if="emojisEnabled">
                <div class="sheet-section">
                  <span class="label-xs">Throw at {{ username }}</span>
                  <div class="emoji-grid">
                    <button v-for="e in defaultEmojis" :key="'t'+e" class="emoji-btn" @click="handleThrow(e)">{{ e }}</button>
                    <button v-for="e in customIcons" :key="'tc'+e" class="emoji-btn custom" @click="handleThrow(e)">{{ e }}</button>
                  </div>
                </div>

                <div class="sheet-section">
                  <span class="label-xs">Make it rain 🌧</span>
                  <div class="emoji-grid">
                    <button v-for="e in rainPresets" :key="'r'+e" class="emoji-btn rain" @click="handleRain(e)">{{ e }}</button>
                  </div>
                </div>

                <div class="sheet-section">
                  <span class="label-xs">Custom emojis</span>
                  <div class="add-custom">
                    <input v-model="newEmoji" type="text" maxlength="4" placeholder="🫨" @keydown.enter="handleAddEmoji" />
                    <button class="btn-add" @click="handleAddEmoji">Add</button>
                    <button v-if="customIcons.length" class="btn-reset" @click="handleResetCustom">Reset</button>
                  </div>
                </div>
              </template>
              <div v-else class="emojis-disabled-note">
                The host has disabled emoji throwing for this room.
              </div>

              <div class="sheet-actions">
                <button class="action-btn" @click="handleShake" :disabled="actionCooldown">
                  ✋ Shake their screen
                </button>
                <template v-if="reactiveUser?.isOwner">
                  <button class="action-btn action-warn" @click="handlePromote">
                    👑 Make admin
                  </button>
                  <button class="action-btn action-danger" @click="handleKick">
                    🚪 Kick
                  </button>
                </template>
              </div>
            </div>
          </transition>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<style scoped>
.user-tile {
  user-select: none;
  width: 9rem;
  min-height: 10rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 0.5rem;
  padding: 0.5rem 0.5rem 0.5rem;
  padding-top: 1.75rem;
  border-radius: var(--radius-lg);
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
}
.user-avatar-badge {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translate(-50%, -10%);
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--panel-raised);
  border: 2px solid var(--ink);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.4);
  z-index: 2;
}
.user-tile:not(.is-self) { cursor: pointer; }
.user-tile:not(.is-self):hover {
  background: rgba(255,255,255,0.03);
  transform: translateY(-3px);
}
.is-self {
  background: linear-gradient(180deg, rgba(212, 255, 58, 0.08), transparent);
  border: 1px solid rgba(212, 255, 58, 0.15);
}

.user-card-wrap { position: relative; padding-top: 0.25rem; }

.is-ready .card {
  animation: ready-glow 2s ease-in-out infinite;
}
@keyframes ready-glow {
  0%,100% { box-shadow: 0 1px 0 rgba(255,255,255,0.06) inset, 0 4px 12px rgba(0,0,0,0.5); }
  50% { box-shadow: 0 1px 0 rgba(255,255,255,0.06) inset, 0 4px 18px var(--lime-dim), 0 0 0 1px var(--lime); }
}

.user-name {
  margin-top: 0.35rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  max-width: 100%;
}
.user-name-text {
  font-weight: 600;
  color: var(--cream);
  font-size: 0.95rem;
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 7.5rem;
}
.user-self-pill {
  background: var(--lime);
  color: var(--ink);
  padding: 2px 6px;
  border-radius: 999px;
  letter-spacing: 0.08em;
  font-size: 0.62rem;
}

.user-status { margin-top: 0.1rem; }
.status { display: inline-flex; align-items: center; gap: 0.4rem; }
.status-dot { width: 6px; height: 6px; border-radius: 50%; }
.status-ready { color: var(--lime); }
.status-ready .status-dot { background: var(--lime); box-shadow: 0 0 8px var(--lime); }
.status-waiting { color: var(--muted); }
.status-waiting .status-dot { background: var(--muted); animation: pulse-dot 1.5s ease-in-out infinite; }
@keyframes pulse-dot { 50% { opacity: 0.3; } }

/* ── Bottom sheet ── */
.sheet-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(6, 9, 13, 0.75);
  backdrop-filter: blur(6px);
  z-index: 200;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.sheet {
  width: 100%;
  max-width: 520px;
  background: var(--panel);
  border: 1px solid var(--line);
  border-bottom: none;
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  padding: 0.75rem 1.25rem 2rem;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 -20px 60px rgba(0,0,0,0.5);
}
.sheet-handle {
  width: 40px; height: 4px;
  background: var(--muted);
  border-radius: 2px;
  margin: 0 auto 1rem;
  opacity: 0.5;
}
.sheet-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}
.sheet-title {
  font-size: 1.4rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--cream);
}
.sheet-close {
  background: var(--ink-soft);
  border: 1px solid var(--line);
  color: var(--cream-dim);
  width: 32px; height: 32px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.15s;
}
.sheet-close:hover { color: var(--coral); border-color: var(--coral); }

.sheet-section { margin-bottom: 1.25rem; }
.sheet-section .label-xs { display: block; margin-bottom: 0.6rem; }
.emojis-disabled-note {
  padding: 1rem 1.1rem;
  background: var(--ink-soft);
  border: 1px dashed var(--line);
  border-radius: var(--radius-md);
  color: var(--muted);
  font-size: 0.88rem;
  text-align: center;
  margin-bottom: 1.25rem;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.4rem;
}
.emoji-btn {
  aspect-ratio: 1;
  background: var(--ink-soft);
  border: 1px solid var(--line);
  color: var(--cream);
  font-size: 1.5rem;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
  display: flex;
  align-items: center;
  justify-content: center;
}
.emoji-btn:hover {
  transform: translateY(-2px) scale(1.1);
  border-color: var(--lime);
  background: var(--panel-raised);
}
.emoji-btn.rain:hover { border-color: var(--ice); }
.emoji-btn.custom { border-color: rgba(183, 148, 255, 0.3); }

.add-custom { display: flex; gap: 0.5rem; }
.add-custom input {
  flex: 1;
  background: var(--ink-soft);
  border: 1px solid var(--line);
  color: var(--cream);
  padding: 0.6rem 0.85rem;
  border-radius: var(--radius-md);
  font-size: 1rem;
  outline: none;
}
.add-custom input:focus { border-color: var(--lime); }
.btn-add, .btn-reset {
  padding: 0.6rem 0.9rem;
  background: var(--panel-raised);
  border: 1px solid var(--line);
  color: var(--cream);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 600;
  font-family: var(--font-display);
  transition: all 0.15s;
}
.btn-add:hover { border-color: var(--lime); color: var(--lime); }
.btn-reset:hover { border-color: var(--coral); color: var(--coral); }

.sheet-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid var(--line);
}
.action-btn {
  padding: 0.85rem 1rem;
  background: var(--ink-soft);
  border: 1px solid var(--line);
  color: var(--cream);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  font-family: var(--font-display);
  text-align: left;
  transition: all 0.15s;
}
.action-btn:hover:not(:disabled) { border-color: var(--lime); color: var(--lime); }
.action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.action-warn:hover { border-color: var(--marigold) !important; color: var(--marigold) !important; }
.action-danger:hover { border-color: var(--coral) !important; color: var(--coral) !important; }

/* ── Sheet transitions ── */
.sheet-fade-enter-active, .sheet-fade-leave-active { transition: opacity 0.25s; }
.sheet-fade-enter-from, .sheet-fade-leave-to { opacity: 0; }
.sheet-slide-enter-active, .sheet-slide-leave-active { transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.sheet-slide-enter-from, .sheet-slide-leave-to { transform: translateY(100%); }

@media (max-width: 480px) {
  .user-tile { width: 7rem; min-height: 9rem; }
  .user-name-text { max-width: 5.5rem; font-size: 0.88rem; }
  .emoji-grid { grid-template-columns: repeat(5, 1fr); }
  .emoji-btn { font-size: 1.35rem; }
}
</style>
