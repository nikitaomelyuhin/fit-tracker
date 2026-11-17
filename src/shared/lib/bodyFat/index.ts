import { sumDeficitKcal } from '@/shared/lib/pace'
import { KCAL_PER_KG } from '@/shared/config/pace'
import { BODY_FAT_START_PCT } from '@/shared/config/profile'

/**
 * % жира не по замерам (их не ведём), а по пропорции: сколько жира должно было
 * уйти по дефициту калорий (дневник, а где его нет — fallbackKcal) с самого
 * первого взвешивания, вычитается из стартовой жировой массы (анкор
 * BODY_FAT_START_PCT). Так вес отдельно, жир отдельно — а не «весь сброшенный
 * вес = жир», что неверно из-за воды/мышц.
 */
export function estimateBodyFatPct(params: {
  startDate: string
  startWeight: number
  toDate: string
  /** Вес на дату toDate (не «сегодняшний сглаженный») — то, на что делится жировая масса. */
  weightAtTarget: number
  weightAt: (date: string) => number | null
  kcalAt: (date: string) => number | null
  fallbackKcal: number | null
}): number {
  const { totalDeficitKcal } = sumDeficitKcal({
    fromDate: params.startDate,
    toDate: params.toDate,
    weightAt: params.weightAt,
    kcalAt: params.kcalAt,
    fallbackKcal: params.fallbackKcal,
  })

  const fatLostKg = totalDeficitKcal / KCAL_PER_KG
  const startFatMassKg = params.startWeight * (BODY_FAT_START_PCT / 100)
  const currentFatMassKg = Math.max(0, startFatMassKg - fatLostKg)
  return Math.round((currentFatMassKg / params.weightAtTarget) * 1000) / 10
}
