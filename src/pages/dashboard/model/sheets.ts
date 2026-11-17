import { defineStore } from 'pinia'
import { useAddDiaryEntryStore } from '@/features/AddDiaryEntry'
import { useAddWeightStore } from '@/features/AddWeightEntry'
import type { MealType } from '@/shared/config/nutrition'
import type { DashboardSheet } from './types'

/**
 * Какая шторка ввода открыта. Черновик формы живёт в сторе фичи, поэтому
 * закрыть шторку не страшно — при следующем открытии ввод на месте.
 */
export const useDashboardSheetsStore = defineStore('dashboardSheets', {
  state: () => ({ active: null as DashboardSheet | null }),

  actions: {
    openWeight() {
      useAddWeightStore().refreshDateIfUntouched()
      this.active = 'weight'
    },

    openFood(mealType?: MealType) {
      useAddDiaryEntryStore().prepare(mealType)
      this.active = 'food'
    },

    close() {
      this.active = null
    },
  },
})
