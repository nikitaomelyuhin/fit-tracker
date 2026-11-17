<template>
  <div :class="$style.segmented" role="radiogroup" :aria-label="ariaLabel">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      role="radio"
      :aria-checked="modelValue === option.value"
      :class="[$style.segment, modelValue === option.value && $style.segmentActive]"
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
/* Сегментированный переключатель, как в iOS: варианты рядом, выбранный «приподнят». */
.segmented {
  display: flex;
  gap: var(--space-2xs);
  padding: var(--space-2xs);
  background: var(--bg-elevated);
  border-radius: var(--radius-m);
}

.segment {
  flex: 1;
  min-width: 0;
  padding: var(--space-s) var(--space-xs);
  background: transparent;
  border: none;
  border-radius: var(--radius-s);
  color: var(--text-secondary);
  font-size: var(--font-size-s);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition:
    background var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out);
}

.segment:active {
  background: var(--bg-pressed);
}

.segment-active,
.segment-active:active {
  background: var(--bg-surface);
  color: var(--text-primary);
  box-shadow: var(--shadow-segment);
}

@media (hover: hover) {
  .segment:not(.segment-active):hover {
    color: var(--text-primary);
  }
}
</style>
