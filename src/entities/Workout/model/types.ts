import type { WorkoutType } from '@/shared/config/workouts'

export interface Workout {
  id: string
  date: string // YYYY-MM-DD
  type: WorkoutType | null
  exercise: string
  weight: number | null
  sets: number | null
  reps: number | null
  nextWeight: number | null
  nextSets: number | null
  nextReps: number | null
  note: string | null
}

/** Одно упражнение при сохранении сессии. */
export interface WorkoutEntryInput {
  exercise: string
  weight: number | null
  sets: number | null
  reps: number | null
  nextWeight: number | null
  nextSets: number | null
  nextReps: number | null
}

/** Сессия — набор упражнений одной тренировки. */
export interface WorkoutSession {
  date: string
  type: WorkoutType | null
  entries: Workout[]
}

/** Прогресс по упражнению: первая запись vs последняя (вес и тоннаж подхода). */
export interface ExerciseProgress {
  name: string
  /** true — вес это помощь (гравитрон): меньше значит тяжелее. */
  assist: boolean
  weightDelta: number
  /** Тоннаж = вес × подходы × повторы. null — не хватает данных (сеты/повторы) хоть в одной точке. */
  volumeDelta: number | null
}

/** Строка из таблицы Supabase workouts. */
export interface WorkoutRow {
  id: string
  date: string
  workout_type: string | null
  exercise: string
  weight: number | string | null
  sets: number | null
  reps: number | null
  next_weight: number | string | null
  next_sets: number | null
  next_reps: number | null
  note: string | null
}
