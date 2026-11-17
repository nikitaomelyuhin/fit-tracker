import { defineStore } from 'pinia'
import { useWeightLogStore, type WeightLog } from '@/entities/WeightLog'
import { today } from '@/shared/lib/today'

/** Вес на экране «Сегодня»: взвесился ли, среднее за неделю, стрик. */
export const useTodayWeightStore = defineStore('todayWeight', {
  getters: {
    todayEntry: (): WeightLog | null =>
      useWeightLogStore().byDateDesc.find((item) => item.date === today.value) ?? null,

    latest: (): WeightLog | null => useWeightLogStore().byDateDesc[0] ?? null,

    weekAverage: (): number | null => useWeightLogStore().currentWeekAverage,

    weekDelta: (): number | null => useWeightLogStore().weekOverWeekDeltaKg,

    streak: (): number => useWeightLogStore().currentStreak,

    bestStreak: (): number => useWeightLogStore().bestStreak,
  },
})
