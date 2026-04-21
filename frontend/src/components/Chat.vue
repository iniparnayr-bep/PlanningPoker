<script setup lang="ts">
import { SendOutlined, PictureOutlined, RobotOutlined, CalculatorOutlined } from "@ant-design/icons-vue";
import { messagesRef, postMessage } from "@/api/chatService";
import { ref, nextTick, computed, watch, useTemplateRef } from 'vue';
import sessionRef from '@/reactive/useSession';

const messageInput = ref('');
const messagesContainer = useTemplateRef<HTMLElement>('messagesContainer');

interface Command {
  command: string;
  description: string;
  icon: any;
}
const commands: Command[] = [
  { command: '/image',    description: 'Share an image URL',            icon: PictureOutlined },
  { command: '/ask',      description: 'Ask the AI a question',         icon: RobotOutlined   },
  { command: '/estimate', description: 'AI-suggested estimate',         icon: CalculatorOutlined },
];

// Map a message name to an avatar emoji by looking it up in the session players
const avatarFor = (name: string): string => {
  if (name === 'Server') return '📣';
  if (name === 'AI')     return '🤖';
  const p = sessionRef.value?.players.find(pl => pl.name === name);
  return p?.avatar || '👤';
};

function send() {
  if (!messageInput.value.trim()) return;
  let msg = messageInput.value.trim();

  // Map /image → existing /img command (backend already understands /img)
  if (msg.startsWith('/image ')) msg = '/img ' + msg.slice(7);

  // Combined stream: AI commands and standard both post as 'std' — backend routes the AI ones
  const type: 'std' | 'ai' = (msg.startsWith('/ask') || msg.startsWith('/estimate') || msg.startsWith('/estimation')) ? 'ai' : 'std';

  postMessage(msg, type);
  messageInput.value = '';
  scrollDown();
}

function pickCommand(cmd: string) {
  if (messageInput.value.startsWith('/')) {
    // replace existing command
    messageInput.value = cmd + ' ';
  } else {
    messageInput.value = cmd + ' ' + messageInput.value;
  }
  nextTick(() => document.getElementById("chatInput")?.focus());
}

function scrollDown() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
}

watch(messagesRef, scrollDown, { deep: true });

const activeCommand = computed(() => {
  const m = messageInput.value.trim();
  if (m.startsWith('/image')) return '/image';
  if (m.startsWith('/ask')) return '/ask';
  if (m.startsWith('/estimate') || m.startsWith('/estimation')) return '/estimate';
  return '';
});
</script>

<template>
  <div class="chat">
    <div class="chat-messages" ref="messagesContainer">
      <div v-if="!messagesRef.length" class="chat-empty">
        <div class="chat-empty-icon">💬</div>
        <div class="chat-empty-text">Say something — or try <code>/ask</code>.</div>
      </div>

      <div
        v-for="message in messagesRef"
        :key="message.timestamp"
        class="msg"
        :class="{ 'msg-system': message.name === 'Server', 'msg-ai': message.name === 'AI' }"
      >
        <div class="msg-avatar">{{ avatarFor(message.name) }}</div>
        <div class="msg-body">
          <div class="msg-head">
            <span class="msg-name">{{ message.name }}</span>
            <span class="msg-time mono">{{ new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</span>
          </div>
          <div class="msg-text" v-html="message.message"></div>
        </div>
      </div>
    </div>

    <div class="command-strip">
      <button
        v-for="cmd in commands"
        :key="cmd.command"
        class="cmd-chip"
        :class="{ active: activeCommand === cmd.command }"
        @click="pickCommand(cmd.command)"
        :title="cmd.description"
      >
        <component :is="cmd.icon" class="cmd-chip-icon" />
        <span class="cmd-chip-label mono">{{ cmd.command }}</span>
      </button>
    </div>

    <div class="chat-input-row">
      <textarea
        v-model="messageInput"
        id="chatInput"
        rows="1"
        placeholder="Message or / for commands"
        @keydown.enter.exact.prevent="send"
      ></textarea>
      <button class="send-btn" @click="send" :disabled="!messageInput.trim()" :class="{ ready: messageInput.trim() }">
        <SendOutlined />
      </button>
    </div>
  </div>
</template>

<style scoped>
.chat {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--panel);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1rem 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  scrollbar-width: thin;
  scrollbar-color: var(--line) transparent;
}
.chat-messages::-webkit-scrollbar { width: 4px; }
.chat-messages::-webkit-scrollbar-thumb { background: var(--line); border-radius: 2px; }

.chat-empty {
  margin: auto;
  text-align: center;
  color: var(--muted);
  padding: 2rem;
}
.chat-empty-icon { font-size: 2rem; margin-bottom: 0.5rem; opacity: 0.6; }
.chat-empty-text { font-size: 0.9rem; }
.chat-empty code {
  background: var(--ink-soft);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 0.85em;
  color: var(--lime);
}

.msg {
  display: flex;
  gap: 0.6rem;
  align-items: flex-start;
}
.msg-avatar {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--ink-soft);
  border: 1px solid var(--line);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}
