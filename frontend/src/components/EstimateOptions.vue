<script setup lang="ts">
import { ref } from "vue";
import Card from "@/components/Card.vue";
import { estimate } from "@/api/actionsService";

const props = defineProps(['hide', 'estimationOptions']);
const selected = ref<string | null>(null);
const resetSelection = () => { selected.value = null; };
defineExpose({ resetSelection });

const choose = (option: any) => {
  estimate(option).then(() => { selected.value = option; });
};
</script>

<template>
  <div class="dock" :class="{ 'dock-hidden': props.hide }">
    <div class="dock-inner">
      <span class="label-xs dock-label">Pick your card</span>
      <div class="dock-cards">
        <Card
          v-for="option in estimationOptions"
          :key="option"
          :estimate="option"
          clickable="true"
          :selected="selected === option"
          @click="choose(option)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.dock {
  position: fixed;
  left: 0; right: 0; bottom: 0;
  padding: 0.75rem 1rem 1rem;
  background: linear-gradient(180deg, transparent, var(--ink-deep) 25%);
  backdrop-filter: blur(12px);
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 30;
}
.dock-hidden { transform: translateY(120%); }

.dock-inner {
  max-width: 1100px;
  margin: 0 auto;
  background: rgba(17, 22, 29, 0.9);
  border: 1px solid var(--line);
  border-radius: var(--radius-xl);
  padding: 0.85rem 1rem 1rem;
  box-shadow: 0 -10px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(212, 255, 58, 0.08);
}

.dock-label {
  display: block;
  text-align: center;
  color: var(--muted);
  margin-bottom: 0.7rem;
}

.dock-cards {
  display: flex;
  gap: 0.6rem;
  overflow-x: auto;
  scrollbar-width: none;
  padding: 0.5rem 0.25rem 0.75rem;
  justify-content: center;
}
.dock-cards::-webkit-scrollbar { display: none; }

@media (max-width: 640px) {
  .dock-cards { justify-content: flex-start; padding-left: 0.5rem; }
  .dock { padding: 0.5rem 0.5rem 0.75rem; }
  .dock-inner { padding: 0.7rem 0.5rem 0.8rem; border-radius: var(--radius-lg); }
}
</style>
