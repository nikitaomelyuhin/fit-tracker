import { defineStore } from 'pinia'
import { supabase } from '@/shared/supabase'
import { estimateBodyFatMale } from '@/shared/lib/bodyfat'
import { HEIGHT_CM } from '@/shared/config/profile'
import { mapMeasurement } from '../helpers/mapMeasurement'
import type { Measurement, MeasurementInput, MeasurementRow } from './types'

interface State {
  items: Measurement[]
  loading: boolean
  error: string | null
}

export const useMeasurementStore = defineStore('measurement', {
  state: (): State => ({ items: [], loading: false, error: null }),

  getters: {
    byDateAsc: (state): Measurement[] =>
      [...state.items].sort((a, b) => (a.date > b.date ? 1 : -1)),
    byDateDesc: (state): Measurement[] =>
      [...state.items].sort((a, b) => (a.date < b.date ? 1 : -1)),
    latest(): Measurement | null {
      return this.byDateDesc[0] ?? null
    },
    /** Предыдущий замер до последнего — точка сравнения "было → стало". */
    previous(): Measurement | null {
      return this.byDateDesc[1] ?? null
    },
    latestBodyFatPct(): number | null {
      return this.latest?.waist != null ? estimateBodyFatMale(this.latest.waist, HEIGHT_CM) : null
    },
    previousBodyFatPct(): number | null {
      return this.previous?.waist != null
        ? estimateBodyFatMale(this.previous.waist, HEIGHT_CM)
        : null
    },
    /** Изменение % жира с прошлого замера: <0 — жира стало меньше. */
    bodyFatDeltaPct(): number | null {
      if (this.latestBodyFatPct == null || this.previousBodyFatPct == null) return null
      return Math.round((this.latestBodyFatPct - this.previousBodyFatPct) * 10) / 10
    },
    /** Изменение талии с прошлого замера (см): <0 — талия уменьшилась. */
    waistDeltaCm(): number | null {
      if (this.latest?.waist == null || this.previous?.waist == null) return null
      return Math.round((this.latest.waist - this.previous.waist) * 10) / 10
    },
  },

  actions: {
    async load() {
      this.loading = true
      this.error = null
      const { data, error } = await supabase
        .from('measurements')
        .select('*')
        .order('date', { ascending: true })
      if (error) this.error = error.message
      else this.items = (data as MeasurementRow[]).map(mapMeasurement)
      this.loading = false
    },

    async upsert(input: MeasurementInput): Promise<boolean> {
      this.error = null
      const { data, error } = await supabase
        .from('measurements')
        .upsert(
          {
            date: input.date,
            waist: input.waist,
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

      const saved = mapMeasurement(data as MeasurementRow)
      const index = this.items.findIndex((item) => item.date === saved.date)
      if (index >= 0) this.items[index] = saved
      else this.items.push(saved)
      return true
    },

    async remove(id: string) {
      this.error = null
      const { error } = await supabase.from('measurements').delete().eq('id', id)
      if (error) {
        this.error = error.message
        return
      }
      this.items = this.items.filter((item) => item.id !== id)
    },
  },
})
