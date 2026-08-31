<template>
  <section :class="$style.card">
    <h2 v-if="title" :class="$style.title">{{ title }}</h2>
    <slot />
  </section>
</template>

<script setup lang="ts">
defineProps<{ title?: string }>()
</script>

<style module>
.card {
  display: flex;
  flex-direction: column;
  gap: var(--space-m);
  padding: var(--space-l);
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-l);
}

.title {
  font-size: var(--font-size-l);
  color: var(--text-primary);
}
</style>
