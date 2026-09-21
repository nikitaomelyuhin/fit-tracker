import { defineStore } from 'pinia'
import { useWeightLogStore } from '@/entities/WeightLog'
import { useWorkoutStore } from '@/entities/Workout'
import { useProductStore } from '@/entities/Product'
import { useDiaryEntryStore } from '@/entities/DiaryEntry'
import { downloadJson } from '@/shared/lib/download'
import { todayISO } from '@/shared/lib/date'
import { AGE, HEIGHT_CM } from '@/shared/config/profile'
import { ACTIVITY_FACTOR, DAILY_KCAL_TARGET, KCAL_PER_KG, WATER_ADAPTATION_DAYS } from '@/shared/config/pace'
import { WEIGHT_GOAL_KG, WEIGHT_MILESTONES_KG } from '@/shared/config/goals'

export const useExportReportStore = defineStore('exportReport', {
  actions: {
    /** Собрать все данные (включая БД продуктов и рацион) — и для анализа, и как полный бэкап. */
    buildReport() {
      const weightLog = useWeightLogStore()
      const workouts = useWorkoutStore()
      const products = useProductStore()
      const diaryEntries = useDiaryEntryStore()

      // Недельные средние веса (среда → вторник) с разницей к прошлой неделе — главный показатель тренда.
      const weeklyAverages = weightLog.weeklyAverages

      // Отделяем стартовый слив воды/гликогена от жира — иначе темп в начале завышен.
      const cleanStart = weightLog.cleanStart
      // Реальное среднее из дневника питания, когда данных достаточно — иначе статичная цель.
      const effectiveKcal = diaryEntries.effectiveDailyKcal(DAILY_KCAL_TARGET)
      const pace = weightLog.paceVsPlan(effectiveKcal)

      const report = {
        exportedAt: new Date().toISOString(),
        app: 'fit-tracker',
        note: 'Отчёт для анализа прогресса.',
        profile: {
          heightCm: HEIGHT_CM,
          age: AGE,
          weightGoalKg: WEIGHT_GOAL_KG,
          weightMilestonesKg: WEIGHT_MILESTONES_KG,
          dailyKcalTarget: DAILY_KCAL_TARGET,
          activityFactor: ACTIVITY_FACTOR,
          kcalPerKgFat: KCAL_PER_KG,
          waterAdaptationDays: WATER_ADAPTATION_DAYS,
        },
        weight: {
          entries: weightLog.byDateAsc.map((entry) => ({
            date: entry.date,
            weightKg: entry.weight,
            note: entry.note,
          })),
          weeklyAverages,
        },
        // «Чистая» точка отсчёта (без стартового слива воды) и факт vs план от неё.
        cleanStart: cleanStart && {
          ready: cleanStart.ready,
          startDate: cleanStart.startDate,
          startWeightKg: cleanStart.startWeight,
          baselineDate: cleanStart.baselineDate,
          baselineWeightKg: cleanStart.baselineWeight,
          waterDropKg: Math.round(cleanStart.waterDropKg * 10) / 10,
          fatDropInWindowKg: Math.round(cleanStart.fatDropInWindowKg * 10) / 10,
          ratePerWeekKg: cleanStart.ratePerWeek != null ? Math.round(cleanStart.ratePerWeek * 100) / 100 : null,
        },
        paceVsPlan: pace && {
          usedDailyKcal: effectiveKcal,
          usedRealKcal: effectiveKcal !== DAILY_KCAL_TARGET,
          planDays: pace.planDays,
          planEtaDate: pace.planEtaDate,
          actualEtaDays: pace.actualEtaDays != null ? Math.round(pace.actualEtaDays) : null,
          actualEtaDate: pace.actualEtaDate,
          diffDays: pace.diffDays != null ? Math.round(pace.diffDays) : null,
        },
        workouts: {
          sessions: workouts.sessions.map((session) => ({
            date: session.date,
            type: session.type,
            exercises: session.entries.map((exercise) => ({
              exercise: exercise.exercise,
              weight: exercise.weight,
              sets: exercise.sets,
              reps: exercise.reps,
              nextWeight: exercise.nextWeight,
              nextSets: exercise.nextSets,
              nextReps: exercise.nextReps,
            })),
          })),
        },
        products: products.byNameAsc.map((product) => ({
          id: product.id,
          name: product.name,
          category: product.category,
          unit: product.unit,
          kcal: product.kcal,
          protein: product.protein,
          fat: product.fat,
          carbs: product.carbs,
          fiber: product.fiber,
        })),
        diary: {
          entries: diaryEntries.byDateDesc.map((entry) => ({
            date: entry.date,
            mealType: entry.mealType,
            productId: entry.productId,
            productName: entry.productName,
            amount: entry.amount,
            kcal: entry.kcal,
            protein: entry.protein,
            fat: entry.fat,
            carbs: entry.carbs,
            fiber: entry.fiber,
          })),
        },
      }

      return report
    },

    /** Собрать отчёт и скачать (для передачи на анализ или как бэкап). */
    download() {
      downloadJson(`fit-tracker-report-${todayISO()}.json`, this.buildReport())
    },
  },
})
