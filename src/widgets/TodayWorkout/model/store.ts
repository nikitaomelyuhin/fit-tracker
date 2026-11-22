import { defineStore } from 'pinia'
import { useWorkoutStore, type WorkoutSession } from '@/entities/Workout'
import { daysBetween } from '@/shared/lib/date'
import { today } from '@/shared/lib/today'

/** Тренировка на экране «Сегодня»: была ли сегодня и когда была прошлая. */
export const useTodayWorkoutStore = defineStore('todayWorkout', {
  getters: {
    todaySession: (): WorkoutSession | null => useWorkoutStore().sessionFor(today.value),

    lastSession: (): WorkoutSession | null =>
      useWorkoutStore().sessions.find((session) => session.date < today.value) ?? null,

    daysSinceLast(): number | null {
      return this.lastSession ? daysBetween(this.lastSession.date, today.value) : null
    },
  },
})
