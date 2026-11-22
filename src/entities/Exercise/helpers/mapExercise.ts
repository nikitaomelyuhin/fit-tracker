import { toExerciseCategory } from '@/shared/config/exercises'
import type { Exercise, ExerciseRow } from '../model/types'

/** Преобразует строку Supabase в доменную модель упражнения. */
export function mapExercise(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    name: row.name,
    category: toExerciseCategory(row.category),
    isCore: row.is_core ?? false,
  }
}
