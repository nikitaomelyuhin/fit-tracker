import type { DashboardTab, NutritionView } from '../model/types'

export const DASHBOARD_TABS: DashboardTab[] = [
  { key: 'today', label: 'Сегодня', icon: 'today' },
  { key: 'nutrition', label: 'Питание', icon: 'nutrition' },
  { key: 'workouts', label: 'Тренировки', icon: 'workouts' },
  { key: 'progress', label: 'Прогресс', icon: 'analytics' },
  { key: 'photos', label: 'Фото', icon: 'photos' },
]

export const NUTRITION_VIEWS: { value: NutritionView; label: string }[] = [
  { value: 'diary', label: 'Рацион' },
  { value: 'products', label: 'Продукты' },
]
