import { defineStore } from 'pinia'
import { useWeightLogStore } from '@/entities/WeightLog'
import { useMeasurementStore } from '@/entities/Measurement'
import { useWorkoutStore } from '@/entities/Workout'
import { estimateBodyFatMale } from '@/shared/lib/bodyfat'
import { downloadJson } from '@/shared/lib/download'
import { todayISO } from '@/shared/lib/date'
import { AGE, HEIGHT_CM } from '@/shared/config/profile'
import { ACTIVITY_FACTOR, DAILY_KCAL_TARGET, KCAL_PER_KG, WATER_ADAPTATION_DAYS } from '@/shared/config/pace'
import { WEIGHT_GOAL_KG, WEIGHT_MILESTONES_KG } from '@/shared/config/goals'
import { BODY_FAT_TARGET, MEASUREMENT_TARGETS } from '@/shared/config/targets'

export const useExportReportStore = defineStore('exportReport', {
  actions: {
    /** Собрать все данные в один JSON-отчёт и скачать (для передачи на анализ). */
    download() {
      const weightLog = useWeightLogStore()
      const measurements = useMeasurementStore()
      const workouts = useWorkoutStore()

      // Недельные средние веса (среда → вторник) с разницей к прошлой неделе — главный показатель тренда.
      const weeklyAverages = weightLog.weeklyAverages

      // Отделяем стартовый слив воды/гликогена от жира — иначе темп в начале завышен.
      const cleanStart = weightLog.cleanStart
      const pace = weightLog.paceVsPlan

      const report = {
        exportedAt: new Date().toISOString(),
        app: 'fit-tracker',
        note: 'Отчёт для анализа прогресса. Процент жира оценивается по талии и росту (RFM).',
        profile: {
          heightCm: HEIGHT_CM,
          age: AGE,
          weightGoalKg: WEIGHT_GOAL_KG,
          weightMilestonesKg: WEIGHT_MILESTONES_KG,
          dailyKcalTarget: DAILY_KCAL_TARGET,
          activityFactor: ACTIVITY_FACTOR,
          kcalPerKgFat: KCAL_PER_KG,
          bodyFatFormula:
            'Оценка по талии и росту (RFM), привязана к точке отсчёта: талия 108 см = 28.5%. Шея и вес в расчёте не участвуют.',
          waterAdaptationDays: WATER_ADAPTATION_DAYS,
        },
        targets: {
          bodyFatPct: BODY_FAT_TARGET,
          measurements: MEASUREMENT_TARGETS,
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
          planDays: pace.planDays,
          planEtaDate: pace.planEtaDate,
          actualEtaDays: pace.actualEtaDays != null ? Math.round(pace.actualEtaDays) : null,
          actualEtaDate: pace.actualEtaDate,
          diffDays: pace.diffDays != null ? Math.round(pace.diffDays) : null,
        },
        measurements: {
          entries: measurements.byDateAsc.map((entry) => ({
            date: entry.date,
            waist: entry.waist,
            chest: entry.chest,
            shoulders: entry.shoulders,
            arm: entry.arm,
            forearm: entry.forearm,
            estimatedBodyFatPct:
              entry.waist != null ? estimateBodyFatMale(entry.waist, HEIGHT_CM) : null,
            note: entry.note,
          })),
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
      }

      downloadJson(`fit-tracker-report-${todayISO()}.json`, report)
    },
  },
})
