import { defineStore } from 'pinia'
import { useWeightLogStore } from '@/entities/WeightLog'
import { useDiaryEntryStore } from '@/entities/DiaryEntry'
import { WEIGHT_GOAL_KG, WEIGHT_MILESTONES_KG, WEIGHT_MINOR_STEP_KG } from '@/shared/config/goals'
import { DAILY_KCAL_TARGET } from '@/shared/config/pace'
import { FAT_SHARE_OF_LOSS } from '@/shared/config/profile'
import { estimateBodyFatPct, projectBodyFatPct } from '@/shared/lib/bodyFat'
import { addDays, todayISO } from '@/shared/lib/date'
import { milestonePoints } from '../helpers/milestonePoints'
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

    /**
     * % жира не по замерам (их нет), а по дефициту: сколько жира должно было уйти
     * по факту питания (дневник, где его нет — эффективное среднее), вычитается
     * из стартовой жировой массы. Вес отдельно, жир отдельно — а не «весь
     * сброшенный вес = жир», что неверно из-за воды и мышц.
     */
    bodyFatPct: (): number | null => {
      const weightLog = useWeightLogStore()
      const diary = useDiaryEntryStore()
      const start = weightLog.byDateAsc[0]
      const currentWeight = weightLog.smoothedWeight ?? weightLog.byDateDesc[0]?.weight ?? null
      if (!start || currentWeight == null) return null

      const weightByDate = new Map(weightLog.byDateAsc.map((w) => [w.date, w.weight]))
      const kcalByDate = new Map(diary.dailyKcalWithCheatAsc.map((d) => [d.date, d.kcal]))

      return estimateBodyFatPct({
        startDate: start.date,
        startWeight: start.weight,
        toDate: todayISO(),
        weightAtTarget: currentWeight,
        weightAt: (date) => weightByDate.get(date) ?? weightLog.smoothedWeight,
        kcalAt: (date) => kcalByDate.get(date) ?? null,
        fallbackKcal: diary.effectiveDailyKcal(DAILY_KCAL_TARGET),
      })
    },

    pace(): PaceBand {
      return paceBand(this.ratePerWeek)
    },

    /**
     * Отметки до цели: основные — всегда (пройденные с галочкой), мелкие через
     * каждый килограмм — только впереди, «для интереса». У непройденных — дата
     * по текущему темпу и прогноз % жира на этом весе.
     */
    milestones(): GoalMilestone[] {
      const cleanStart = useWeightLogStore().cleanStart
      const current = this.current
      const rate = cleanStart?.ready ? cleanStart.ratePerWeek : null
      const fatPct = this.bodyFatPct

      return milestonePoints(WEIGHT_MILESTONES_KG, WEIGHT_GOAL_KG, WEIGHT_MINOR_STEP_KG)
        .map(({ weight, kind }) => {
          const reached = current != null && current <= weight
          let expectedDate: string | null = null
          if (!reached && current != null && rate != null && rate > 0) {
            const daysNeeded = (current - weight) / (rate / 7)
            expectedDate = addDays(todayISO(), Math.round(daysNeeded))
          }
          const bodyFatPct =
            !reached && current != null && fatPct != null
              ? projectBodyFatPct({
                  currentWeight: current,
                  currentFatPct: fatPct,
                  targetWeight: weight,
                  fatShare: FAT_SHARE_OF_LOSS,
                })
              : null
          return { weight, kind, reached, bodyFatPct, expectedDate }
        })
        .filter((point) => point.kind === 'main' || !point.reached)
    },
  },
})
