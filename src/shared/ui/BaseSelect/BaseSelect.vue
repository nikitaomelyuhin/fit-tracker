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
}

.label {
  font-size: var(--font-size-s);
  color: var(--text-secondary);
}

.select {
  width: 100%;
  padding: var(--space-s) var(--space-m);
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-m);
  font-size: var(--font-size-m);
  color: var(--text-primary);
  outline: none;
  transition: border-color 0.15s ease;
}

.select:focus {
  border-color: var(--accent);
}
</style>
