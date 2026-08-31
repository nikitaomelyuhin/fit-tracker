import { defineStore } from 'pinia'
import { supabase } from '@/shared/supabase'
import { exerciseNames, type WorkoutType } from '@/shared/config/workouts'
import { mapWorkout } from '../helpers/mapWorkout'
import type { Workout, WorkoutEntryInput, WorkoutRow, WorkoutSession } from './types'

interface State {
  items: Workout[]
  loading: boolean
  error: string | null
}

export const useWorkoutStore = defineStore('workout', {
  state: (): State => ({ items: [], loading: false, error: null }),

  getters: {
    byDateDesc: (state): Workout[] => [...state.items].sort((a, b) => (a.date < b.date ? 1 : -1)),

    /** Сессии (дата + тип), свежие сверху, упражнения — в порядке шаблона. */
    sessions(): WorkoutSession[] {
      const map = new Map<string, Workout[]>()
      for (const item of this.items) {
        const key = `${item.date}|${item.type ?? ''}`
        const bucket = map.get(key) ?? []
        bucket.push(item)
        map.set(key, bucket)
      }

      const result: WorkoutSession[] = [...map.entries()].map(([key, entries]) => {
        const [date, typeRaw] = key.split('|')
        const type = (typeRaw || null) as WorkoutType | null
        const order = type ? exerciseNames(type) : []
        entries.sort((a, b) => order.indexOf(a.exercise) - order.indexOf(b.exercise))
        return { date, type, entries }
      })

      result.sort((a, b) => (a.date < b.date ? 1 : -1))
      return result
    },

    /** Тип, который логично тренировать следующим (чередование A/B). */
    suggestedType(): WorkoutType {
      const last = this.byDateDesc.find((item) => item.type != null)
      return last?.type === 'A' ? 'B' : 'A'
    },

    /** Последняя запись по упражнению (в любой тренировке A/B) до указанной даты. */
    lastEntryFor(): (exercise: string, beforeDate?: string) => Workout | null {
      return (exercise, beforeDate) => {
        const matches = this.items
          .filter((item) => item.exercise === exercise && (!beforeDate || item.date < beforeDate))
          .sort((a, b) => (a.date < b.date ? 1 : -1))
        return matches[0] ?? null
      }
    },
  },

  actions: {
    async load() {
      this.loading = true
      this.error = null
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .order('date', { ascending: false })
      if (error) this.error = error.message
      else this.items = (data as WorkoutRow[]).map(mapWorkout)
      this.loading = false
    },

    /** Сохранить всю сессию (upsert по дата+тип+упражнение). */
    async saveSession(
      date: string,
      type: WorkoutType,
      entries: WorkoutEntryInput[],
    ): Promise<boolean> {
      this.error = null
      const rows = entries.map((entry) => ({
        date,
        workout_type: type,
        exercise: entry.exercise,
        weight: entry.weight,
        sets: entry.sets,
        reps: entry.reps,
        next_weight: entry.nextWeight,
        next_sets: entry.nextSets,
        next_reps: entry.nextReps,
      }))

      const { data, error } = await supabase
        .from('workouts')
        .upsert(rows, { onConflict: 'user_id,date,workout_type,exercise' })
        .select()

      if (error) {
        this.error = error.message
        return false
      }

      const saved = (data as WorkoutRow[]).map(mapWorkout)
      for (const row of saved) {
        const index = this.items.findIndex(
          (item) =>
            item.date === row.date && item.type === row.type && item.exercise === row.exercise,
        )
        if (index >= 0) this.items[index] = row
        else this.items.push(row)
      }
      return true
    },

    async removeSession(date: string, type: WorkoutType | null) {
      this.error = null
      const { error } = await supabase
        .from('workouts')
        .delete()
        .eq('date', date)
        .eq('workout_type', type)
      if (error) {
        this.error = error.message
        return
      }
      this.items = this.items.filter((item) => !(item.date === date && item.type === type))
    },
  },
})
