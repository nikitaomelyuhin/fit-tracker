import { defineStore } from 'pinia'
import { supabase } from '@/shared/supabase'
import type { CheatDay, CheatDayRow } from './types'

interface State {
  items: CheatDay[]
  loading: boolean
  error: string | null
}

export const useCheatDayStore = defineStore('cheatDay', {
  state: (): State => ({ items: [], loading: false, error: null }),

  getters: {
    byDateDesc: (state): CheatDay[] => [...state.items].sort((a, b) => (a.date < b.date ? 1 : -1)),

    isCheat(): (date: string) => boolean {
      const dates = new Set(this.items.map((item) => item.date))
      return (date: string) => dates.has(date)
    },
  },

  actions: {
    async load() {
      this.loading = true
      this.error = null
      const { data, error } = await supabase.from('cheat_days').select('id, date')
      if (error) this.error = error.message
      else this.items = (data as CheatDayRow[]).map((row) => ({ id: row.id, date: row.date }))
      this.loading = false
    },

    async add(date: string): Promise<boolean> {
      this.error = null
      const { data, error } = await supabase
        .from('cheat_days')
        .upsert({ date }, { onConflict: 'user_id,date' })
        .select('id, date')
        .single()
      if (error) {
        this.error = error.message
        return false
      }
      const saved = data as CheatDayRow
      if (!this.items.some((item) => item.id === saved.id)) this.items.push({ id: saved.id, date: saved.date })
      return true
    },

    async remove(id: string) {
      this.error = null
      const { error } = await supabase.from('cheat_days').delete().eq('id', id)
      if (error) {
        this.error = error.message
        return
      }
      this.items = this.items.filter((item) => item.id !== id)
    },
  },
})
