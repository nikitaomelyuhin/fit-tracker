<template>
  <form :class="$style.form" @submit.prevent="onSubmit">
    <DateChip :model-value="store.date" aria-label="Дата тренировки" @update:model-value="store.setDate($event)" />

    <p v-if="!store.exercises.length" :class="$style.empty">
      Пока пусто — добавь упражнения, которые делаешь сегодня.
    </p>
    <div v-else :class="$style.exercises">
      <ExerciseEntryCard v-for="(exercise, index) in store.exercises" :key="exercise.exercise" :index="index" />
    </div>

    <BaseButton :variant="store.exercises.length ? 'ghost' : 'primary'" @click="picker.openPicker()">
      <AppIcon name="plus" />
      Добавить упражнение
    </BaseButton>

    <div v-if="store.exercises.length" :class="$style.footer">
      <p v-if="workouts.pendingCount" :class="$style.pending">
        Сохранено на телефоне, ещё не отправлено ({{ workouts.pendingCount }}) — уйдёт само, когда появится интернет.
      </p>
      <BaseButton type="submit" :disabled="!store.canSubmit || store.submitting">
        {{ store.submitting ? 'Сохраняю…' : submitLabel }}
      </BaseButton>
    </div>

    <BaseSheet
      :open="picker.open"
      :title="picker.creating ? 'Новое упражнение' : 'Добавить упражнение'"
      expanded
      @close="picker.close()"
    >
      <NewExerciseForm v-if="picker.creating" />
      <ExercisePicker v-else />
    </BaseSheet>
  </form>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useWorkoutStore } from '@/entities/Workout'
import { AppIcon, BaseButton, BaseSheet, DateChip } from '@/shared/ui'
import { useFreshDate } from '@/shared/lib/freshDate'
import { pluralRu } from '@/shared/lib/plural'
import { useLogWorkoutStore } from '../../model/store'
import { useExercisePickerStore } from '../../model/picker'
import ExerciseEntryCard from '../ExerciseEntryCard/ExerciseEntryCard.vue'
import ExercisePicker from '../ExercisePicker/ExercisePicker.vue'
import NewExerciseForm from '../NewExerciseForm/NewExerciseForm.vue'

const store = useLogWorkoutStore()
const picker = useExercisePickerStore()
const workouts = useWorkoutStore()

onMounted(() => store.init())
useFreshDate(() => store.refreshDateIfUntouched())

// Данные грузятся асинхронно — когда подъедут, показываем сохранённую тренировку дня (если форму не трогали).
watch(
  () => workouts.items,
  () => store.syncWithSaved(),
)

const submitLabel = computed(() => {
  const count = store.filledCount
  return count
    ? `Сохранить · ${count} ${pluralRu(count, ['упражнение', 'упражнения', 'упражнений'])}`
    : 'Заполни хотя бы одно упражнение'
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

.empty {
  padding: var(--space-m) 0;
  font-size: var(--font-size-m);
  color: var(--text-muted);
  text-align: center;
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
