import { defineStore } from 'pinia'
import { useWeightLogStore } from '@/entities/WeightLog'
import { WEIGHT_GOAL_KG, WEIGHT_MILESTONES_KG } from '@/shared/config/goals'
import { addDays, todayISO } from '@/shared/lib/date'
import { paceBand } from '../helpers/paceBand'
import type { GoalMilestone, PaceBand } from './types'

/**
 * «Путь к цели» — производные от журнала веса: прогресс, темп, контрольные точки.
 * Своего состояния нет, только геттеры поверх WeightLog.
 */
export const useGoalProgressStore = defineStore('goalProgress', {
  getters: {
    goal: (): number => WEIGHT_GOAL_KG,

    /** Сглаженный вес — тот же «текущий», от которого считаются и «Сброшено», и «Осталось». */
    current: (): number | null => useWeightLogStore().smoothedWeight,

    /** Старт без воды: стартовая отёчность не считается пройденным путём. */
    start: (): number | null => {
      const weightLog = useWeightLogStore()
      return weightLog.dryStartWeight ?? weightLog.byDateAsc[0]?.weight ?? null
    },

    reached(): boolean {
      return this.current != null && this.current <= this.goal
    },

    remainingKg(): number | null {
      return this.current != null ? Math.max(0, this.current - this.goal) : null
    },

    /** Сброшено от старта без воды. Пока записей меньше двух — считать не от чего. */
    lostKg(): number | null {
      if (useWeightLogStore().items.length < 2) return null
      return this.start != null && this.current != null ? this.start - this.current : null
    },

    progressPct(): number {
      if (this.current == null || this.start == null || this.start <= this.goal) {
        return this.reached ? 100 : 0
      }
      const value = ((this.start - this.current) / (this.start - this.goal)) * 100
      return Math.min(100, Math.max(0, Math.round(value)))
    },

    /** Темп по жиру — от «чистой» точки отсчёта, без стартового слива воды. */
    ratePerWeek: (): number | null => useWeightLogStore().cleanRatePerWeek,

    pace(): PaceBand {
      return paceBand(this.ratePerWeek)
    },

    /** Все отметки до цели: пройденные — галочкой, остальные — с ожидаемой датой. */
    milestones(): GoalMilestone[] {
      const cleanStart = useWeightLogStore().cleanStart
      const current = this.current
      const rate = cleanStart?.ready ? cleanStart.ratePerWeek : null

      return [...WEIGHT_MILESTONES_KG, WEIGHT_GOAL_KG].map((weight) => {
        const reached = current != null && current <= weight
        let expectedDate: string | null = null
        if (!reached && current != null && rate != null && rate > 0) {
          const daysNeeded = (current - weight) / (rate / 7)
          expectedDate = addDays(todayISO(), Math.round(daysNeeded))
        }
        return { weight, reached, expectedDate }
      })
    },
  },
})
