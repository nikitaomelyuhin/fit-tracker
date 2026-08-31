import { defineStore } from 'pinia'
import { supabase } from '@/shared/supabase'
import { currentWeekStartISO, weekStartFor } from '@/shared/lib/date'
import { mapWeightLog } from '../helpers/mapWeightLog'
import type { WeightLog, WeightLogInput, WeightLogRow } from './types'

interface State {
  items: WeightLog[]
  loading: boolean
  error: string | null
}

export const useWeightLogStore = defineStore('weightLog', {
  state: (): State => ({ items: [], loading: false, error: null }),

  getters: {
    byDateAsc: (state): WeightLog[] =>
      [...state.items].sort((a, b) => (a.date > b.date ? 1 : -1)),
    byDateDesc: (state): WeightLog[] =>
      [...state.items].sort((a, b) => (a.date < b.date ? 1 : -1)),
    latest(): WeightLog | null {
      return this.byDateDesc[0] ?? null
    },
    /** Средний вес за текущую неделю (среда → вторник). */
    currentWeekAverage(): number | null {
      const start = currentWeekStartISO()
      const week = this.items.filter((item) => item.date >= start)
      if (!week.length) return null
      const sum = week.reduce((acc, item) => acc + item.weight, 0)
      return Math.round((sum / week.length) * 10) / 10
    },
    /** Для каждой точки byDateAsc — средний вес её недели (для линии на графике). */
    weeklyAverageByDateAsc(): number[] {
      const rows = this.byDateAsc
      const buckets = new Map<string, { total: number; count: number }>()
      for (const row of rows) {
        const key = weekStartFor(row.date)
        const bucket = buckets.get(key) ?? { total: 0, count: 0 }
        bucket.total += row.weight
        bucket.count += 1
        buckets.set(key, bucket)
      }
      return rows.map((row) => {
        const bucket = buckets.get(weekStartFor(row.date))!
        return Math.round((bucket.total / bucket.count) * 10) / 10
      })
    },
  },

  actions: {
    async load() {
      this.loading = true
      this.error = null
      const { data, error } = await supabase
        .from('weight_logs')
        .select('*')
        .order('date', { ascending: true })
      if (error) this.error = error.message
      else this.items = (data as WeightLogRow[]).map(mapWeightLog)
      this.loading = false
    },

    async upsert(input: WeightLogInput): Promise<boolean> {
      this.error = null
      const { data, error } = await supabase
        .from('weight_logs')
        .upsert(
          {
            date: input.date,
            weight: input.weight,
            body_fat: input.bodyFat,
            note: input.note,
          },
          { onConflict: 'user_id,date' },
        )
        .select()
        .single()

      if (error) {
        this.error = error.message
        return false
      }

      const saved = mapWeightLog(data as WeightLogRow)
      const index = this.items.findIndex((item) => item.date === saved.date)
      if (index >= 0) this.items[index] = saved
      else this.items.push(saved)
      return true
    },

    async remove(id: string) {
      this.error = null
      const { error } = await supabase.from('weight_logs').delete().eq('id', id)
      if (error) {
        this.error = error.message
        return
      }
      this.items = this.items.filter((item) => item.id !== id)
    },
  },
})
