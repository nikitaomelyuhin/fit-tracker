import { describe, expect, it } from 'vitest'
import { addDays, daysBetween, weekStartFor } from './index'

describe('даты', () => {
  it('неделя начинается со среды', () => {
    expect(weekStartFor('2026-10-21')).toBe('2026-10-21') // среда
    expect(weekStartFor('2026-10-22')).toBe('2026-10-21') // четверг
    expect(weekStartFor('2026-10-20')).toBe('2026-10-14') // вторник — ещё прошлая неделя
  })

  it('addDays переходит через год', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('daysBetween', () => {
    expect(daysBetween('2026-09-01', '2026-09-15')).toBe(14)
    expect(daysBetween('2026-09-15', '2026-09-01')).toBe(-14)
  })
})
