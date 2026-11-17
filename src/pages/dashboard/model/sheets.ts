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

  getters: {
    /** Пока в форме еды идёт поиск, шторка во всю высоту: поле сверху, список до клавиатуры. */
    foodExpanded: (): boolean => useAddDiaryEntryStore().isSearching,
  },

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
      // Поиск — временный режим: при следующем открытии форма снова целиком.
      if (this.active === 'food') useAddDiaryEntryStore().cancelSearch()
      this.active = null
    },
  },
})
