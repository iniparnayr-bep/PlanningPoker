<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import sessionRef from '@/reactive/useSession';
import userRef from '@/reactive/useUser';
import { EstimationOption, parseEstimationType } from '@/models/Session.model';
import {
  changeEstimationType, setSessionColor, setSessionEmojisEnabled, renameSession
} from '@/api/actionsService';
import { message } from 'ant-design-vue';

const props = defineProps<{ open: boolean }>();
const emit   = defineEmits<{ (e: 'close'): void }>();

const isOwner = computed(() => !!userRef.value?.isOwner);

// ── Deck options ──
const deckOptions = [
  { key: EstimationOption.Fibonacci,   label: 'Fibonacci',   sample: '1 · 2 · 3 · 5 · 8 · 13' },
  { key: EstimationOption.PowersOfTwo, label: 'Powers of 2', sample: '1 · 2 · 4 · 8 · 16 · 32' },
  { key: EstimationOption.TShirtSizes, label: 'T-shirt',     sample: 'XS · S · M · L · XL'     },
  { key: EstimationOption.PersonDays,  label: 'Person-days', sample: '0.5 · 1 · 2 · 3 · 4'    },
];
const currentDeck = computed(() => sessionRef.value?.estimationOptions ?? EstimationOption.Fibonacci);

async function selectDeck(key: EstimationOption) {
  if (!isOwner.value) return;
  if (key === currentDeck.value) return;
  try {
    await changeEstimationType(key);
  } catch {
    message.error('Could not change deck.');
  }
}

// ── Color themes ──
const colorOptions = [
  { key: 'default', label: 'Neon',    swatch: '#d4ff3a' },
  { key: 'blue',    label: 'Arctic',  swatch: '#7be0ff' },
  { key: 'purple',  label: 'Violet',  swatch: '#b794ff' },
  { key: 'green',   label: 'Moss',    swatch: '#7dd87d' },
  { key: 'red',     label: 'Coral',   swatch: '#ff5a6b' },
  { key: 'gray',    label: 'Graphite', swatch: '#a8b0bd' },
  { key: 'dark',    label: 'Midnight', swatch: '#4a5668' },
];
const currentColor = computed(() => sessionRef.value?.color ?? 'default');

async function selectColor(key: string) {
  if (!isOwner.value) return;
  if (key === currentColor.value) return;
  try {
    await setSessionColor(key);
  } catch {
    message.error('Could not update color.');
  }
}

// ── Emojis toggle ──
const emojisEnabled = computed(() => sessionRef.value?.emojisEnabled !== false);
async function toggleEmojis() {
  if (!isOwner.value) return;
  try {
    await setSessionEmojisEnabled(!emojisEnabled.value);
  } catch {
    message.error('Could not toggle emojis.');
  }
}

// ── Rename ──
const renameDraft = ref('');
const renaming = ref(false);
watch(() => props.open, (isOpen) => {
  if (isOpen && sessionRef.value) renameDraft.value = sessionRef.value.name;
});
async function commitRename() {
  if (!isOwner.value) return;
  const val = renameDraft.value.trim();
  if (!val || val === sessionRef.value?.name) return;
  renaming.value = true;
  try {
    await renameSession(val);
    message.success('Session renamed.');
  } catch {
    message.error('Could not rename.');
    renameDraft.value = sessionRef.value?.name ?? '';
  } finally {
    renaming.value = false;
  }
}
</script>

