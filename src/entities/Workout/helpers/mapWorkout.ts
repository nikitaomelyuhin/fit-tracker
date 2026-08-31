import type { WorkoutType } from '@/shared/config/workouts'
import type { Workout, WorkoutRow } from '../model/types'

function num(value: number | string | null): number | null {
  return value != null ? Number(value) : null
}

/** Преобразует строку Supabase в доменную модель тренировки. */
export function mapWorkout(row: WorkoutRow): Workout {
  return {
    id: row.id,
    date: row.date,
    type: (row.workout_type as WorkoutType | null) ?? null,
    exercise: row.exercise,
    weight: num(row.weight),
    sets: row.sets ?? null,
    reps: row.reps ?? null,
    nextWeight: num(row.next_weight),
    nextSets: row.next_sets ?? null,
    nextReps: row.next_reps ?? null,
    note: row.note ?? null,
  }
}
