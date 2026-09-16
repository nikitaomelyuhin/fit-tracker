import { HEIGHT_CM, AGE } from '@/shared/config/profile'
import { ACTIVITY_FACTOR, KCAL_PER_KG, WATER_ADAPTATION_DAYS } from '@/shared/config/pace'
import { addDays, daysBetween } from '@/shared/lib/date'

export interface PacePoint {
  day: number
  weight: number
}

/** Точка отсчёта, очищенная от стартового слива воды. */
export interface CleanStart {
  /** Хватает ли данных после окна адаптации, чтобы считать темп по жиру. */
  ready: boolean
  /** Первое взвешивание. */
  startWeight: number
  startDate: string
  /** «Чистая» точка отсчёта — среднее первой недели после окна адаптации. */
  baselineWeight: number
  baselineDate: string
  /** Сколько из начального падения — вода/гликоген (кг). */
  waterDropKg: number
  /** Сколько из начального падения — жир (оценка по темпу после окна, кг). */
  fatDropInWindowKg: number
  /** Длина окна адаптации (дней). */
  windowDays: number
  /** Темп после окна адаптации (кг/нед, положительный = снижение). */
  ratePerWeek: number | null
}

/** Сравнение фактического темпа с планом от «чистой» точки отсчёта. */
export interface PaceVsPlan {
  /** Дней по плану от baseline до цели. */
  planDays: number
  planEtaDate: string
  /** Дней до цели по текущему темпу (от сегодня). */
  actualEtaDays: number | null
  actualEtaDate: string | null
  /** Отклонение в днях: >0 — отстаёшь, <0 — опережаешь. */
  diffDays: number | null
  ratePerWeek: number | null
}

interface WeightPoint {
  date: string
  weight: number
}

/** Поддерживающие калории для веса (Миффлин × активность). */
export function maintenanceKcal(weight: number): number {
  const bmr = 10 * weight + 6.25 * HEIGHT_CM - 5 * AGE + 5
  return bmr * ACTIVITY_FACTOR
}

export interface DeficitSumResult {
  totalDeficitKcal: number
  countedDays: number
}

/**
 * Дефицит калорий по дням (maintenance(вес) − факт) от fromDate до toDate включительно.
 * День без факта в дневнике пропускается (не считается нулём), если не передан
 * fallbackKcal — тогда вместо факта используется он (нужно для оценок, которые должны
 * покрывать весь период, а не только дни с дневником).
 */
export function sumDeficitKcal(params: {
  fromDate: string
  toDate: string
  weightAt: (date: string) => number | null
  kcalAt: (date: string) => number | null
  fallbackKcal?: number | null
  maxDays?: number
}): DeficitSumResult {
  const { fromDate, toDate, weightAt, kcalAt, fallbackKcal = null, maxDays = 400 } = params

  let totalDeficitKcal = 0
  let countedDays = 0
  let cursor = fromDate
  let guard = 0
  while (cursor <= toDate && guard < maxDays) {
    const kcal = kcalAt(cursor) ?? fallbackKcal
    if (kcal != null) {
      const weight = weightAt(cursor)
      if (weight != null) {
        totalDeficitKcal += maintenanceKcal(weight) - kcal
        countedDays++
      }
    }
    cursor = addDays(cursor, 1)
    guard++
  }

  return { totalDeficitKcal, countedDays }
}

/**
 * Симуляция идеального снижения при фиксированном потреблении.
 * По дням: расход падает с весом, дефицит сужается — кривая замедляется.
 */
export function projectIdealPace(
  startWeight: number,
  goalWeight: number,
  dailyKcal: number,
  maxDays = 800,
): PacePoint[] {
  const points: PacePoint[] = [{ day: 0, weight: startWeight }]
  let weight = startWeight

  for (let day = 1; day <= maxDays; day++) {
    const deficit = maintenanceKcal(weight) - dailyKcal
    if (deficit <= 0) break // достигнуто равновесие раньше цели
    weight -= deficit / KCAL_PER_KG
    if (weight <= goalWeight) {
      points.push({ day, weight: goalWeight })
      break
    }
    points.push({ day, weight })
  }

  return points
}

