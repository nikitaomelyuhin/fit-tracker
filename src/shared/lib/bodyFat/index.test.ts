import { describe, expect, it } from 'vitest'
import { estimateBodyFatPct } from './index'
import { maintenanceKcal } from '@/shared/lib/pace'

describe('estimateBodyFatPct', () => {
  it('вычитает из стартовой жировой массы жир, ушедший по дефициту', () => {
    // Старт 100 кг × 28% = 28 кг жира. 7 дней по дефициту 1100 ккал = 7700 ккал = 1 кг жира.
    const kcal = maintenanceKcal(100) - 1100
    const pct = estimateBodyFatPct({
      startDate: '2026-10-01',
      startWeight: 100,
      toDate: '2026-10-07',
      weightAtTarget: 98,
      weightAt: () => 100,
      kcalAt: () => kcal,
      fallbackKcal: null,
    })
    // 27 кг жира на 98 кг веса
    expect(pct).toBeCloseTo(27.6, 1)
  })
})
