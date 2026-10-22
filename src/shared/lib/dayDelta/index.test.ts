import { describe, expect, it } from 'vitest'
import { classifyDayDelta } from './index'

describe('classifyDayDelta', () => {
  it('первая запись без предыдущей', () => {
    expect(classifyDayDelta(null)).toBe('first')
  })

  it('пороги: ±0.15 — шум, ≥0.7 — «чёрная зона»', () => {
    expect(classifyDayDelta(-0.15)).toBe('down')
    expect(classifyDayDelta(-0.1)).toBe('flat')
    expect(classifyDayDelta(0.14)).toBe('flat')
    expect(classifyDayDelta(0.15)).toBe('up')
    expect(classifyDayDelta(0.69)).toBe('up')
    expect(classifyDayDelta(0.7)).toBe('strong')
  })
})
