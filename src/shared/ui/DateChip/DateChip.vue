<template>
  <label :class="$style.chip">
    <AppIcon name="calendar" />
    <span>{{ relativeDayLabel(modelValue) }}</span>
    <AppIcon name="chevronDown" :class="$style.chevron" />
    <!-- Прозрачное нативное поле поверх чипа: тап открывает системный выбор даты
         и на iOS, и на Android, без showPicker(). -->
    <input
      :class="$style.input"
      type="date"
      :value="modelValue"
      :aria-label="ariaLabel"
      @change="onChange"
    />
  </label>
</template>

<script setup lang="ts">
import { relativeDayLabel } from '@/shared/lib/date'
import AppIcon from '../AppIcon/AppIcon.vue'

withDefaults(defineProps<{ modelValue: string; ariaLabel?: string }>(), { ariaLabel: 'Дата' })
const emit = defineEmits<{ 'update:modelValue': [string] }>()

function onChange(event: Event) {
  const value = (event.target as HTMLInputElement).value
  // Кнопка «Сбросить» в пикере iOS отдаёт пустую строку — дату без значения не принимаем.
  if (value) emit('update:modelValue', value)
}
</script>

<style module>
.chip {
  position: relative;
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: var(--space-xs);
  min-height: var(--touch-target);
  padding: var(--space-xs) var(--space-m);
  background: var(--bg-elevated);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-l);
  font-size: var(--font-size-m);
  font-weight: 600;
  color: var(--text-primary);
  cursor: pointer;
  transition: border-color var(--duration-fast) var(--ease-out);
}

.chip:focus-within {
  border-color: var(--accent);
}

.chevron {
  color: var(--text-muted);
}

.input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  /* iOS рисует date-поле со своей минимальной шириной — не даём ему вылезти из чипа. */
  -webkit-appearance: none;
  appearance: none;
  min-width: 0;
}

@media (hover: hover) {
  .chip:hover {
    border-color: var(--text-muted);
  }
}
</style>
