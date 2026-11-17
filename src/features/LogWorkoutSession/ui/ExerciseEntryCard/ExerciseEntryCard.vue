<template>
  <div :class="$style.exercise">
    <div :class="$style.head">
      <span :class="$style.name">{{ item.exercise }}</span>
      <span v-if="planned" :class="$style.planned">план: {{ planned }}</span>
      <span v-else :class="$style.last">{{ lastSummary }}</span>
    </div>
    <p v-if="planned" :class="$style.last">прошлый раз: {{ lastSummary }}</p>
    <p v-if="item.assist" :class="$style.assist">Вес помощи — чем меньше, тем лучше</p>

    <div :class="$style.inputs">
      <BaseTextField v-model="item.weight" :label="item.assist ? 'Помощь, кг' : 'Вес, кг'" inputmode="decimal" />
      <BaseTextField v-model="item.sets" label="Подходы" inputmode="numeric" />
      <BaseTextField v-model="item.reps" label="Повторы" inputmode="numeric" />
    </div>

    <button
      type="button"
      :class="[$style.nextToggle, nextOpen && $style.nextToggleOpen]"
      :aria-expanded="nextOpen"
      @click="store.toggleNext(item.exercise)"
    >
      <AppIcon :name="nextOpen ? 'chevronDown' : 'plus'" />
      Цель на следующий раз
    </button>
    <div v-if="nextOpen" :class="$style.inputs">
      <BaseTextField v-model="item.nextWeight" :label="item.assist ? 'Помощь, кг' : 'Вес, кг'" inputmode="decimal" />
      <BaseTextField v-model="item.nextSets" label="Подходы" inputmode="numeric" />
      <BaseTextField v-model="item.nextReps" label="Повторы" inputmode="numeric" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AppIcon, BaseTextField } from '@/shared/ui'
import { useLogWorkoutStore } from '../../model/store'

const props = defineProps<{ index: number }>()

const store = useLogWorkoutStore()

// Поля редактируются прямо в state стора (форма живёт в сторе, не в компоненте).
const item = computed(() => store.exercises[props.index])
const planned = computed(() => store.plannedFor(item.value.exercise))
const lastSummary = computed(() => store.lastSummaryFor(item.value.exercise))
const nextOpen = computed(() => store.isNextOpen(item.value.exercise))
</script>

<style module>
.exercise {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
  padding: var(--space-m);
  background: var(--bg-elevated);
  border-radius: var(--radius-m);
}

.head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-xs) var(--space-s);
}

.name {
  font-size: var(--font-size-m);
  font-weight: 600;
  color: var(--text-primary);
}

.planned {
  font-size: var(--font-size-s);
  font-weight: 600;
  color: var(--accent);
}

.last {
  font-size: var(--font-size-s);
  color: var(--text-muted);
}

.assist {
  font-size: var(--font-size-s);
  color: var(--text-secondary);
}

.inputs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-s);
}

.next-toggle {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: var(--space-xs);
  padding: var(--space-xs) 0;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: var(--font-size-s);
  font-weight: 600;
}

.next-toggle-open {
  color: var(--accent);
}
</style>
