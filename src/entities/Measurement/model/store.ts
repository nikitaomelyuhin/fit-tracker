import { defineStore } from 'pinia'
import { supabase } from '@/shared/supabase'
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
            chest: input.chest,
            shoulders: input.shoulders,
            arm: input.arm,
            forearm: input.forearm,
            neck: input.neck,
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
