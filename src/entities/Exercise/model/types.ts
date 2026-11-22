import type { ExerciseCategory } from '@/shared/config/exercises'

/** Упражнение из справочника. */
export interface Exercise {
  id: string
  name: string
  category: ExerciseCategory
  /** Входит в «Основу» — первая вкладка при добавлении в тренировку. */
  isCore: boolean
}

export interface ExerciseInput {
  name: string
  category: ExerciseCategory
  isCore: boolean
}

/** Строка из таблицы Supabase exercises. */
export interface ExerciseRow {
  id: string
  name: string
  category: string
  is_core: boolean | null
}
