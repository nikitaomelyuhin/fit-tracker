import { defineStore } from 'pinia'
import { useWeightLogStore } from '@/entities/WeightLog'
import { useWorkoutStore } from '@/entities/Workout'
import { useProductStore } from '@/entities/Product'
import { useDiaryEntryStore } from '@/entities/DiaryEntry'
import { useProgressPhotoStore } from '@/entities/ProgressPhoto'
import { useCheatDayStore } from '@/entities/CheatDay'

/** Через сколько после последней удачной загрузки данные считаются устаревшими при возврате во вкладку. */
const STALE_AFTER_MS = 30_000

interface State {
  loading: boolean
  /** Была ли хоть одна завершённая попытка — до неё показываем полноэкранный лоадер, а не пустые карточки. */
  loadedOnce: boolean
  lastSuccessAt: number
  error: string | null
}

let inFlight: Promise<void> | null = null

export const useDashboardSyncStore = defineStore('dashboardSync', {
  state: (): State => ({ loading: false, loadedOnce: false, lastSuccessAt: 0, error: null }),

  actions: {
    /** Грузит все данные дашборда. Параллельные вызовы склеиваются в один запрос. */
    loadAll(): Promise<void> {
      if (inFlight) return inFlight

      const stores = [
        useWeightLogStore(),
        useWorkoutStore(),
        useProductStore(),
        useDiaryEntryStore(),
        useProgressPhotoStore(),
        useCheatDayStore(),
      ]

      this.loading = true
      inFlight = Promise.all(stores.map((store) => store.load()))
        .then(() => {
          const failed = stores.some((store) => store.error)
          this.error = failed ? 'Не удалось загрузить данные — проблема с сетью или сервером.' : null
          if (!failed) this.lastSuccessAt = Date.now()
        })
        .finally(() => {
          this.loading = false
          this.loadedOnce = true
          inFlight = null
        })
      return inFlight
    },

    /** Перезагрузить, если данные старше STALE_AFTER_MS (или прошлая загрузка упала). */
    refreshIfStale(): Promise<void> | undefined {
      if (this.error || Date.now() - this.lastSuccessAt > STALE_AFTER_MS) return this.loadAll()
    },
  },
})
