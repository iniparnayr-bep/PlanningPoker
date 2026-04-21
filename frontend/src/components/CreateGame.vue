<script lang="ts" setup>
import { ref } from "vue";
import { createGame } from "@/api/joinLeaveService";
import { useRouter } from "vue-router";
import { message } from 'ant-design-vue';

const router = useRouter();
const sessionName = ref('');
const playerName = ref('');
const loading = ref(false);

const handleCreate = () => {
  if (!sessionName.value.trim() || !playerName.value.trim()) {
    message.error('Fill in both fields first.');
    return;
  }
  loading.value = true;
  createGame(sessionName.value, playerName.value)
    .then((token) => router.push('/game/' + token))
    .catch(() => {
      message.error('Could not reach the backend.');
      loading.value = false;
    });
};
</script>

<template>
  <div class="form">
    <label class="field">
      <span class="label-xs">Session name</span>
      <input v-model="sessionName" type="text" placeholder="Sprint 42 · Pricing squad" @keydown.enter="handleCreate" />
    </label>
    <label class="field">
      <span class="label-xs">Your name</span>
      <input v-model="playerName" type="text" placeholder="Ryan" @keydown.enter="handleCreate" />
    </label>
    <button class="btn-primary" @click="handleCreate" :disabled="loading">
      <span v-if="!loading">Deal the cards →</span>
      <span v-else>Dealing…</span>
    </button>
  </div>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
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
.field input::placeholder { color: var(--muted); }
.field input:focus {
  border-color: var(--lime);
  box-shadow: 0 0 0 3px var(--lime-dim);
  background: var(--ink);
}
.btn-primary {
  margin-top: 0.25rem;
  padding: 0.9rem 1.25rem;
  font-size: 1rem;
  font-weight: 700;
  font-family: var(--font-display);
  background: var(--lime);
  color: var(--ink);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  letter-spacing: -0.01em;
  box-shadow: 0 2px 0 rgba(0,0,0,0.35);
}
.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px var(--lime-dim), 0 0 0 1px var(--lime);
}
.btn-primary:active { transform: translateY(0); }
.btn-primary:disabled { opacity: 0.7; cursor: wait; }
</style>
