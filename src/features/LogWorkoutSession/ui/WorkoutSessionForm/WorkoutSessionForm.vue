<template>
  <form :class="$style.form" @submit.prevent="onSubmit">
    <div :class="$style.top">
      <div :class="$style.types">
        <button
          v-for="type in types"
          :key="type"
          type="button"
          :class="[$style.typeBtn, store.type === type && $style.typeActive]"
          @click="store.setType(type)"
        >
          Тренировка {{ type }}
        </button>
      </div>
      <BaseTextField v-model="store.date" label="Дата" type="date" />
    </div>

    <div v-for="(exercise, index) in store.exercises" :key="exercise.exercise" :class="$style.exercise">
      <div :class="$style.exHead">
        <span :class="$style.exName">{{ exercise.exercise }}</span>
        <span :class="$style.last">{{ lastSummary(exercise.exercise) }}</span>
      </div>
      <p v-if="plannedHint(exercise.exercise)" :class="$style.goal">
        🎯 План был: {{ plannedHint(exercise.exercise) }}
      </p>
      <p v-if="exercise.assist" :class="$style.assist">Вес помощи — меньше = лучше ↓</p>

      <div :class="$style.inputs">
        <BaseTextField
          v-model="store.exercises[index].weight"
          :label="exercise.assist ? 'Помощь' : 'Вес'"
          inputmode="decimal"
        />
        <BaseTextField v-model="store.exercises[index].sets" label="Подходы" inputmode="numeric" />
        <BaseTextField v-model="store.exercises[index].reps" label="Повторы" inputmode="numeric" />
      </div>

      <span :class="$style.goalLabel">🎯 Цель на следующий раз</span>
      <div :class="$style.inputs">
        <BaseTextField
          v-model="store.exercises[index].nextWeight"
          :label="exercise.assist ? 'Помощь' : 'Вес'"
          inputmode="decimal"
        />
        <BaseTextField v-model="store.exercises[index].nextSets" label="Подходы" inputmode="numeric" />
        <BaseTextField v-model="store.exercises[index].nextReps" label="Повторы" inputmode="numeric" />
      </div>
    </div>

    <BaseButton type="submit" :disabled="!store.canSubmit || store.submitting">
      {{ store.submitting ? 'Сохраняю…' : 'Сохранить тренировку' }}
    </BaseButton>
  </form>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useLogWorkoutStore } from '../../model/store'
import { useWorkoutStore } from '@/entities/Workout'
import { WORKOUT_TYPES } from '@/shared/config/workouts'
import { BaseButton, BaseTextField } from '@/shared/ui'

const store = useLogWorkoutStore()
const workouts = useWorkoutStore()
const types = WORKOUT_TYPES

onMounted(() => store.init())

// Данные грузятся асинхронно — когда подъедут, перезаполняем форму (если ещё не начал вводить).
watch(
  () => workouts.items.length,
  () => {
    if (store.isPristine) store.setType(store.type)
  },
)

function triple(weight: number | null, sets: number | null, reps: number | null): string {
  const w = weight != null ? `${weight}` : '—'
  const s = sets != null ? `${sets}` : '—'
  const r = reps != null ? `${reps}` : '—'
  return `${w}×${s}×${r}`
}

function lastSummary(exercise: string): string {
  const last = workouts.lastEntryFor(exercise, store.date)
  if (!last) return 'первый раз'
  return `прошлый раз: ${triple(last.weight, last.sets, last.reps)}`
}

function plannedHint(exercise: string): string | null {
  const last = workouts.lastEntryFor(exercise, store.date)
  if (!last || (last.nextWeight == null && last.nextReps == null)) return null
  return triple(last.nextWeight, last.nextSets, last.nextReps)
}

async function onSubmit() {
  await store.submit()
}
</script>

<style module>
.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-m);
}

.top {
  display: flex;
  flex-direction: column;
  gap: var(--space-m);
}

.types {
  display: flex;
  gap: var(--space-xs);
  background: var(--bg-elevated);
  border-radius: var(--radius-m);
  padding: var(--space-xs);
}

.typeBtn {
  flex: 1;
  padding: var(--space-s);
  background: transparent;
  border: none;
  border-radius: var(--radius-s);
  color: var(--text-secondary);
  font-size: var(--font-size-m);
  font-weight: 600;
}

.typeActive {
  background: var(--accent);
  color: var(--accent-contrast);
}

.exercise {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
  padding: var(--space-m);
  background: var(--bg-elevated);
  border-radius: var(--radius-m);
}

.exHead {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-s);
}

.exName {
  font-weight: 600;
  color: var(--text-primary);
}

.last {
  font-size: var(--font-size-s);
  color: var(--text-muted);
}

.goal {
  font-size: var(--font-size-s);
  color: var(--warning);
}

.assist {
  font-size: var(--font-size-s);
  color: var(--text-secondary);
}

.goalLabel {
  font-size: var(--font-size-s);
  color: var(--warning);
}

.inputs {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--space-s);
}
</style>
