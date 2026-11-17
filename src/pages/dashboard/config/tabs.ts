import type { DashboardTab, NutritionView } from '../model/types'

export const DASHBOARD_TABS: DashboardTab[] = [
  { key: 'weight', label: 'Вес', icon: 'weight' },
  { key: 'workouts', label: 'Тренировки', icon: 'workouts' },
  { key: 'nutrition', label: 'Питание', icon: 'nutrition' },
  { key: 'photos', label: 'Фото', icon: 'photos' },
  { key: 'analytics', label: 'Аналитика', icon: 'analytics' },
]

export const NUTRITION_VIEWS: { key: NutritionView; label: string }[] = [
  { key: 'diary', label: 'Рацион' },
  { key: 'products', label: 'Продукты' },
]