<template>
  <Teleport to="body">
    <transition name="fade">
      <div v-if="open" class="drawer-backdrop" @click.self="emit('close')">
        <transition name="slide">
          <aside v-if="open" class="drawer" @click.stop>
            <header class="drawer-head">
              <div>
                <span class="label-xs">Settings</span>
                <h2 class="drawer-title">Room controls</h2>
              </div>
              <button class="drawer-close" @click="emit('close')" aria-label="Close">✕</button>
            </header>

            <div v-if="!isOwner" class="non-owner-note">
              Only the session host can change these.
            </div>

            <!-- ── Rename ── -->
            <section class="setting">
              <label class="setting-label">
                <span class="label-xs">Room name</span>
              </label>
              <div class="rename-row">
                <input
                  v-model="renameDraft"
                  type="text"
                  maxlength="60"
                  :disabled="!isOwner || renaming"
                  placeholder="Room name"
                  @keydown.enter="commitRename"
                />
                <button
                  class="btn-save"
                  :disabled="!isOwner || renaming || renameDraft.trim() === sessionRef?.name || !renameDraft.trim()"
                  @click="commitRename"
                >
                  {{ renaming ? '…' : 'Save' }}
                </button>
              </div>
            </section>

            <!-- ── Deck ── -->
            <section class="setting">
              <span class="label-xs">Deck</span>
              <div class="option-stack">
                <button
                  v-for="opt in deckOptions"
                  :key="opt.key"
                  class="option-row"
                  :class="{ active: currentDeck === opt.key, disabled: !isOwner }"
                  :disabled="!isOwner"
                  @click="selectDeck(opt.key as EstimationOption)"
                >
                  <div class="option-row-main">
                    <span class="option-row-label">{{ opt.label }}</span>
                    <span class="option-row-sample mono">{{ opt.sample }}</span>
                  </div>
                  <span v-if="currentDeck === opt.key" class="option-check">●</span>
                </button>
              </div>
            </section>

            <!-- ── Color ── -->
            <section class="setting">
              <span class="label-xs">Color theme</span>
              <div class="color-grid">
                <button
                  v-for="c in colorOptions"
                  :key="c.key"
                  class="color-tile"
                  :class="{ active: currentColor === c.key, disabled: !isOwner }"
                  :disabled="!isOwner"
                  :title="c.label"
                  @click="selectColor(c.key)"
                >
                  <span class="color-swatch" :style="{ background: c.swatch }"></span>
                  <span class="color-label">{{ c.label }}</span>
                </button>
              </div>
            </section>

            <!-- ── Emojis toggle ── -->
            <section class="setting">
              <div class="toggle-row">
                <div>
                  <div class="toggle-title">Enable emojis</div>
                  <div class="toggle-sub">Players can throw and rain emojis at each other.</div>
                </div>
                <button
                  class="switch"
                  :class="{ on: emojisEnabled, disabled: !isOwner }"
                  :disabled="!isOwner"
                  @click="toggleEmojis"
                  role="switch"
                  :aria-checked="emojisEnabled"
                >
                  <span class="switch-knob"></span>
                </button>
              </div>
            </section>
          </aside>
        </transition>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
.drawer-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(6, 9, 13, 0.6);
  backdrop-filter: blur(6px);
  z-index: 80;
  display: flex;
  justify-content: flex-end;
}

.drawer {
  width: min(420px, 100vw);
  height: 100vh;
  background: var(--panel);
  border-left: 1px solid var(--line);
  box-shadow: -12px 0 40px rgba(0,0,0,0.5);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 1.25rem 1.5rem 2rem;
  gap: 1.5rem;
}

.drawer-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}
.drawer-title {
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  font-variation-settings: 'opsz' 48;
  color: var(--cream);
  margin-top: 0.2rem;
}
.drawer-close {
  background: var(--ink-soft);
  border: 1px solid var(--line);
  color: var(--cream-dim);
  width: 32px; height: 32px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.15s;
}
.drawer-close:hover { color: var(--coral); border-color: var(--coral); }

.non-owner-note {
  padding: 0.75rem 1rem;
  background: var(--coral-dim);
  border: 1px solid rgba(255, 90, 107, 0.25);
  border-radius: var(--radius-md);
  color: var(--cream);
  font-size: 0.85rem;
}

.setting { display: flex; flex-direction: column; gap: 0.6rem; }
.setting-label { display: flex; justify-content: space-between; align-items: baseline; }

