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
  min-width: 0;
}

.label {
  font-size: var(--font-size-s);
  color: var(--text-secondary);
}

.input {
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

.input:focus {
  border-color: var(--accent);
  box-shadow: var(--focus-halo);
}

@media (hover: hover) {
  .input:hover:not(:focus) {
    border-color: var(--text-muted);
  }
}

.input::placeholder {
  color: var(--text-muted);
}

/*
 * iOS Safari рисует поле даты нативным контролом со своей минимальной шириной и
 * игнорирует width: 100% — на узком экране оно вылезает за контейнер. Снимаем
 * нативный вид и минимальную ширину.
 */
.input[type='date'] {
  -webkit-appearance: none;
  appearance: none;
  min-width: 0;
  max-width: 100%;
  display: block;
}

.input[type='date']::-webkit-date-and-time-value {
  text-align: left;
}
</style>
