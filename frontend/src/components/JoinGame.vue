<script setup lang="ts">
import { ref } from "vue";
import { joinGame } from "@/api/joinLeaveService";
import { useRouter } from "vue-router";
import { message } from "ant-design-vue";

const props = defineProps(['gameToken']);
const router = useRouter();
const sessionToken = ref(props.gameToken ?? '');
const playerName = ref('');
const loading = ref(false);

const handleJoin = () => {
  if (!sessionToken.value.trim() || !playerName.value.trim()) {
    message.error('Enter a session token and your name.');
    return;
  }
  loading.value = true;
  joinGame(sessionToken.value, playerName.value).then(() => {
    router.push('/game/' + sessionToken.value);
  }).catch(() => {
    message.error("Couldn't join — the session may not exist.");
    loading.value = false;
  });
};
const handleSpectate = () => {
  if (!sessionToken.value.trim()) return;
  router.push('/game/' + sessionToken.value);
};
</script>

<template>
  <div class="form">
    <label class="field">
      <span class="label-xs">Session token</span>
      <input v-model="sessionToken" type="text" placeholder="e.g. rX7k2" @keydown.enter="handleJoin" class="mono" />
    </label>
    <label class="field">
      <span class="label-xs">Your name</span>
      <input v-model="playerName" type="text" placeholder="Ryan" @keydown.enter="handleJoin" />
    </label>
    <div class="actions">
      <button class="btn-primary" @click="handleJoin" :disabled="loading">
        <span v-if="!loading">Join →</span><span v-else>Joining…</span>
      </button>
      <button class="btn-ghost" @click="handleSpectate" type="button">Spectate</button>
    </div>
  </div>
</template>

<style scoped>
.form { display: flex; flex-direction: column; gap: 1.1rem; }
.field { display: flex; flex-direction: column; gap: 0.4rem; }
.field input {
  background: var(--ink-soft);
  border: 1px solid var(--line);
  color: var(--cream);
  padding: 0.85rem 1rem;
  font-size: 1rem;
  font-family: var(--font-display);
  border-radius: var(--radius-md);
  outline: none;
  transition: all 0.15s;
}
.field input.mono { font-family: var(--font-mono); letter-spacing: 0.1em; text-transform: uppercase; }
.field input::placeholder { color: var(--muted); }
.field input:focus {
  border-color: var(--lime);
  box-shadow: 0 0 0 3px var(--lime-dim);
  background: var(--ink);
}
.actions { display: flex; gap: 0.6rem; margin-top: 0.25rem; }
.btn-primary, .btn-ghost {
  padding: 0.9rem 1.25rem;
  font-size: 1rem;
  font-weight: 700;
  font-family: var(--font-display);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  letter-spacing: -0.01em;
}
.btn-primary {
  flex: 1;
  background: var(--lime);
  color: var(--ink);
  border: none;
  box-shadow: 0 2px 0 rgba(0,0,0,0.35);
}
.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px var(--lime-dim), 0 0 0 1px var(--lime);
}
.btn-primary:disabled { opacity: 0.7; cursor: wait; }
.btn-ghost {
  background: transparent;
  color: var(--cream-dim);
  border: 1px solid var(--line);
}
.btn-ghost:hover {
  color: var(--lime);
  border-color: var(--lime);
}
</style>
