import { defineStore } from 'pinia'
import { supabase } from '@/shared/supabase'
import { currentWeekStartISO, weekStartFor, todayISO } from '@/shared/lib/date'
import { computeCleanStart, comparePaceWithPlan } from '@/shared/lib/pace'
import type { CleanStart, PaceVsPlan } from '@/shared/lib/pace'
import { classifyDayDelta } from '@/shared/lib/dayDelta'
import { DAILY_KCAL_TARGET } from '@/shared/config/pace'
import { WEIGHT_GOAL_KG } from '@/shared/config/goals'
import { mapWeightLog } from '../helpers/mapWeightLog'
import type { WeeklyAverage, WeightLog, WeightLogInput, WeightLogRow } from './types'

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

    /** Недельные средние по возрастанию, с разницей к прошлой неделе. */
    weeklyAverages(): WeeklyAverage[] {
      const buckets = new Map<string, { total: number; count: number }>()
      for (const row of this.byDateAsc) {
        const key = weekStartFor(row.date)
        const bucket = buckets.get(key) ?? { total: 0, count: 0 }
        bucket.total += row.weight
        bucket.count += 1
        buckets.set(key, bucket)
      }

      const weeks = [...buckets.entries()]
        .sort((a, b) => (a[0] > b[0] ? 1 : -1))
        .map(([weekStart, bucket]) => ({
          weekStart,
          averageKg: Math.round((bucket.total / bucket.count) * 10) / 10,
          entries: bucket.count,
        }))

      return weeks.map((week, index) => {
        const previous = index > 0 ? weeks[index - 1] : null
        const deltaKg = previous ? Math.round((week.averageKg - previous.averageKg) * 10) / 10 : null
        return {
          weekStart: week.weekStart,
          averageKg: week.averageKg,
          entries: week.entries,
          deltaKg,
          gapWeeks: previous
            ? Math.round(
                (new Date(week.weekStart).getTime() - new Date(previous.weekStart).getTime()) /
                  (7 * 24 * 3600 * 1000),
              )
            : null,
        }
      })
    },

    /** Средний вес за текущую неделю (среда → вторник). */
    currentWeekAverage(): number | null {
      const start = currentWeekStartISO()
      const week = this.items.filter((item) => item.date >= start)
      if (!week.length) return null
      const sum = week.reduce((acc, item) => acc + item.weight, 0)
      return Math.round((sum / week.length) * 10) / 10
    },

    /** Последняя неделя, в которой есть взвешивания. */
    latestWeek(): WeeklyAverage | null {
      const weeks = this.weeklyAverages
      return weeks.length ? weeks[weeks.length - 1] : null
    },

    /** Предыдущая неделя с данными (может быть не строго прошлой календарной). */
    previousWeek(): WeeklyAverage | null {
      const weeks = this.weeklyAverages
      return weeks.length > 1 ? weeks[weeks.length - 2] : null
    },

    /** Сдвиг недельного среднего к прошлой неделе (кг): <0 — снижение. */
    weekOverWeekDeltaKg(): number | null {
      return this.latestWeek?.deltaKg ?? null
    },

    /** Сглаженный текущий вес: недельное среднее вместо одного взвешивания. */
    smoothedWeight(): number | null {
      return this.currentWeekAverage ?? this.latestWeek?.averageKg ?? this.latest?.weight ?? null
    },

    /** Для каждой точки byDateAsc — средний вес её недели (для линии на графике). */
    weeklyAverageByDateAsc(): number[] {
      const byWeek = new Map(this.weeklyAverages.map((week) => [week.weekStart, week.averageKg]))
      return this.byDateAsc.map((row) => byWeek.get(weekStartFor(row.date))!)
    },

    /** Точка отсчёта без стартового слива воды — база для темпа и прогнозов. */
    cleanStart(): CleanStart | null {
      return computeCleanStart(
        this.byDateAsc.map((row) => ({ date: row.date, weight: row.weight })),
        this.smoothedWeight,
      )
    },

    /** Темп по жиру (кг/нед, положительный = снижение), без стартовой воды. */
    cleanRatePerWeek(): number | null {
      return this.cleanStart?.ratePerWeek ?? null
    },

    /**
     * Факт против плана: план отсчитывается от «чистой» точки, не от первого взвешивания.
     * Принимает необязательное переопределение ккал/день (реальное среднее из дневника
     * питания, когда его достаточно) — по умолчанию статичная цель из конфига.
     */
    paceVsPlan(): (dailyKcalOverride?: number) => PaceVsPlan | null {
      return (dailyKcalOverride?: number) => {
        const start = this.cleanStart
        if (!start) return null
        return comparePaceWithPlan({
          cleanStart: start,
          currentWeight: this.smoothedWeight,
          today: todayISO(),
          goalWeight: WEIGHT_GOAL_KG,
          dailyKcal: dailyKcalOverride ?? DAILY_KCAL_TARGET,
        })
      }
    },

    /** Взвешивания после окна адаптации — на них считается тренд. */
    cleanEntries(): WeightLog[] {
      const from = this.cleanStart?.baselineDate
      if (!from) return this.byDateAsc
      return this.byDateAsc.filter((row) => row.date >= from)
    },

    /**
     * Классификация каждой записи по дневной дельте (та же логика, что красит
     * ячейки календаря) — основа для ПП-стрика: «чёрная зона» (delta ≥ 0.7) его рвёт.
     */
    dailyDeltaClasses(): ReturnType<typeof classifyDayDelta>[] {
      const items = this.byDateAsc
      return items.map((item, index) => {
        const prev = index > 0 ? items[index - 1].weight : null
        const delta = prev != null ? Math.round((item.weight - prev) * 10) / 10 : null
        return classifyDayDelta(delta)
      })
    },

    /** Текущий ПП-стрик: подряд идущие записи без «чёрной» зоны, считая с конца. */
    currentStreak(): number {
      const classes = this.dailyDeltaClasses
      let streak = 0
      for (let i = classes.length - 1; i >= 0; i--) {
        if (classes[i] === 'strong') break
        streak++
      }
      return streak
    },

    /** Лучший ПП-стрик за всю историю. */
    bestStreak(): number {
      const classes = this.dailyDeltaClasses
      let best = 0
      let current = 0
      for (const cls of classes) {
        if (cls === 'strong') {
          current = 0
        } else {
          current++
          best = Math.max(best, current)
        }
      }
      return best
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
