<template>
  <form :class="$style.form" @submit.prevent="onSubmit">
    <div :class="$style.top">
      <BaseSegmented
        :model-value="store.type"
        :options="typeOptions"
        aria-label="Тренировка"
        @update:model-value="store.setType($event)"
      />
      <DateChip :model-value="store.date" aria-label="Дата тренировки" @update:model-value="store.setDate($event)" />
    </div>

    <div :class="$style.exercises">
      <ExerciseEntryCard v-for="(exercise, index) in store.exercises" :key="exercise.exercise" :index="index" />
    </div>

    <div :class="$style.footer">
      <p v-if="workouts.pendingCount" :class="$style.pending">
        Сохранено на телефоне, ещё не отправлено ({{ workouts.pendingCount }}) — уйдёт само, когда появится интернет.
      </p>
      <BaseButton type="submit" :disabled="!store.canSubmit || store.submitting">
        {{ store.submitting ? 'Сохраняю…' : submitLabel }}
      </BaseButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useWorkoutStore } from '@/entities/Workout'
import { WORKOUT_TYPES } from '@/shared/config/workouts'
import { BaseButton, BaseSegmented, DateChip } from '@/shared/ui'
import { useFreshDate } from '@/shared/lib/freshDate'
import { pluralRu } from '@/shared/lib/plural'
import { useLogWorkoutStore } from '../../model/store'
import ExerciseEntryCard from '../ExerciseEntryCard/ExerciseEntryCard.vue'

const store = useLogWorkoutStore()
const workouts = useWorkoutStore()

const typeOptions = WORKOUT_TYPES.map((type) => ({ value: type, label: `Тренировка ${type}` }))

onMounted(() => store.init())
useFreshDate(() => store.refreshDateIfUntouched())

// Данные грузятся асинхронно — когда подъедут, перезаполняем форму (если ещё не начал вводить).
watch(
  () => workouts.items.length,
  () => {
    if (store.isPristine) store.setType(store.type)
  },
)

const submitLabel = computed(() => {
  const count = store.filledCount
  return count
    ? `Сохранить · ${count} ${pluralRu(count, ['упражнение', 'упражнения', 'упражнений'])}`
    : 'Сохранить тренировку'
})

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
  gap: var(--space-s);
}

.exercises {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(var(--exercise-min-width), 1fr));
  gap: var(--space-s);
  align-items: start;
}

/* Кнопка сохранения прилипает к низу экрана, пока листаешь упражнения. */
.footer {
  position: sticky;
  bottom: var(--space-m);
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
}

.footer > button {
  box-shadow: var(--shadow-elevated);
}

.pending {
  padding: var(--space-s) var(--space-m);
  background: var(--warning-soft);
  border-radius: var(--radius-m);
  font-size: var(--font-size-s);
  color: var(--warning);
}

/* На телефоне — над нижней навигацией. */
@media (max-width: 860px) {
  .footer {
    bottom: calc(var(--bottom-nav-height) + env(safe-area-inset-bottom) + var(--space-s));
  }
}
</style>
