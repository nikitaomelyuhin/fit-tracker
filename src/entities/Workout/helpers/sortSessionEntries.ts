import type { Workout } from '../model/types'

/** Упражнения тренировки в порядке выполнения; без известного порядка — в конце, по алфавиту. */
export function sortSessionEntries(entries: Workout[]): Workout[] {
  return [...entries].sort((a, b) => {
    if (a.position != null && b.position != null && a.position !== b.position) return a.position - b.position
    if (a.position != null && b.position == null) return -1
    if (a.position == null && b.position != null) return 1
    return a.exercise.localeCompare(b.exercise, 'ru')
  })
}
