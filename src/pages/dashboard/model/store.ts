import { watch } from 'vue'
import { defineStore } from 'pinia'
import { useWeightLogStore, type WeightLog } from '@/entities/WeightLog'
import { useWorkoutStore, type Workout } from '@/entities/Workout'
import { useProductStore, type Product } from '@/entities/Product'
import { useDiaryEntryStore, type DiaryEntry } from '@/entities/DiaryEntry'
import { useProgressPhotoStore } from '@/entities/ProgressPhoto'
import { useCheatDayStore, type CheatDay } from '@/entities/CheatDay'
import { readCache, writeCache } from '@/shared/lib/offlineCache'
import { isOfflineError } from '@/shared/lib/network'

/** Через сколько после последней удачной загрузки данные считаются устаревшими при возврате во вкладку. */
const STALE_AFTER_MS = 30_000

interface State {
  loading: boolean
  /** Есть что показать (загрузилось с сервера или из локальной копии) — до этого полноэкранный лоадер. */
  loadedOnce: boolean
  lastSuccessAt: number
  error: string | null
}

let inFlight: Promise<void> | null = null
let cacheBound = false

/**
 * Локальная копия данных: при старте сразу показываем последнее сохранённое (в т.ч.
 * без интернета), а любые изменения в сторах тут же пишем обратно. Фото не кэшируем —
 * у них временные ссылки, без сети картинки всё равно не загрузятся.
 */
function bindLocalCache(): boolean {
  const weightLog = useWeightLogStore()
  const workouts = useWorkoutStore()
  const products = useProductStore()
  const diary = useDiaryEntryStore()
  const cheatDays = useCheatDayStore()

  const cachedWeight = readCache<WeightLog[]>('weight')
  const cachedWorkouts = readCache<Workout[]>('workouts')
  const cachedProducts = readCache<Product[]>('products')
  const cachedDiary = readCache<DiaryEntry[]>('diary')
  const cachedCheatDays = readCache<CheatDay[]>('cheat-days')

  if (cachedWeight && !weightLog.items.length) weightLog.items = cachedWeight
  if (cachedWorkouts && !workouts.items.length) workouts.items = cachedWorkouts
  if (cachedProducts && !products.items.length) products.items = cachedProducts
  if (cachedDiary && !diary.items.length) diary.items = cachedDiary
  if (cachedCheatDays && !cheatDays.items.length) cheatDays.items = cachedCheatDays

  watch(() => weightLog.items, (items) => writeCache('weight', items), { deep: true })
  watch(() => workouts.items, (items) => writeCache('workouts', items), { deep: true })
  watch(() => products.items, (items) => writeCache('products', items), { deep: true })
  watch(() => diary.items, (items) => writeCache('diary', items), { deep: true })
  watch(() => cheatDays.items, (items) => writeCache('cheat-days', items), { deep: true })

  return Boolean(cachedWeight || cachedWorkouts || cachedDiary)
}

export const useDashboardSyncStore = defineStore('dashboardSync', {
  state: (): State => ({ loading: false, loadedOnce: false, lastSuccessAt: 0, error: null }),

  actions: {
    /**
     * Отправляет накопленное офлайн и грузит все данные дашборда.
     * Параллельные вызовы склеиваются в один запрос.
     */
    loadAll(): Promise<void> {
      if (inFlight) return inFlight

      if (!cacheBound) {
        cacheBound = true
        if (bindLocalCache()) this.loadedOnce = true
      }

      const workouts = useWorkoutStore()
      const stores = [
        useWeightLogStore(),
        workouts,
        useProductStore(),
        useDiaryEntryStore(),
        useProgressPhotoStore(),
        useCheatDayStore(),
      ]

      this.loading = true
      inFlight = workouts
        .flushQueue()
        .then(() => Promise.all(stores.map((store) => store.load())))
        .then(() => {
          const errors = stores.map((store) => store.error).filter((error): error is string => Boolean(error))
          if (!errors.length) {
            this.error = null
            this.lastSuccessAt = Date.now()
          } else if (errors.every((error) => isOfflineError(error))) {
            this.error = 'Нет интернета — показаны последние сохранённые данные.'
          } else {
            this.error = 'Не удалось загрузить данные — проблема с сетью или сервером.'
          }
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
