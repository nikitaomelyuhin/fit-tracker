import { describe, expect, it } from 'vitest'
import { estimateBodyFatPct, projectBodyFatPct } from './index'
import { maintenanceKcal } from '@/shared/lib/pace'
import { BODY_FAT_START_PCT } from '@/shared/config/profile'

describe('estimateBodyFatPct', () => {
  it('вычитает из стартовой жировой массы жир, ушедший по дефициту', () => {
    // Старт 100 кг × BODY_FAT_START_PCT. 7 дней по дефициту 1100 ккал = 7700 ккал = 1 кг жира.
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
    // (стартовый жир − 1 кг) на 98 кг веса
    expect(pct).toBeCloseTo(((BODY_FAT_START_PCT - 1) / 98) * 100, 1)
  })
})

describe('projectBodyFatPct', () => {
  it('снимает с жировой массы заданную долю будущего сброса', () => {
    // 100 кг × 25% = 25 кг жира. До 90 кг: −10 кг, из них 80% жир = −8 кг → 17 кг на 90 кг.
    expect(
      projectBodyFatPct({ currentWeight: 100, currentFatPct: 25, targetWeight: 90, fatShare: 0.8 }),
    ).toBeCloseTo(18.9, 1)
  })

  it('на текущем весе — текущий процент', () => {
    expect(
      projectBodyFatPct({ currentWeight: 98.9, currentFatPct: 23.5, targetWeight: 98.9, fatShare: 0.85 }),
    ).toBe(23.5)
  })
})
