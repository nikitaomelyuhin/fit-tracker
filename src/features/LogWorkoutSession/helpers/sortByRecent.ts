import type { Exercise } from '@/entities/Exercise'

/** Сначала то, что делал недавно; ни разу не делал — в конце, по алфавиту. */
export function sortByRecent(exercises: Exercise[], lastDates: Map<string, string>): Exercise[] {
  return [...exercises].sort((a, b) => {
    const dateA = lastDates.get(a.name)
    const dateB = lastDates.get(b.name)
    if (dateA && dateB && dateA !== dateB) return dateA < dateB ? 1 : -1
    if (dateA && !dateB) return -1
    if (!dateA && dateB) return 1
    return a.name.localeCompare(b.name, 'ru')
  })
}
