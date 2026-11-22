<template>
  <div :class="$style.chips" role="radiogroup" :aria-label="ariaLabel">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      role="radio"
      :aria-checked="modelValue === option.value"
      :class="[$style.chip, modelValue === option.value && $style.chipActive]"
      @click="emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup lang="ts" generic="T extends string">
defineProps<{
  modelValue: T
  options: { value: T; label: string }[]
  ariaLabel?: string
}>()

const emit = defineEmits<{ 'update:modelValue': [T] }>()
</script>

<style module>
/* Ряд «таблеток» с выбором одной: не влезают в ширину — листаются вбок. */
.chips {
  display: flex;
  gap: var(--space-xs);
  overflow-x: auto;
  scrollbar-width: none;
  overscroll-behavior-x: contain;
}

.chips::-webkit-scrollbar {
  display: none;
}

.chip {
  flex-shrink: 0;
  min-height: var(--touch-target);
  padding: 0 var(--space-m);
  background: var(--bg-elevated);
  border: none;
  border-radius: var(--radius-l);
  color: var(--text-secondary);
  font-size: var(--font-size-s);
  font-weight: 600;
  white-space: nowrap;
  transition:
    background var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out);
}

.chip:active {
  background: var(--bg-pressed);
}

.chip-active,
.chip-active:active {
  background: var(--accent-soft);
  color: var(--accent);
}

@media (hover: hover) {
  .chip:not(.chip-active):hover {
    color: var(--text-primary);
  }
}
</style>
