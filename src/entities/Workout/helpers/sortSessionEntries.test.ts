import { describe, expect, it } from 'vitest'
import { sortSessionEntries } from './sortSessionEntries'
import type { Workout } from '../model/types'

function entry(exercise: string, position: number | null): Workout {
  return {
    id: exercise,
    date: '2026-11-22',
    type: null,
    exercise,
    weight: 10,
    sets: 3,
    reps: 10,
    nextWeight: null,
    nextSets: null,
    nextReps: null,
    note: null,
    position,
  }
}

describe('sortSessionEntries', () => {
  it('по порядку выполнения, без порядка — в конце по алфавиту', () => {
    const sorted = sortSessionEntries([
      entry('Молотки', null),
      entry('Подтягивания', 1),
      entry('Гиперэкстензия', null),
      entry('Жим лёжа', 0),
    ])
    expect(sorted.map((item) => item.exercise)).toEqual(['Жим лёжа', 'Подтягивания', 'Гиперэкстензия', 'Молотки'])
  })
})
