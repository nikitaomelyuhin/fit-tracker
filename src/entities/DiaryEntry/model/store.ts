import { defineStore } from 'pinia'
import { supabase } from '@/shared/supabase'
import { mapDiaryEntry } from '../helpers/mapDiaryEntry'
import type { DailyTotals, DiaryDayGroup, DiaryEntry, DiaryEntryInput, DiaryEntryRow } from './types'

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

export const useDiaryEntryStore = defineStore('diaryEntry', {
  state: (): State => ({ items: [], loading: false, error: null }),

  getters: {
    byDateDesc: (state): DiaryEntry[] =>
      [...state.items].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.id.localeCompare(a.id))),

    /** Записи, сгруппированные по дате (свежие сверху), с итогами БЖУ за день. */
    groupedByDateDesc(): DiaryDayGroup[] {
      const byDate = new Map<string, DiaryEntry[]>()
      for (const entry of this.items) {
        const arr = byDate.get(entry.date) ?? []
        arr.push(entry)
        byDate.set(entry.date, arr)
      }

      return [...byDate.entries()]
        .sort((a, b) => (a[0] < b[0] ? 1 : -1))
        .map(([date, entries]) => {
          const totals = entries.reduce((acc, entry) => {
            acc.kcal += entry.kcal
            acc.protein += entry.protein
            acc.fat += entry.fat
            acc.carbs += entry.carbs
            return acc
          }, emptyTotals())
          return {
            date,
            entries,
            totals: {
              kcal: Math.round(totals.kcal),
              protein: round1(totals.protein),
              fat: round1(totals.fat),
              carbs: round1(totals.carbs),
            },
          }
        })
    },

    /** Итоги БЖУ за конкретную дату (для формы — «уже съедено сегодня»). */
    totalsForDate(): (date: string) => DailyTotals {
      return (date: string) => {
        const group = this.groupedByDateDesc.find((g) => g.date === date)
        return group?.totals ?? emptyTotals()
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
      this.error = null
      const { data, error } = await supabase
        .from('diary_entries')
        .insert({
          date: input.date,
          product_id: input.productId,
          product_name: input.productName,
          amount: input.amount,
          kcal: input.kcal,
          protein: input.protein,
          fat: input.fat,
          carbs: input.carbs,
        })
        .select()
        .single()

      if (error) {
        this.error = error.message
        return false
      }
      this.items.push(mapDiaryEntry(data as DiaryEntryRow))
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
