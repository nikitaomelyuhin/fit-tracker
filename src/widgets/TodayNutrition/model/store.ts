import { defineStore } from 'pinia'
import { useCheatDayStore } from '@/entities/CheatDay'
import { useDiaryEntryStore, type DailyTotals, type DiaryEntry } from '@/entities/DiaryEntry'
import { MEAL_TYPES, MEAL_TYPE_LABELS, DAILY_FIBER_RANGE, type MealType } from '@/shared/config/nutrition'
import { DAILY_KCAL_RANGE, DAILY_KCAL_TARGET } from '@/shared/config/pace'
import { addDays } from '@/shared/lib/date'
import { today } from '@/shared/lib/today'
import { showSaveError, showToast } from '@/shared/lib/toast'
import type { KcalStatus, TodayMeal } from './types'

function entriesFor(date: string, mealType: MealType): DiaryEntry[] {
  return useDiaryEntryStore().items.filter((entry) => entry.date === date && entry.mealType === mealType)
}

function sumKcal(entries: DiaryEntry[]): number {
  return Math.round(entries.reduce((sum, entry) => sum + entry.kcal, 0))
}

/** Питание за сегодня: калории против коридора, БЖУ и приёмы пищи. */
export const useTodayNutritionStore = defineStore('todayNutrition', {
  state: () => ({
    /** Приём пищи, который сейчас копируется «как вчера» (кнопка в ожидании). */
    repeating: null as MealType | null,
  }),

  getters: {
    target: (): number => DAILY_KCAL_TARGET,
    range: () => DAILY_KCAL_RANGE,
    fiberRange: () => DAILY_FIBER_RANGE,

    totals: (): DailyTotals => useDiaryEntryStore().totalsForDate(today.value),

    isCheat: (): boolean => useCheatDayStore().isCheat(today.value),

    status(): KcalStatus {
      if (this.isCheat) return 'cheat'
      const kcal = this.totals.kcal
      if (kcal === 0) return 'empty'
      if (kcal > this.range.max) return 'over'
      if (kcal >= this.range.min) return 'inRange'
      return 'under'
    },

    /** До оптимума коридора; отрицательное — перебор. */
    remainingKcal(): number {
      return this.target - this.totals.kcal
    },

    /** Заполненность кольца: верх коридора = полный круг. */
    ringShare(): number {
      return Math.min(1, this.totals.kcal / this.range.max)
    },

    meals(): TodayMeal[] {
      const yesterday = addDays(today.value, -1)
      return MEAL_TYPES.map((mealType) => {
        const entries = entriesFor(today.value, mealType)
        const yesterdayEntries = entries.length ? [] : entriesFor(yesterday, mealType)
        return {
          mealType,
          label: MEAL_TYPE_LABELS[mealType],
          kcal: entries.length ? sumKcal(entries) : null,
          names: entries.map((entry) => entry.productName),
          yesterdayKcal: yesterdayEntries.length ? sumKcal(yesterdayEntries) : null,
        }
      })
    },
  },

  actions: {
    /** Повторить вчерашний приём пищи сегодня — одним нажатием, теми же порциями. */
    async repeatYesterday(mealType: MealType): Promise<boolean> {
      const source = entriesFor(addDays(today.value, -1), mealType)
      if (!source.length || this.repeating) return false

      this.repeating = mealType
      const diary = useDiaryEntryStore()
      const ok = await diary.addMany(
        source.map((entry) => ({
          date: today.value,
          mealType,
          productId: entry.productId,
          productName: entry.productName,
          amount: entry.amount,
          kcal: entry.kcal,
          protein: entry.protein,
          fat: entry.fat,
          carbs: entry.carbs,
          fiber: entry.fiber,
        })),
      )
      this.repeating = null

      if (ok) showToast(`${MEAL_TYPE_LABELS[mealType]} — как вчера`)
      else showSaveError(diary.error)
      return ok
    },
  },
})
