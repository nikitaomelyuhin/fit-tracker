<template>
  <label :class="$style.field">
    <span v-if="label" :class="$style.label">{{ label }}</span>
    <select :class="$style.select" :value="modelValue" @change="onChange">
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
  </label>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string
  label?: string
  options: { value: string; label: string }[]
}>()

const emit = defineEmits<{ 'update:modelValue': [string] }>()

function onChange(event: Event) {
  emit('update:modelValue', (event.target as HTMLSelectElement).value)
}
</script>

<style module>
.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  min-width: 0;
}

.label {
  font-size: var(--font-size-s);
  color: var(--text-secondary);
}

.select {
  width: 100%;
  padding: var(--space-s) var(--space-m);
  background: var(--bg-elevated);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-m);
  min-height: var(--touch-target);
  font-size: var(--font-size-input);
  color: var(--text-primary);
  outline: none;
  transition:
    border-color var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out);
}

.select:focus {
  border-color: var(--accent);
  box-shadow: var(--focus-halo);
}

@media (hover: hover) {
  .select:hover:not(:focus) {
    border-color: var(--text-muted);
  }
}
</style>
