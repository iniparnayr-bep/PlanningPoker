<script setup lang="ts">
import sessionRef from "@/reactive/useSession";
import userRef from "@/reactive/useUser";
import { UserOutlined, SettingOutlined, EditOutlined } from "@ant-design/icons-vue";
import SettingsDrawer from "@/components/SettingsDrawer.vue";
import RenameSelfDialog from "@/components/RenameSelfDialog.vue";
import { ref, watch } from 'vue';

const settingsOpen = ref(false);
const renameSelfOpen = ref(false);

// Apply session-wide color to <body> whenever it changes
watch(
  () => sessionRef.value?.color,
  (c) => { if (c) document.body.className = c; },
  { immediate: true }
);
</script>

<template>
  <header class="topbar">
    <div class="tb-left">
      <div class="session-block">
        <span class="label-xs">Session</span>
        <h2 v-if="sessionRef" class="session-title">{{ sessionRef.name }}</h2>
      </div>
    </div>

    <div class="tb-right">
      <button
        v-if="userRef"
        class="who who-btn"
        @click="renameSelfOpen = true"
        :title="'Click to change your name'"
      >
        <UserOutlined />
        <span class="who-name">{{ userRef.name }}</span>
        <EditOutlined class="who-edit" />
        <span v-if="userRef.isOwner" class="owner-pill label-xs">host</span>
      </button>
      <div v-else class="who who-spectator">
        <UserOutlined />
        <span class="who-name">Spectator</span>
      </div>
      <button class="settings-btn" @click="settingsOpen = true" aria-label="Open settings">
        <SettingOutlined />
      </button>
    </div>
  </header>

  <SettingsDrawer :open="settingsOpen" @close="settingsOpen = false" />
  <RenameSelfDialog :open="renameSelfOpen" @close="renameSelfOpen = false" />
</template>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.9rem 1.25rem;
  background: linear-gradient(180deg, var(--panel) 0%, var(--ink) 100%);
  border-bottom: 1px solid var(--line);
  position: sticky;
  top: 0;
  z-index: 40;
  min-height: 64px;
}

.tb-left { display: flex; align-items: center; gap: 1rem; min-width: 0; flex: 1; }
.session-block { display: flex; flex-direction: column; min-width: 0; }
.session-title {
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--cream);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 16rem;
}

.tb-right { display: flex; align-items: center; gap: 0.6rem; flex-shrink: 0; }

.who {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.85rem;
  background: var(--ink-soft);
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--cream);
  font-size: 0.88rem;
  font-weight: 600;
  font-family: var(--font-display);
}
.who-btn {
  cursor: pointer;
  transition: all 0.15s;
}
.who-btn:hover {
  border-color: var(--lime);
  color: var(--lime);
  transform: translateY(-1px);
}
.who-edit {
  font-size: 0.7rem;
  opacity: 0.5;
  margin-left: -0.15rem;
}
.who-btn:hover .who-edit { opacity: 1; }
.who-spectator { color: var(--muted); }
.who-name { letter-spacing: -0.01em; max-width: 8rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.owner-pill {
  background: var(--lime);
  color: var(--ink);
  padding: 2px 7px;
  border-radius: 999px;
  letter-spacing: 0.08em;
  font-size: 0.6rem;
}

.settings-btn {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  background: var(--ink-soft);
  border: 1px solid var(--line);
  color: var(--cream-dim);
  cursor: pointer;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.settings-btn:hover {
  color: var(--lime);
  border-color: var(--lime);
  transform: rotate(60deg);
}

@media (max-width: 480px) {
  .topbar { padding: 0.75rem 0.85rem; }
  .session-title { max-width: 7rem; font-size: 1rem; }
  .who-name { max-width: 4.5rem; font-size: 0.82rem; }
  .settings-btn { width: 36px; height: 36px; font-size: 1rem; }
}
</style>
