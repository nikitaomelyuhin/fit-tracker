import { sumDeficitKcal } from '@/shared/lib/pace'
import { KCAL_PER_KG } from '@/shared/config/pace'
import { todayISO } from '@/shared/lib/date'

export interface WaterDebt {
  loggedDays: number
  expectedFatLossKg: number
  actualLossKg: number | null
  debtKg: number | null
}

/**
 * «Долг по воде» — разница между тем, сколько жира должно было уйти по калориям
 * (дневник) и сколько реально ушло по весам. Положительный долг — организм
 * придерживает воду, отрицательный — весы обгоняют калории.
 */
export function computeWaterDebt(params: {
  fromDate: string
  startWeight: number | null
  currentWeight: number | null
  weightAt: (date: string) => number | null
  kcalAt: (date: string) => number | null
}): WaterDebt | null {
  const { fromDate, startWeight, currentWeight, weightAt, kcalAt } = params

  const { totalDeficitKcal, countedDays } = sumDeficitKcal({
    fromDate,
    toDate: todayISO(),
    weightAt: (date) => weightAt(date) ?? currentWeight,
    kcalAt,
  })
  if (countedDays === 0) return null

  const expectedFatLossKg = totalDeficitKcal / KCAL_PER_KG
  const actualLossKg =
    startWeight != null && currentWeight != null ? startWeight - currentWeight : null
  const debtKg = actualLossKg != null ? expectedFatLossKg - actualLossKg : null

  return { loggedDays: countedDays, expectedFatLossKg, actualLossKg, debtKg }
}

export type WaterDebtTone = 'good' | 'warn' | 'muted'

/** Короткая формулировка долга — одна и та же фраза везде, где он показывается. */
export function describeWaterDebt(debt: WaterDebt | null): { text: string; tone: WaterDebtTone } {
  if (!debt) return { text: 'Мало данных — веди дневник и вес ещё пару дней.', tone: 'muted' }

  if (debt.debtKg == null) {
    const grams = Math.round(debt.expectedFatLossKg * 1000)
    return {
      text: `По калориям должно было уйти ~${grams} г жира — вес пока сравнить не с чем.`,
      tone: 'muted',
    }
  }

  const grams = Math.round(debt.debtKg * 1000)
  if (Math.abs(grams) < 150) return { text: 'Долгов нет — весы и калории сходятся.', tone: 'muted' }
  if (grams > 0) {
    return {
      text: `Организм придерживает примерно ${grams} г воды — по калориям должно было уйти больше.`,
      tone: 'warn',
    }
  }
  return {
    text: `Весы обогнали калории примерно на ${Math.abs(grams)} г — реальный расход, похоже, выше расчётного.`,
    tone: 'good',
  }
}
