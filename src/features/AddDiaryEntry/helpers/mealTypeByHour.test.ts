import { describe, expect, it } from 'vitest'
import { mealTypeByHour } from './mealTypeByHour'

describe('mealTypeByHour', () => {
  it('угадывает приём пищи по часу', () => {
    expect(mealTypeByHour(8)).toBe('breakfast')
    expect(mealTypeByHour(13)).toBe('lunch')
    expect(mealTypeByHour(16)).toBe('snack')
    expect(mealTypeByHour(19)).toBe('dinner')
    expect(mealTypeByHour(23)).toBe('snack')
    expect(mealTypeByHour(3)).toBe('snack')
  })
})
