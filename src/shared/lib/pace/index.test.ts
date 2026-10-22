import { describe, expect, it } from 'vitest'
import { computeCleanStart, idealDaysTo, maintenanceKcal, sumDeficitKcal } from './index'
import { addDays } from '@/shared/lib/date'

describe('maintenanceKcal', () => {
  it('Миффлин × 1.4 для роста 185, возраста 32', () => {
    // BMR = 10·100 + 6.25·185 − 5·32 + 5 = 2001.25; × 1.4
    expect(maintenanceKcal(100)).toBeCloseTo(2801.75, 2)
  })
})

describe('sumDeficitKcal', () => {
  const kcal: Record<string, number> = { '2026-10-01': 1801.75, '2026-10-03': 2801.75 }
  const base = {
    fromDate: '2026-10-01',
    toDate: '2026-10-03',
    weightAt: () => 100,
    kcalAt: (date: string) => kcal[date] ?? null,
  }

  it('дни без дневника пропускаются, а не считаются нулём', () => {
    expect(sumDeficitKcal(base)).toEqual({ totalDeficitKcal: 1000, countedDays: 2 })
  })

  it('с fallback пропуск закрывается этим значением', () => {
    const result = sumDeficitKcal({ ...base, fallbackKcal: 2301.75 })
    expect(result.countedDays).toBe(3)
    expect(result.totalDeficitKcal).toBeCloseTo(1500, 6)
  })
})

describe('computeCleanStart', () => {
  // Старт 107 кг 1 сен, окно адаптации 10 дней → «чистая» точка 11 сен.
  const entries = [
    { date: '2026-09-01', weight: 107 },
    ...Array.from({ length: 7 }, (_, i) => ({ date: addDays('2026-09-11', i), weight: 104 })),
  ]

  it('меньше двух недель после окна — темп ещё не считается', () => {
    const result = computeCleanStart([...entries, { date: '2026-09-20', weight: 103.5 }], 103.5)
    expect(result?.ready).toBe(false)
    expect(result?.baselineWeight).toBe(104)
    expect(result?.ratePerWeek).toBeNull()
  })

  it('отделяет воду окна адаптации от жира', () => {
    const result = computeCleanStart([...entries, { date: '2026-09-25', weight: 102.6 }], 102.6)!
    expect(result.ready).toBe(true)
    // (104 − 102.6) / 14 дней = 0.1 кг/день → 0.7 кг/нед; за окно ушло 1.0 кг жира
    expect(result.ratePerWeek).toBeCloseTo(0.7, 6)
    expect(result.fatDropInWindowKg).toBeCloseTo(1, 6)
    // из 3 кг стартового падения (107 → 104) вода — 2 кг
    expect(result.waterDropKg).toBeCloseTo(2, 6)
  })
})

describe('idealDaysTo', () => {
  it('больше дефицит — быстрее к цели', () => {
    const slow = idealDaysTo(104, 88, 2300)
    const fast = idealDaysTo(104, 88, 2000)
    expect(fast).toBeGreaterThan(0)
    expect(fast).toBeLessThan(slow)
  })
})
