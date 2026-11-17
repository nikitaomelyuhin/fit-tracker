<template>
  <div :class="$style.filter">
    <div :class="$style.bar">
      <button
        type="button"
        :class="[$style.toggle, (open || active) && $style.toggleActive]"
        :aria-expanded="open"
        @click="open = !open"
      >
        <AppIcon name="filter" />
        {{ active ? summary : 'Период' }}
      </button>
      <button v-if="active" type="button" :class="$style.reset" aria-label="Сбросить период" @click="reset">
        <AppIcon name="close" />
      </button>
    </div>

    <div v-if="open" :class="$style.fields">
      <BaseTextField :model-value="from" label="С" type="date" @update:model-value="emit('update:from', $event)" />
      <BaseTextField :model-value="to" label="По" type="date" @update:model-value="emit('update:to', $event)" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { formatHuman } from '@/shared/lib/date'
import AppIcon from '../AppIcon/AppIcon.vue'
import BaseTextField from '../BaseTextField/BaseTextField.vue'

const props = defineProps<{ from: string; to: string }>()
const emit = defineEmits<{ 'update:from': [string]; 'update:to': [string] }>()

/** Фильтр нужен редко — по умолчанию свёрнут в одну кнопку. */
const open = ref(false)

const active = computed(() => props.from !== '' || props.to !== '')

const summary = computed(() => {
  const from = props.from ? formatHuman(props.from) : '…'
  const to = props.to ? formatHuman(props.to) : '…'
  return `${from} – ${to}`
})

function reset() {
  emit('update:from', '')
  emit('update:to', '')
  open.value = false
}
</script>

<style module>
.filter {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
}

.bar {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-m);
  background: transparent;
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-l);
  color: var(--text-secondary);
  font-size: var(--font-size-s);
  font-weight: 600;
  transition:
    background var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out);
}

.toggle:active {
  background: var(--bg-pressed);
}

.toggle-active {
  background: var(--accent-soft);
  border-color: transparent;
  color: var(--accent);
}

.reset {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xs);
  background: transparent;
  border: none;
  border-radius: 50%;
  color: var(--text-muted);
  font-size: var(--font-size-s);
}

.fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-s);
}
</style>
