<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import sessionRef from '@/reactive/useSession';
import userRef from '@/reactive/useUser';
import { renameSelf } from '@/api/actionsService';
import { leaveGame, exitSpectateGame } from '@/api/joinLeaveService';
import { message } from 'ant-design-vue';
import { LogoutOutlined } from '@ant-design/icons-vue';

const props = defineProps<{ open: boolean }>();
const emit  = defineEmits<{ (e: 'close'): void }>();

const router = useRouter();

const draft   = ref('');
const avatar  = ref('');
const saving  = ref(false);
const leaving = ref(false);
const inputEl = ref<HTMLInputElement | null>(null);

const avatarOptions = [
  '🦊','🐯','🦁','🐼','🐻','🐨','🐾','🦖',
  '🐙','🦀','🐬','🐠','🐧','🦆','🦉','🐔',
  '🦄','🐉','🐲','🐳','🐍','🐢','🦎','🦝',
  '🐝','🐞','🐛','🦋','🐿','👨‍🎨',
  '🚀','⭐','🌈','🔥','❄️','⚡','🌊','🌺',
];

const takenNames = computed(() => {
  if (!sessionRef.value || !userRef.value) return new Set<string>();
  return new Set(
    sessionRef.value.players
      .filter(p => p.id !== userRef.value?.id)
      .map(p => p.name)
  );
});

const trimmed     = computed(() => draft.value.trim());
const isDuplicate = computed(() => trimmed.value.length > 0 && takenNames.value.has(trimmed.value));
const isTooLong   = computed(() => draft.value.length > 50);
const isEmpty     = computed(() => trimmed.value.length === 0);

const nameChanged   = computed(() => trimmed.value !== userRef.value?.name);
const avatarChanged = computed(() => avatar.value !== (userRef.value?.avatar ?? ''));
const hasChanges    = computed(() => nameChanged.value || avatarChanged.value);

const validationMessage = computed(() => {
  if (isTooLong.value)   return 'Max 50 characters.';
  if (isDuplicate.value) return 'That name is already taken in this room.';
  return '';
});

const canSave = computed(() =>
  !saving.value && !isEmpty.value && !isTooLong.value && !isDuplicate.value && hasChanges.value
);

watch(() => props.open, async (isOpen) => {
  if (isOpen) {
    draft.value  = userRef.value?.name ?? '';
    avatar.value = userRef.value?.avatar ?? '';
    await nextTick();
    inputEl.value?.focus();
    inputEl.value?.select();
  }
});

async function commit() {
  if (!canSave.value) return;
  saving.value = true;
  try {
    const payload: any = {};
    if (nameChanged.value) payload.name = trimmed.value;
    if (avatarChanged.value) payload.avatar = avatar.value;
    await renameSelf(payload);
    message.success('Profile updated.');
    emit('close');
  } catch (e: any) {
    const status = e?.response?.status;
    if (status === 409)      message.error('That name is already taken.');
    else if (status === 400) message.error(e.response?.data || 'Invalid input.');
    else                     message.error('Could not update profile.');
  } finally {
    saving.value = false;
  }
}

function cancel() { emit('close'); }

async function handleLeave() {
  leaving.value = true;
  try {
    if (userRef.value && sessionRef.value) {
      await leaveGame(sessionRef.value.token, userRef.value.token);
    } else {
      await exitSpectateGame();
    }
    router.push('/');
  } catch {
    message.error('Could not leave session.');
  } finally {
    leaving.value = false;
  }
}
</script>

<template>
  <Teleport to="body">
    <transition name="fade">
      <div v-if="open" class="dialog-backdrop" @click.self="cancel">
        <transition name="pop">
          <div v-if="open" class="dialog" @click.stop>
            <div class="dialog-head">
              <span class="label-xs">Your profile</span>
              <h3 class="dialog-title">Who are you?</h3>
            </div>

            <div class="dialog-body">
              <!-- Avatar -->
              <div class="avatar-preview">
                <div class="avatar-current">
                  <span class="avatar-emoji">{{ avatar || '👤' }}</span>
                </div>
                <div class="avatar-hint label-xs">Pick an avatar</div>
              </div>

              <div class="avatar-grid">
                <button
                  v-for="e in avatarOptions"
                  :key="e"
                  class="avatar-tile"
                  :class="{ active: avatar === e }"
                  :title="e"
                  @click="avatar = e"
                >{{ e }}</button>
              </div>

              <!-- Name -->
              <div class="field">
                <label class="label-xs">Display name</label>
                <input
                  ref="inputEl"
                  v-model="draft"
                  type="text"
                  maxlength="50"
                  placeholder="Pick a name"
                  :class="{ 'has-error': (isDuplicate || isTooLong) && !isEmpty }"
                  @keydown.enter="commit"
                  @keydown.escape="cancel"
                />
                <div class="field-footer">
                  <span class="field-error" v-if="validationMessage">{{ validationMessage }}</span>
                  <span class="field-count mono" :class="{ 'over': isTooLong }">{{ draft.length }}/50</span>
                </div>
              </div>
            </div>

            <div class="dialog-actions">
              <button class="btn-danger" @click="handleLeave" :disabled="leaving">
                <LogoutOutlined /> {{ leaving ? 'Leaving…' : 'Leave session' }}
              </button>
              <div class="dialog-actions-right">
                <button class="btn-ghost" @click="cancel">Cancel</button>
                <button class="btn-primary" @click="commit" :disabled="!canSave">
                  {{ saving ? 'Saving…' : 'Save' }}
                </button>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
