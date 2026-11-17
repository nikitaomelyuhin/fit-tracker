import type { AppIconName } from '@/shared/types/icon'

export type DashboardTabKey = 'weight' | 'workouts' | 'nutrition' | 'photos' | 'analytics'

export interface DashboardTab {
  key: DashboardTabKey
  label: string
  icon: AppIconName
}

export type NutritionView = 'diary' | 'products'
