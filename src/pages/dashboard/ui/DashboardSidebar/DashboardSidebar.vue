<template>
  <aside :class="$style.sidebar">
    <div :class="$style.brand">Fit Tracker</div>
    <nav :class="$style.nav">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        :class="[$style.item, active === tab.key && $style.itemActive]"
        :aria-current="active === tab.key ? 'page' : undefined"
        @click="emit('select', tab.key)"
      >
        <AppIcon :name="tab.icon" />
        {{ tab.label }}
      </button>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { AppIcon } from '@/shared/ui'
import type { DashboardTab, DashboardTabKey } from '../../model/types'

defineProps<{ tabs: DashboardTab[]; active: DashboardTabKey }>()
const emit = defineEmits<{ select: [tab: DashboardTabKey] }>()
</script>

<style module>
.sidebar {
  flex: 0 0 var(--sidebar-width);
  position: sticky;
  top: var(--space-l);
  display: flex;
  flex-direction: column;
  gap: var(--space-m);
  background: var(--bg-surface);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-l);
  padding: var(--space-m);
}

.brand {
  font-size: var(--font-size-l);
  font-weight: 700;
  color: var(--text-primary);
  padding: var(--space-xs) var(--space-s);
}

.nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
}

.item {
  display: flex;
  align-items: center;
  gap: var(--space-s);
  padding: var(--space-s) var(--space-s);
  background: transparent;
  border: none;
  border-radius: var(--radius-s);
  color: var(--text-secondary);
  font-size: var(--font-size-m);
  font-weight: 600;
  text-align: left;
  transition:
    background var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out);
}

.item:active {
  background: var(--bg-pressed);
}

/* Активная — мягкая подложка и акцентный цвет, а не сплошная заливка. */
.item-active,
.item-active:active {
  background: var(--accent-soft);
  color: var(--accent);
}

@media (hover: hover) {
  .item:not(.item-active):hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }
}

@media (max-width: 860px) {
  .sidebar {
    display: none;
  }
}
</style>
