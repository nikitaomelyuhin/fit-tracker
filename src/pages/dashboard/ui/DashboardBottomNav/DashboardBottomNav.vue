<template>
  <nav :class="$style.bottomNav">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      type="button"
      :class="[$style.item, active === tab.key && $style.itemActive]"
      :aria-current="active === tab.key ? 'page' : undefined"
      @click="emit('select', tab.key)"
    >
      <span :class="$style.iconWrap">
        <AppIcon :name="tab.icon" />
      </span>
      <span :class="$style.label">{{ tab.label }}</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { AppIcon } from '@/shared/ui'
import type { DashboardTab, DashboardTabKey } from '../../model/types'

defineProps<{ tabs: DashboardTab[]; active: DashboardTabKey }>()
const emit = defineEmits<{ select: [tab: DashboardTabKey] }>()
</script>

<style module>
.bottom-nav {
  display: none;
}

@media (max-width: 860px) {
  .bottom-nav {
    display: flex;
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 20;
    background: var(--bg-surface);
    border-top: var(--border-width) solid var(--border);
    padding: var(--space-xs) var(--space-xs) calc(var(--space-xs) + env(safe-area-inset-bottom));
  }
}

.item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2xs);
  padding: var(--space-xs);
  background: transparent;
  border: none;
  color: var(--text-muted);
  transition: color var(--duration-fast) var(--ease-out);
}

/* Как в iOS/Material: подложка-«пилюля» только под иконкой активной вкладки. */
.icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-2xs) var(--space-m);
  border-radius: var(--radius-l);
  font-size: var(--font-size-m);
  transition:
    background var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
}

.item:active .icon-wrap {
  transform: scale(var(--press-scale));
}

.item-active {
  color: var(--accent);
}

.item-active .icon-wrap {
  background: var(--accent-soft);
}

.label {
  font-size: var(--font-size-xs);
  font-weight: 600;
}
</style>
