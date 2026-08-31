export type WorkoutType = 'A' | 'B'

export const WORKOUT_TYPES: WorkoutType[] = ['A', 'B']

export interface ExerciseDef {
  name: string
  /** true — «вес» это помощь (гравитрон): меньше = лучше. */
  assist?: boolean
}

/** Шаблоны тренировок — упражнения по порядку. */
export const WORKOUT_TEMPLATES: Record<WorkoutType, ExerciseDef[]> = {
  A: [
    { name: 'Жим лёжа' },
    { name: 'Тяга верхнего блока' },
    { name: 'Тяга нижнего блока' },
    { name: 'Плечи — махи' },
  ],
  B: [
    { name: 'Многоповторный жим' },
    { name: 'Подтягивания (гравитрон)', assist: true },
    { name: 'Ноги — перёд/зад бедра' },
    { name: 'Плечи — махи' },
  ],
}

export function exerciseNames(type: WorkoutType): string[] {
  return WORKOUT_TEMPLATES[type].map((exercise) => exercise.name)
}
