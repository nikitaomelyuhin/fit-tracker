import type { Exercise } from '@/entities/Exercise'
import type { ExerciseCategory } from '@/shared/config/exercises'

/** Упражнение в форме тренировки: значения полей — строки, как в инпутах. */
export interface ExerciseForm {
  exercise: string
  weight: string
  sets: string
  reps: string
  nextWeight: string
  nextSets: string
  nextReps: string
}

/** Недописанная тренировка — переживает закрытие приложения посреди зала. */
export interface WorkoutDraft {
  date: string
  exercises: ExerciseForm[]
}

/** Вкладка выбора упражнения: «Основа», группа мышц или все сразу. */
export type PickerTab = 'core' | ExerciseCategory | 'all'

export interface NewExerciseForm {
  name: string
  category: ExerciseCategory
  isCore: boolean
}

export interface PickerOption {
  exercise: Exercise
  /** Уже есть в текущей тренировке. */
  inSession: boolean
  /** «105 × 3 × 8 · 3 дня назад» или null, если ещё не делал. */
  lastSummary: string | null
}

/** Группа в списке выбора; title null — без заголовка (одна вкладка или поиск). */
export interface PickerGroup {
  key: string
  title: string | null
  options: PickerOption[]
}
