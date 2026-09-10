import { defineStore } from 'pinia'
import { supabase } from '@/shared/supabase'
import { MEAL_TYPES } from '@/shared/config/nutrition'
import { addDays, todayISO } from '@/shared/lib/date'
import { mapDiaryEntry } from '../helpers/mapDiaryEntry'
import type {
  DailyTotals,
  DiaryDayGroup,
  DiaryEntry,
  DiaryEntryInput,
  DiaryEntryRow,
  MealGroup,
} from './types'

interface State {
  items: DiaryEntry[]
  loading: boolean
  error: string | null
}

function emptyTotals(): DailyTotals {
  return { kcal: 0, protein: 0, fat: 0, carbs: 0 }
}

function round1(value: number): number {
  return Math.round(value * 10) / 10
}

function sumTotals(entries: DiaryEntry[]): DailyTotals {
  const totals = entries.reduce((acc, entry) => {
    acc.kcal += entry.kcal
    acc.protein += entry.protein
    acc.fat += entry.fat
    acc.carbs += entry.carbs
    return acc
  }, emptyTotals())
  return {
    kcal: Math.round(totals.kcal),
    protein: round1(totals.protein),
    fat: round1(totals.fat),
    carbs: round1(totals.carbs),
  }
}

function toRow(input: DiaryEntryInput) {
  return {
    date: input.date,
    meal_type: input.mealType,
    product_id: input.productId,
    product_name: input.productName,
    amount: input.amount,
    kcal: input.kcal,
    protein: input.protein,
    fat: input.fat,
    carbs: input.carbs,
  }
}

export const useDiaryEntryStore = defineStore('diaryEntry', {
  state: (): State => ({ items: [], loading: false, error: null }),

  getters: {
    byDateDesc: (state): DiaryEntry[] =>
      [...state.items].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.id.localeCompare(a.id))),

    /** Дни (свежие сверху) → приёмы пищи по времени суток → записи, с итогами на каждом уровне. */
    groupedByDateDesc(): DiaryDayGroup[] {
      const byDate = new Map<string, DiaryEntry[]>()
      for (const entry of this.items) {
        const arr = byDate.get(entry.date) ?? []
        arr.push(entry)
        byDate.set(entry.date, arr)
      }

      return [...byDate.entries()]
        .sort((a, b) => (a[0] < b[0] ? 1 : -1))
        .map(([date, dayEntries]) => {
          const byMeal = new Map<string, DiaryEntry[]>()
          for (const entry of dayEntries) {
            const arr = byMeal.get(entry.mealType) ?? []
            arr.push(entry)
            byMeal.set(entry.mealType, arr)
          }

          const meals: MealGroup[] = MEAL_TYPES.filter((type) => byMeal.has(type)).map((type) => {
            const entries = byMeal.get(type)!
            return { mealType: type, entries, totals: sumTotals(entries) }
          })

          return { date, meals, totals: sumTotals(dayEntries) }
        })
    },

    /** Итоги БЖУ за конкретную дату (для формы — «уже съедено сегодня»). */
    totalsForDate(): (date: string) => DailyTotals {
      return (date: string) => {
        const group = this.groupedByDateDesc.find((g) => g.date === date)
        return group?.totals ?? emptyTotals()
      }
    },

    /**
     * Ккал по дням, по возрастанию даты — только дни, где реально есть запись.
     * Пропуски (не вёл дневник) просто не создают точку, а не считаются нулём.
     */
    dailyKcalAsc(): { date: string; kcal: number }[] {
      return [...this.groupedByDateDesc]
        .map((day) => ({ date: day.date, kcal: day.totals.kcal }))
        .sort((a, b) => (a.date < b.date ? -1 : 1))
    },

    /** Среднее ккал за последние N календарных дней, только по дням с записями. */
    recentAverageKcal(): (days: number) => number | null {
      return (days: number) => {
        const since = addDays(todayISO(), -(days - 1))
        const recent = this.dailyKcalAsc.filter((d) => d.date >= since)
        if (!recent.length) return null
        return Math.round(recent.reduce((sum, d) => sum + d.kcal, 0) / recent.length)
      }
    },

    /** Среднее ккал по дням с записями в диапазоне [from, to] включительно. null — нет данных. */
    averageKcalInRange(): (from: string, to: string) => number | null {
      return (from: string, to: string) => {
        const days = this.dailyKcalAsc.filter((d) => d.date >= from && d.date <= to)
        if (!days.length) return null
        return Math.round(days.reduce((sum, d) => sum + d.kcal, 0) / days.length)
      }
    },
  },

  actions: {
    async load() {
      this.loading = true
      this.error = null
      const { data, error } = await supabase
        .from('diary_entries')
        .select('*')
        .order('date', { ascending: false })
      if (error) this.error = error.message
      else this.items = (data as DiaryEntryRow[]).map(mapDiaryEntry)
      this.loading = false
    },

    async add(input: DiaryEntryInput): Promise<boolean> {
      return this.addMany([input])
    },

    /** Сохранить несколько блюд одного приёма пищи одним запросом. */
    async addMany(inputs: DiaryEntryInput[]): Promise<boolean> {
      if (!inputs.length) return false
      this.error = null
      const { data, error } = await supabase
        .from('diary_entries')
        .insert(inputs.map(toRow))
        .select()

      if (error) {
        this.error = error.message
        return false
      }
      this.items.push(...(data as DiaryEntryRow[]).map(mapDiaryEntry))
      return true
    },

    /** Пересчитать запись под новое количество (граммы/штуки), сохраняя пропорцию БЖУ. */
    async updateAmount(id: string, amount: number): Promise<boolean> {
      this.error = null
      const entry = this.items.find((item) => item.id === id)
      if (!entry || entry.amount <= 0) return false

      const factor = amount / entry.amount
      const { data, error } = await supabase
        .from('diary_entries')
        .update({
          amount,
          kcal: Math.round(entry.kcal * factor),
          protein: round1(entry.protein * factor),
          fat: round1(entry.fat * factor),
          carbs: round1(entry.carbs * factor),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        this.error = error.message
        return false
      }
      const saved = mapDiaryEntry(data as DiaryEntryRow)
      const index = this.items.findIndex((item) => item.id === id)
      if (index >= 0) this.items[index] = saved
      return true
    },

    async remove(id: string) {
      this.error = null
      const { error } = await supabase.from('diary_entries').delete().eq('id', id)
      if (error) {
        this.error = error.message
        return
      }
      this.items = this.items.filter((item) => item.id !== id)
    },
  },
})
