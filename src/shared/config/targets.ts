export type TargetDirection = 'up' | 'down'

export interface MetricTarget {
  min: number
  max: number
  /** 'down' — хотим уменьшить (талия, жир); 'up' — увеличить (плечи, рука). */
  direction: TargetDirection
  /** Для «растущих» обхватов: см поправки на 1% жира сверх цели (оценка сухого обхвата). */
  fatCoef?: number
}

/** Целевые обхваты (см) из плана. */
export const MEASUREMENT_TARGETS = {
  waist: { min: 82, max: 84, direction: 'down' },
  shoulders: { min: 127, max: 132, direction: 'up', fatCoef: 0.1 },
  chest: { min: 108, max: 112, direction: 'up', fatCoef: 0.25 },
  arm: { min: 40, max: 42, direction: 'up', fatCoef: 0.2 },
  forearm: { min: 31, max: 33, direction: 'up', fatCoef: 0.08 },
} satisfies Record<string, MetricTarget>

/** Цель по проценту жира. */
export const BODY_FAT_TARGET: MetricTarget = { min: 12, max: 15, direction: 'down' }

/** Погрешность формулы жира (%), расширяет зону «близко». */
export const BODY_FAT_TOLERANCE = 2

/** Зона «близко» для обхватов (см). */
export const MEASUREMENT_TOLERANCE = 3
