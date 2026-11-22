import { describe, expect, it } from 'vitest'
import type { Exercise } from '@/entities/Exercise'
import { sortByRecent } from './sortByRecent'

function exercise(name: string): Exercise {
  return { id: name, name, category: 'back', isCore: false }
}

describe('sortByRecent', () => {
  it('недавние сверху, несделанные — в конце по алфавиту', () => {
    const lastDates = new Map([
      ['Тяга верхнего блока', '2026-11-14'],
      ['Подтягивания', '2026-11-21'],
    ])
    const sorted = sortByRecent(
      [exercise('Становая тяга'), exercise('Тяга верхнего блока'), exercise('Гиперэкстензия'), exercise('Подтягивания')],
      lastDates,
    )
    expect(sorted.map((item) => item.name)).toEqual([
      'Подтягивания',
      'Тяга верхнего блока',
      'Гиперэкстензия',
      'Становая тяга',
    ])
  })
})
