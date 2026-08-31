<template>
  <label :class="$style.field">
    <span v-if="label" :class="$style.label">{{ label }}</span>
    <input
      :class="$style.input"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :inputmode="inputmode"
      :step="step"
      @input="onInput"
    />
  </label>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue: string
    label?: string
    type?: string
    placeholder?: string
    inputmode?: 'text' | 'decimal' | 'numeric' | 'email'
    step?: string
  }>(),
  { type: 'text' },
)

const emit = defineEmits<{ 'update:modelValue': [string] }>()

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
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

.input {
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

.input:focus {
  border-color: var(--accent);
}

.input::placeholder {
  color: var(--text-muted);
}
</style>
