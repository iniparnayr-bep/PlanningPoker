<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { emojiRainSubject } from '@/api/emojiRainService';
import { Subject, takeUntil } from 'rxjs';

interface Drop {
  id: number;
  emoji: string;
  left: number;      // vw
  delay: number;     // s
  duration: number;  // s
  size: number;      // rem
  rotate: number;    // deg
}

const drops = ref<Drop[]>([]);
const destroy$ = new Subject<void>();

let nextId = 0;

function launch(emoji: string, count: number, durationMs: number) {
  const dMax = durationMs / 1000;
  const newDrops: Drop[] = [];
  for (let i = 0; i < count; i++) {
    newDrops.push({
      id: ++nextId,
      emoji,
      left: Math.random() * 100,
      delay: Math.random() * 1.2,
      duration: 2.2 + Math.random() * 1.6,
      size: 1.4 + Math.random() * 1.8,
      rotate: (Math.random() - 0.5) * 180,
    });
  }
  drops.value.push(...newDrops);
  // Clean up after animation ends
  setTimeout(() => {
    const ids = new Set(newDrops.map(d => d.id));
    drops.value = drops.value.filter(d => !ids.has(d.id));
  }, durationMs + 1500);
}

onMounted(() => {
  emojiRainSubject.pipe(takeUntil(destroy$)).subscribe(({ emoji, count, durationMs }) => {
    launch(emoji, count ?? 40, durationMs ?? 3500);
  });
});

onUnmounted(() => {
  destroy$.next();
  destroy$.complete();
});
</script>

<template>
  <div class="emoji-rain-layer" aria-hidden="true">
    <span
      v-for="d in drops"
      :key="d.id"
      class="emoji-rain-drop"
      :style="{
        left:               d.left + 'vw',
        fontSize:           d.size + 'rem',
        animationDuration:  d.duration + 's',
        animationDelay:     d.delay + 's',
        transform:          `rotate(${d.rotate}deg)`,
      }"
    >{{ d.emoji }}</span>
  </div>
</template>
