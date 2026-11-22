import { describe, expect, it } from 'vitest'
import { buildSessionEntries } from './buildSessionEntries'
import type { ExerciseForm } from '../model/types'

function form(exercise: string, weight: string, sets: string, reps: string): ExerciseForm {
  return { exercise, weight, sets, reps, nextWeight: '', nextSets: '', nextReps: '' }
}

describe('buildSessionEntries', () => {
  it('сохраняет сделанное по порядку, пропускает пустое и нули', () => {
    const entries = buildSessionEntries([
      form('Жим лёжа', '105', '3', '8'),
      form('Тяга нижнего блока', '0', '0', '0'),
      form('Махи', '', '', ''),
      form('Подтягивания', '0', '5', '6'),
      form('Молотки', '15,5', '4', '12'),
    ])
    expect(entries.map((entry) => [entry.exercise, entry.weight, entry.reps, entry.position])).toEqual([
      ['Жим лёжа', 105, 8, 0],
      ['Подтягивания', 0, 6, 1],
      ['Молотки', 15.5, 12, 2],
    ])
  })
})
