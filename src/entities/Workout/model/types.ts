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