/* Rename */
.rename-row { display: flex; gap: 0.5rem; }
.rename-row input {
  flex: 1;
  background: var(--ink-soft);
  border: 1px solid var(--line);
  color: var(--cream);
  padding: 0.65rem 0.85rem;
  border-radius: var(--radius-md);
  font-family: var(--font-display);
  font-size: 0.95rem;
  outline: none;
}
.rename-row input:focus { border-color: var(--lime); box-shadow: 0 0 0 3px var(--lime-dim); }
.rename-row input:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-save {
  padding: 0 1rem;
  background: var(--lime);
  color: var(--ink);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 700;
  font-family: var(--font-display);
  font-size: 0.9rem;
  transition: all 0.15s;
}
.btn-save:hover:not(:disabled) { transform: translateY(-1px); }
.btn-save:disabled { opacity: 0.4; cursor: not-allowed; }

/* Deck option stack */
.option-stack { display: flex; flex-direction: column; gap: 0.4rem; }
.option-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 0.9rem;
  background: var(--ink-soft);
  border: 1px solid var(--line);
  color: var(--cream);
  border-radius: var(--radius-md);
  cursor: pointer;
  text-align: left;
  transition: all 0.15s;
  font-family: var(--font-display);
}
.option-row:hover:not(.disabled) { border-color: var(--lime); transform: translateX(2px); }
.option-row.active { border-color: var(--lime); background: var(--lime-dim); }
.option-row.disabled { opacity: 0.6; cursor: not-allowed; }
.option-row-main { display: flex; flex-direction: column; gap: 0.25rem; min-width: 0; }
.option-row-label { font-weight: 600; font-size: 0.95rem; letter-spacing: -0.01em; }
.option-row-sample { font-size: 0.75rem; color: var(--muted); }
.option-check { color: var(--lime); font-size: 1.1rem; }

/* Color grid */
.color-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}
.color-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: 0.7rem 0.5rem 0.55rem;
  background: var(--ink-soft);
  border: 1px solid var(--line);
  color: var(--cream-dim);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
  font-family: var(--font-display);
}
.color-tile:hover:not(.disabled) { transform: translateY(-2px); border-color: var(--cream-dim); color: var(--cream); }
.color-tile.active {
  border-color: var(--lime);
  background: var(--lime-dim);
  color: var(--cream);
  box-shadow: 0 0 0 1px var(--lime);
}
.color-tile.disabled { opacity: 0.6; cursor: not-allowed; }
.color-swatch {
  width: 28px; height: 28px;
  border-radius: 999px;
  box-shadow: 0 0 0 1px rgba(255,255,255,0.1), 0 0 12px rgba(0,0,0,0.3);
}
.color-label { font-size: 0.72rem; font-weight: 600; letter-spacing: -0.01em; }

/* Toggle */
.toggle-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 0.9rem 1rem;
  background: var(--ink-soft);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
}
.toggle-title { font-weight: 600; color: var(--cream); }
.toggle-sub { font-size: 0.78rem; color: var(--muted); margin-top: 0.15rem; line-height: 1.4; }

.switch {
  flex-shrink: 0;
  width: 48px;
  height: 28px;
  background: var(--line);
  border: none;
  border-radius: 999px;
  position: relative;
  cursor: pointer;
  transition: background 0.2s;
  padding: 0;
}
.switch:disabled { cursor: not-allowed; opacity: 0.6; }
.switch-knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: var(--cream);
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}
.switch.on { background: var(--lime); }
.switch.on .switch-knob { transform: translateX(20px); background: var(--ink); }

/* Transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.slide-enter-active, .slide-leave-active { transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.slide-enter-from, .slide-leave-to { transform: translateX(100%); }

@media (max-width: 480px) {
  .drawer { padding: 1rem 1.1rem 2rem; }
  .color-grid { grid-template-columns: repeat(3, 1fr); }
}
</style>
