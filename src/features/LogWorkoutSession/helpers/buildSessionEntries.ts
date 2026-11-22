import type { WorkoutEntryInput } from '@/entities/Workout'
import { toNumber } from '@/shared/lib/number'
import type { ExerciseForm } from '../model/types'

/**
 * Упражнение сделано, если есть вес или повторы больше нуля. Нули во всех полях —
 * это «пропустил», такая строка не сохраняется. С собственным весом (подтягивания)
 * вес 0, но повторы есть — это результат.
 */
export function isFilled(item: ExerciseForm): boolean {
  return (toNumber(item.weight) ?? 0) > 0 || (toNumber(item.reps) ?? 0) > 0
}

/** Заполненные упражнения формы → записи для сохранения, в порядке выполнения. */
export function buildSessionEntries(exercises: ExerciseForm[]): WorkoutEntryInput[] {
  return exercises.filter(isFilled).map((item, position) => ({
    exercise: item.exercise,
    weight: toNumber(item.weight),
    sets: toNumber(item.sets),
    reps: toNumber(item.reps),
    nextWeight: toNumber(item.nextWeight),
    nextSets: toNumber(item.nextSets),
    nextReps: toNumber(item.nextReps),
    position,
  }))
}
