import { defineStore } from 'pinia'
import { useWeightLogStore } from '@/entities/WeightLog'
import { useMeasurementStore } from '@/entities/Measurement'
import { useWorkoutStore } from '@/entities/Workout'
import { estimateBodyFatMale } from '@/shared/lib/bodyfat'
import { downloadJson } from '@/shared/lib/download'
import { todayISO, weekStartFor } from '@/shared/lib/date'
import { AGE, HEIGHT_CM } from '@/shared/config/profile'
import { ACTIVITY_FACTOR, DAILY_KCAL_TARGET, KCAL_PER_KG } from '@/shared/config/pace'
import { WEIGHT_GOAL_KG, WEIGHT_MILESTONES_KG } from '@/shared/config/goals'
import { BODY_FAT_TARGET, MEASUREMENT_TARGETS } from '@/shared/config/targets'

export const useExportReportStore = defineStore('exportReport', {
  actions: {
    /** Собрать все данные в один JSON-отчёт и скачать (для передачи на анализ). */
    download() {
      const weightLog = useWeightLogStore()
      const measurements = useMeasurementStore()
      const workouts = useWorkoutStore()

      // Недельные средние веса (среда → вторник) — главный показатель тренда.
      const buckets = new Map<string, { total: number; count: number }>()
      for (const row of weightLog.byDateAsc) {
        const key = weekStartFor(row.date)
        const bucket = buckets.get(key) ?? { total: 0, count: 0 }
        bucket.total += row.weight
        bucket.count += 1
        buckets.set(key, bucket)
      }
      const weeklyAverages = [...buckets.entries()]
        .sort((a, b) => (a[0] > b[0] ? 1 : -1))
        .map(([weekStart, bucket]) => ({
          weekStart,
          averageKg: Math.round((bucket.total / bucket.count) * 10) / 10,
          entries: bucket.count,
        }))

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
