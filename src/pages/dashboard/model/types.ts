import type { AppIconName } from '@/shared/types/icon'

export type DashboardTabKey = 'today' | 'nutrition' | 'workouts' | 'progress' | 'photos'

export interface DashboardTab {
  key: DashboardTabKey
  label: string
  icon: AppIconName
}

export type NutritionView = 'diary' | 'products'

/** Шторка ввода, открытая поверх экрана. */
export type DashboardSheet = 'weight' | 'food'