.msg-body { flex: 1; min-width: 0; }
.msg-head {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 0.15rem;
}
.msg-name {
  font-weight: 700;
  color: var(--cream);
  font-size: 0.85rem;
  letter-spacing: -0.01em;
}
.msg-time { font-size: 0.68rem; color: var(--muted); }
.msg-text {
  color: var(--cream);
  font-size: 0.9rem;
  line-height: 1.45;
  word-break: break-word;
}
.msg-text :deep(img) {
  max-height: 240px;
  max-width: 100%;
  border-radius: var(--radius-md);
  border: 1px solid var(--line);
  margin-top: 0.35rem;
}

.msg-system .msg-avatar { background: var(--coral-dim); border-color: rgba(255,90,107,0.3); }
.msg-system .msg-name { color: var(--coral); }
.msg-ai .msg-avatar { background: var(--lime-dim); border-color: var(--lime); }
.msg-ai .msg-name { color: var(--lime); }

.command-strip {
  display: flex;
  gap: 0.35rem;
  padding: 0.6rem 0.9rem 0.35rem;
  overflow-x: auto;
  scrollbar-width: none;
  border-top: 1px solid var(--line);
}
.command-strip::-webkit-scrollbar { display: none; }

.cmd-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.75rem;
  background: var(--ink-soft);
  border: 1px solid var(--line);
  color: var(--cream-dim);
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.78rem;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 0.15s;
  font-family: var(--font-mono);
}
.cmd-chip-icon { font-size: 0.85rem; }
.cmd-chip:hover { border-color: var(--lime); color: var(--lime); }
.cmd-chip.active { background: var(--lime-dim); border-color: var(--lime); color: var(--lime); }

.chat-input-row {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem 0.9rem 0.9rem;
  align-items: flex-end;
}
textarea {
  flex: 1;
  background: var(--ink-soft);
  border: 1px solid var(--line);
  color: var(--cream);
  padding: 0.65rem 0.85rem;
  border-radius: var(--radius-md);
  font-family: var(--font-display);
  font-size: 0.92rem;
  resize: none;
  outline: none;
  max-height: 120px;
  min-height: 42px;
  line-height: 1.4;
  transition: border-color 0.15s;
}
textarea::placeholder { color: var(--muted); }
textarea:focus { border-color: var(--lime); box-shadow: 0 0 0 3px var(--lime-dim); }

.send-btn {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-md);
  background: var(--panel-raised);
  border: 1px solid var(--line);
  color: var(--muted);
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
  flex-shrink: 0;
}
.send-btn:disabled { cursor: not-allowed; }
.send-btn.ready {
  background: var(--lime);
  color: var(--ink);
  border-color: var(--lime);
  box-shadow: 0 0 0 1px var(--lime);
}
.send-btn.ready:hover { transform: scale(1.05); }
</style>
