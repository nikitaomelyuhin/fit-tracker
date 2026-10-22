import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useWeightLogStore } from './store'
import type { WeightLog } from './types'

// Тестируем расчёты, а не сеть: клиент Supabase не нужен (и на Node 20 падает при создании).
vi.mock('@/shared/supabase', () => ({ supabase: {} }))

function entry(date: string, weight: number): WeightLog {
  return { id: date, date, weight, bodyFat: null, note: null }
}

describe('WeightLog: дневные дельты и ПП-стрик', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('пропуск дней не превращает обычный темп в «чёрную зону»', () => {
    const store = useWeightLogStore()
    store.items = [
      entry('2026-09-01', 100),
      entry('2026-09-02', 100.1), // +0.1 за день — шум
      entry('2026-09-05', 100.9), // +0.8 за 3 дня = +0.27/день — «вверх», не «сильно»
      entry('2026-09-06', 101.7), // +0.8 за 1 день — «сильно вверх»
    ]
    expect(store.dailyDeltaClasses).toEqual(['first', 'flat', 'up', 'strong'])
  })

  it('стрик рвётся только «чёрной зоной»', () => {
    const store = useWeightLogStore()
    store.items = [
      entry('2026-09-01', 100),
      entry('2026-09-02', 100.1),
      entry('2026-09-03', 100.8), // +0.7 — рвёт
      entry('2026-09-04', 100.5),
      entry('2026-09-05', 100.4),
    ]
    expect(store.currentStreak).toBe(2)
    expect(store.bestStreak).toBe(2)
  })
})