/** Сколько дней по плану от веса до цели. */
export function idealDaysTo(startWeight: number, goalWeight: number, dailyKcal: number): number {
  const points = projectIdealPace(startWeight, goalWeight, dailyKcal)
  return points.length ? points[points.length - 1].day : 0
}

function averageOf(points: WeightPoint[]): number {
  const sum = points.reduce((acc, point) => acc + point.weight, 0)
  return Math.round((sum / points.length) * 10) / 10
}

/**
 * Отделяет стартовый слив воды от жира.
 *
 * Факт: за первые ~1–1.5 недели дефицита уходит гликоген и связанная вода —
 * это реальные килограммы на весах, но не жир. Если считать темп от первого
 * взвешивания, он оказывается завышен, и прогноз «до цели» врёт в оптимизм.
 *
 * Метод: за точку отсчёта берём среднее первой недели ПОСЛЕ окна адаптации.
 * Темп после окна — это темп по жиру; умножив его на длину окна, получаем
 * оценку жира, ушедшего внутри окна. Остаток начального падения — вода.
 *
 * @param entries взвешивания по возрастанию даты
 * @param currentWeight текущий сглаженный вес (недельное среднее)
 */
export function computeCleanStart(
  entries: WeightPoint[],
  currentWeight: number | null,
  windowDays = WATER_ADAPTATION_DAYS,
): CleanStart | null {
  if (!entries.length) return null

  const startDate = entries[0].date
  const startWeight = entries[0].weight
  const baselineDate = addDays(startDate, windowDays)
  const clean = entries.filter((entry) => entry.date >= baselineDate)

  const notReady: CleanStart = {
    ready: false,
    startWeight,
    startDate,
    baselineWeight: startWeight,
    baselineDate,
    waterDropKg: 0,
    fatDropInWindowKg: 0,
    windowDays,
    ratePerWeek: null,
  }

  if (!clean.length) return notReady

  const firstCleanWeek = clean.filter((entry) => entry.date <= addDays(baselineDate, 6))
  const baselineWeight = averageOf(firstCleanWeek.length ? firstCleanWeek : clean.slice(0, 3))
  const lastCleanDate = clean[clean.length - 1].date
  const cleanDays = daysBetween(baselineDate, lastCleanDate)

  // Меньше двух недель после окна — темп по жиру ещё не отличим от шума.
  if (currentWeight == null || cleanDays < 14) {
    return { ...notReady, baselineWeight }
  }

  const ratePerDay = (baselineWeight - currentWeight) / cleanDays
  const fatDropInWindowKg = Math.max(0, ratePerDay) * windowDays
  const initialDrop = startWeight - baselineWeight

  return {
    ready: true,
    startWeight,
    startDate,
    baselineWeight,
    baselineDate,
    waterDropKg: Math.max(0, initialDrop - fatDropInWindowKg),
    fatDropInWindowKg,
    windowDays,
    ratePerWeek: ratePerDay * 7,
  }
}

/**
 * Сравнивает факт с планом, отсчитывая план от «чистой» точки.
 * Иначе бонус от слива воды приписывается темпу и даёт фиктивный отрыв от плана.
 */
export function comparePaceWithPlan(params: {
  cleanStart: CleanStart
  currentWeight: number | null
  today: string
  goalWeight: number
  dailyKcal: number
}): PaceVsPlan {
  const { cleanStart, currentWeight, today, goalWeight, dailyKcal } = params

  const planDays = idealDaysTo(cleanStart.baselineWeight, goalWeight, dailyKcal)
  const planEtaDate = addDays(cleanStart.baselineDate, planDays)
  const ratePerWeek = cleanStart.ratePerWeek

  if (!cleanStart.ready || ratePerWeek == null || ratePerWeek <= 0 || currentWeight == null) {
    return {
      planDays,
      planEtaDate,
      actualEtaDays: null,
      actualEtaDate: null,
      diffDays: null,
      ratePerWeek,
    }
  }

  const actualEtaDays = Math.max(0, (currentWeight - goalWeight) / (ratePerWeek / 7))
  const actualEtaDate = addDays(today, Math.round(actualEtaDays))

  return {
    planDays,
    planEtaDate,
    actualEtaDays,
    actualEtaDate,
    diffDays: daysBetween(planEtaDate, actualEtaDate),
    ratePerWeek,
  }
}
