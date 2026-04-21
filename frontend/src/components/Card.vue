<script setup lang="ts">
const props = defineProps(['estimate', 'clickable', 'selected', 'size']);
</script>

<template>
  <div
    :class="[
      'card',
      clickable && 'card-clickable',
      selected && 'card-selected',
      estimate === null && 'card-blank',
      size === 'lg' && 'card-lg',
      size === 'sm' && 'card-sm',
    ]"
  >
    <div class="card-inner">
      <span v-if="estimate === null" class="card-x mono">?</span>
      <span v-else-if="typeof estimate === 'string'" class="card-val mono">{{ estimate }}</span>
      <span v-else-if="typeof estimate === 'number' && estimate === -1" class="card-val mono">?</span>
    </div>
    <!-- Corner pip markings (ornamental) -->
    <span class="pip pip-tl mono" v-if="estimate !== null && typeof estimate === 'string'">{{ estimate }}</span>
    <span class="pip pip-br mono" v-if="estimate !== null && typeof estimate === 'string'">{{ estimate }}</span>
  </div>
</template>

<style scoped>
.card {
  --card-w: 3.25rem;
  --card-h: 4.8rem;
  position: relative;
  width: var(--card-w);
  height: var(--card-h);
  flex-shrink: 0;
  border-radius: 8px;
  background: linear-gradient(155deg, #1f2732 0%, #141a22 100%);
  border: 1px solid var(--line);
  box-shadow:
    0 1px 0 rgba(255,255,255,0.06) inset,
    0 4px 12px rgba(0,0,0,0.5);
  user-select: none;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.card-sm { --card-w: 2.5rem; --card-h: 3.8rem; }
.card-lg { --card-w: 4rem; --card-h: 6rem; }

.card-inner {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.card-val, .card-x {
  font-size: 1.45rem;
  font-weight: 700;
  color: var(--cream);
  font-variation-settings: 'opsz' 48;
  z-index: 2;
}
.card-lg .card-val { font-size: 1.9rem; }
.card-sm .card-val { font-size: 1.1rem; }
.card-x { color: var(--muted); }

.card-blank {
  background: repeating-linear-gradient(
    45deg,
    #141a22, #141a22 6px,
    #1a2029 6px, #1a2029 12px
  );
  border-color: var(--line);
}

.card-clickable { cursor: pointer; }
.card-clickable:hover {
  transform: translateY(-10px) rotate(-2deg);
  border-color: var(--lime);
  box-shadow:
    0 1px 0 rgba(255,255,255,0.08) inset,
    0 12px 24px rgba(0,0,0,0.5),
    0 0 0 1px var(--lime);
}

.card-selected {
  background: linear-gradient(155deg, var(--lime) 0%, #aee02a 100%);
  border-color: var(--lime);
  box-shadow:
    0 1px 0 rgba(255,255,255,0.3) inset,
    0 8px 20px var(--lime-dim),
    0 0 0 2px var(--lime);
  transform: translateY(-8px);
}
.card-selected .card-val { color: var(--ink); text-shadow: 0 1px 0 rgba(255,255,255,0.3); }
.card-selected .pip { color: rgba(10, 14, 19, 0.5); }

.pip {
  position: absolute;
  font-size: 0.55rem;
  font-weight: 600;
  color: var(--muted);
  line-height: 1;
  z-index: 1;
}
.pip-tl { top: 4px; left: 5px; }
.pip-br { bottom: 4px; right: 5px; transform: rotate(180deg); }
.card-sm .pip { font-size: 0.45rem; }
.card-lg .pip { font-size: 0.7rem; }
</style>
