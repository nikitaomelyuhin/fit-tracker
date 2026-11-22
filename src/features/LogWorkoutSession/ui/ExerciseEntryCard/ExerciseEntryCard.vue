<template>
  <div :class="$style.exercise">
    <div :class="$style.head">
      <span :class="$style.name">{{ item.exercise }}</span>
      <button
        type="button"
        :class="$style.remove"
        :aria-label="`Убрать «${item.exercise}» из тренировки`"
        @click="store.removeExercise(item.exercise)"
      >
        <AppIcon name="close" />
      </button>
    </div>
    <p v-if="planned" :class="$style.planned">план: {{ planned }}</p>
    <p :class="$style.last">прошлый раз: {{ lastSummary }}</p>

    <div :class="$style.inputs">
      <BaseTextField v-model="item.weight" label="Вес, кг" inputmode="decimal" />
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
      <BaseTextField v-model="item.nextWeight" label="Вес, кг" inputmode="decimal" />
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
  align-items: center;
  justify-content: space-between;
  gap: var(--space-s);
  margin: calc(-1 * var(--space-xs)) calc(-1 * var(--space-s)) 0 0;
}

.name {
  font-size: var(--font-size-m);
  font-weight: 600;
  color: var(--text-primary);
}

.remove {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--touch-target);
  height: var(--touch-target);
  background: transparent;
  border: none;
  border-radius: var(--radius-s);
  color: var(--text-muted);
}

.remove:active {
  background: var(--bg-pressed);
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

@media (hover: hover) {
  .remove:hover {
    color: var(--text-primary);
  }
}
</style>