.dialog-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(6, 9, 13, 0.7);
  backdrop-filter: blur(6px);
  z-index: 90;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}
.dialog {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md), 0 0 60px rgba(0,0,0,0.5);
  width: 100%;
  max-width: 460px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-height: 90vh;
}
.dialog-head { padding: 1.25rem 1.4rem 0.75rem; flex-shrink: 0; }
.dialog-title {
  margin-top: 0.3rem;
  font-size: 1.65rem;
  font-weight: 800;
  letter-spacing: -0.025em;
  font-variation-settings: 'opsz' 48;
  color: var(--cream);
}
.dialog-body {
  padding: 0.4rem 1.4rem 0.6rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow-y: auto;
}

/* Avatar */
.avatar-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
}
.avatar-current {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(155deg, var(--panel-raised), var(--ink-soft));
  border: 1px solid var(--line);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.4rem;
  box-shadow: 0 0 0 1px var(--lime), 0 0 20px var(--lime-dim);
}
.avatar-emoji { line-height: 1; }
.avatar-hint { color: var(--muted); }

.avatar-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 0.35rem;
}
.avatar-tile {
  aspect-ratio: 1;
  font-size: 1.4rem;
  background: var(--ink-soft);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: inherit;
  transition: all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.avatar-tile:hover { transform: translateY(-2px) scale(1.1); border-color: var(--cream-dim); }
.avatar-tile.active {
  border-color: var(--lime);
  background: var(--lime-dim);
  box-shadow: 0 0 0 1px var(--lime);
}

/* Field */
.field { display: flex; flex-direction: column; gap: 0.4rem; }
.field input {
  background: var(--ink-soft);
  border: 1px solid var(--line);
  color: var(--cream);
  padding: 0.75rem 0.9rem;
  border-radius: var(--radius-md);
  font-family: var(--font-display);
  font-size: 1rem;
  outline: none;
  transition: all 0.15s;
}
.field input::placeholder { color: var(--muted); }
.field input:focus { border-color: var(--lime); box-shadow: 0 0 0 3px var(--lime-dim); }
.field input.has-error { border-color: var(--coral); box-shadow: 0 0 0 3px var(--coral-dim); }

.field-footer {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  min-height: 1rem;
}
.field-error { color: var(--coral); }
.field-count { color: var(--muted); }
.field-count.over { color: var(--coral); }

/* Actions */
.dialog-actions {
  display: flex;
  gap: 0.5rem;
  padding: 1rem 1.4rem 1.25rem;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid var(--line);
  margin-top: 0.5rem;
  background: var(--ink-soft);
  flex-shrink: 0;
  flex-wrap: wrap;
}
.dialog-actions-right { display: flex; gap: 0.5rem; }

.btn-primary, .btn-ghost, .btn-danger {
  padding: 0.65rem 1.1rem;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.9rem;
  letter-spacing: -0.01em;
  transition: all 0.15s;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}
.btn-primary { background: var(--lime); color: var(--ink); border: none; box-shadow: 0 2px 0 rgba(0,0,0,0.3); }
.btn-primary:hover:not(:disabled) { transform: translateY(-1px); }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-ghost { background: transparent; color: var(--cream-dim); border: 1px solid var(--line); }
.btn-ghost:hover { color: var(--cream); border-color: var(--cream-dim); }

.btn-danger {
  background: transparent;
  color: var(--coral);
  border: 1px solid rgba(255, 90, 107, 0.35);
}
.btn-danger:hover:not(:disabled) { background: var(--coral-dim); border-color: var(--coral); }
.btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.pop-enter-active, .pop-leave-active { transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); }
.pop-enter-from, .pop-leave-to { opacity: 0; transform: scale(0.94) translateY(10px); }

@media (max-width: 480px) {
  .avatar-grid { grid-template-columns: repeat(6, 1fr); }
  .dialog-actions { padding: 0.85rem 1rem; }
  .btn-primary, .btn-ghost, .btn-danger { font-size: 0.82rem; padding: 0.55rem 0.9rem; }
}
</style>
