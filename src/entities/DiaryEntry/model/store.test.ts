import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useDiaryEntryStore } from './store'
import { useCheatDayStore } from '@/entities/CheatDay'
import { CHEAT_DAY_KCAL } from '@/shared/config/nutrition'
import type { DiaryEntry } from './types'

// Тестируем расчёты, а не сеть: клиент Supabase не нужен (и на Node 20 падает при создании).
vi.mock('@/shared/supabase', () => ({ supabase: {} }))

function food(date: string, kcal: number): DiaryEntry {
  return {
    id: `${date}-${kcal}`,
    date,
    mealType: 'lunch',
    productId: null,
    productName: 'еда',
    amount: 1,
    kcal,
    protein: 0,
    fat: 0,
    carbs: 0,
    fiber: 0,
  }
}

describe('DiaryEntry: средние ккал', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-22T12:00:00'))

    useDiaryEntryStore().items = [
      food('2026-10-19', 2000),
      food('2026-10-20', 4000), // читмил, записан «от балды»
      food('2026-10-21', 1800),
      food('2026-10-22', 1000), // сегодня, день не закончен
    ]
    useCheatDayStore().items = [{ id: 'c1', date: '2026-10-20' }]
  })

  afterEach(() => vi.useRealTimers())

  it('в средние не идут сегодняшний неполный день и читмилы', () => {
    const store = useDiaryEntryStore()
    expect(store.completedDailyKcalAsc.map((day) => day.date)).toEqual(['2026-10-19', '2026-10-21'])
    expect(store.recentAverageKcal(7)).toBe(1900)
  })

  it('пока меньше 7 полных дней — эффективная цель берётся из конфига', () => {
    expect(useDiaryEntryStore().effectiveDailyKcal(2100)).toBe(2100)
  })

  it('на графике читмил стоит условными ккал с флагом', () => {
    const cheat = useDiaryEntryStore().dailyKcalWithCheatAsc.find((day) => day.date === '2026-10-20')
    expect(cheat).toEqual({ date: '2026-10-20', kcal: CHEAT_DAY_KCAL, cheat: true })
  })
})
