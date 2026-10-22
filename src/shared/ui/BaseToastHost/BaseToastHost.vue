<template>
  <div :class="$style.host" aria-live="polite">
    <div v-for="toast in toasts" :key="toast.id" :class="[$style.toast, $style[toast.tone]]">
      <span :class="$style.text">{{ toast.text }}</span>
      <button v-if="toast.action" type="button" :class="$style.action" @click="toast.action.run()">
        {{ toast.action.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { toasts } from '@/shared/lib/toast'
</script>

<style module>
.host {
  position: fixed;
  left: 50%;
  bottom: var(--space-l);
  transform: translateX(-50%);
  z-index: 50;
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
  width: min(420px, calc(100vw - var(--space-m) * 2));
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-m);
  padding: var(--space-s) var(--space-m);
  min-height: var(--touch-target);
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-left: 3px solid var(--accent);
  border-radius: var(--radius-m);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
  color: var(--text-primary);
  font-size: var(--font-size-m);
  pointer-events: auto;
}

.success {
  border-left-color: var(--success);
}

.error {
  border-left-color: var(--danger);
}

.info {
  border-left-color: var(--accent);
}

.text {
  min-width: 0;
}

.action {
  flex-shrink: 0;
  background: transparent;
  border: none;
  color: var(--accent);
  font-size: var(--font-size-m);
  font-weight: 700;
}

/* Над нижней навигацией на телефоне. */
@media (max-width: 860px) {
  .host {
    bottom: calc(72px + env(safe-area-inset-bottom));
  }
}
</style>
