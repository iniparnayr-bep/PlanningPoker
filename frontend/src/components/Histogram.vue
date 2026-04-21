<script setup lang="ts">
import type { EstimationHistogram } from '@/models/EstimationHistogram';
import type { PropType } from "vue";
import { computed } from 'vue';

const props = defineProps({
  data: { type: Object as PropType<EstimationHistogram>, required: true },
  hide: { type: Boolean, default: true },
});

const entries = computed(() => {
  const counts = props.data?.estimationCount ?? {};
  return Object.entries(counts).map(([key, count]) => ({ key, count: count as number }));
});

const maxCount = computed(() => {
  const vals = entries.value.map(e => e.count);
  return vals.length ? Math.max(...vals) : 1;
});

const heightPct = (count: number) => {
  return `${(count / maxCount.value) * 100}%`;
};
</script>

<template>
  <div class="histogram" :class="{ 'histogram-hidden': props.hide }" v-if="entries.length">
    <div class="histogram-head">
      <span class="label-xs">Spread</span>
      <span class="histogram-total label-xs">{{ entries.reduce((s, e) => s + e.count, 0) }} votes</span>
    </div>
    <div class="histogram-bars">
      <div v-for="entry in entries" :key="entry.key" class="bar-col">
        <div class="bar-wrap">
          <div class="bar-count mono">{{ entry.count }}</div>
          <div class="bar" :style="{ height: heightPct(entry.count) }"></div>
        </div>
        <span class="bar-label mono">{{ entry.key }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.histogram {
  position: fixed;
  left: 50%;
  bottom: 9rem;
  transform: translateX(-50%);
  width: min(90vw, 640px);
  background: rgba(22, 28, 37, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  padding: 1rem 1.25rem;
  box-shadow: var(--shadow-md);
  transition: opacity 0.4s, transform 0.4s;
  z-index: 20;
}
.histogram-hidden {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
  pointer-events: none;
}

.histogram-head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.8rem;
}
.histogram-total { color: var(--lime); }

.histogram-bars {
  display: flex;
  gap: 0.6rem;
  align-items: flex-end;
  height: 120px;
}

.bar-col {
  flex: 1;
  min-width: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.45rem;
  height: 100%;
}

.bar-wrap {
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  gap: 0.3rem;
  position: relative;
}

.bar-count {
  font-size: 0.7rem;
  color: var(--cream-dim);
  font-weight: 600;
}

.bar {
  width: 100%;
  min-height: 4px;
  border-radius: 4px 4px 2px 2px;
  background: linear-gradient(180deg, var(--lime) 0%, rgba(212,255,58,0.6) 100%);
  transition: height 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 -4px 16px var(--lime-dim);
}

.bar-label {
  font-size: 0.75rem;
  color: var(--cream);
  font-weight: 600;
}

@media (max-width: 640px) {
  .histogram {
    bottom: 10.5rem;
    padding: 0.75rem 0.9rem;
  }
  .histogram-bars { height: 90px; gap: 0.35rem; }
  .bar-col { min-width: 1.5rem; }
}
</style>
