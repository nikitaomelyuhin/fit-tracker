import { describe, expect, it } from 'vitest'
import { formatSet } from './formatSet'

describe('formatSet', () => {
  it('собирает вес × подходы × повторы, пропуски — прочерком', () => {
    expect(formatSet(105, 3, 8)).toBe('105 × 3 × 8')
    expect(formatSet(null, 4, 18)).toBe('— × 4 × 18')
  })
})
