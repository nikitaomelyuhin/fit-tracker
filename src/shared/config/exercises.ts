/** Группа мышц упражнения в справочнике. */
export type ExerciseCategory = 'chest' | 'back' | 'shoulders' | 'arms' | 'legs' | 'abs' | 'other'

/** Группы в порядке показа; «Другое» — для того, что никуда не отнесено. */
export const EXERCISE_CATEGORIES: { value: ExerciseCategory; label: string }[] = [
  { value: 'chest', label: 'Грудь' },
  { value: 'back', label: 'Спина' },
  { value: 'shoulders', label: 'Плечи' },
  { value: 'arms', label: 'Руки' },
  { value: 'legs', label: 'Ноги' },
  { value: 'abs', label: 'Пресс' },
  { value: 'other', label: 'Другое' },
]

export function exerciseCategoryLabel(category: ExerciseCategory): string {
  return EXERCISE_CATEGORIES.find((item) => item.value === category)?.label ?? 'Другое'
}

export function toExerciseCategory(value: string): ExerciseCategory {
  return EXERCISE_CATEGORIES.some((item) => item.value === value) ? (value as ExerciseCategory) : 'other'
}
