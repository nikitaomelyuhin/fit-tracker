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
  min-width: 0;
  background: var(--bg-surface);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-l);
}

/* Заголовок — подпись к данным, а не главное в карточке: главное — цифры. */
.title {
  font-size: var(--font-size-m);
  font-weight: 600;
  color: var(--text-primary);
}

/* На телефоне каждый пиксель ширины — под контент. */
@media (max-width: 520px) {
  .card {
    padding: var(--space-m);
  }
}
</style>
