export interface Workout {
  id: string
  date: string // YYYY-MM-DD
  /** 'A' | 'B' — только у старых тренировок по шаблонам; у свободных null. */
  type: string | null
  exercise: string
  weight: number | null
  sets: number | null
  reps: number | null
  nextWeight: number | null
  nextSets: number | null
  nextReps: number | null
  note: string | null
  /** Порядок упражнения в тренировке; null — неизвестен. */
  position: number | null
}

/** Одно упражнение при сохранении тренировки. */
export interface WorkoutEntryInput {
  exercise: string
  weight: number | null
  sets: number | null
  reps: number | null
  nextWeight: number | null
  nextSets: number | null
  nextReps: number | null
  position: number
}

/** Тренировка — все упражнения одного дня. */
export interface WorkoutSession {
  date: string
  /** Тип старой тренировки по шаблону (A/B); у свободных null. */
  type: string | null
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
  /** Может отсутствовать в ответе, если миграция схемы ещё не применена в базе. */
  position?: number | null
}
