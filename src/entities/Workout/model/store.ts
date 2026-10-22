import { defineStore } from 'pinia'
import { supabase } from '@/shared/supabase'
import { readCache, writeCache } from '@/shared/lib/offlineCache'
import { isOfflineError } from '@/shared/lib/network'
import { deleteWithUndo } from '@/shared/lib/toast'
import { WORKOUT_TEMPLATES, exerciseNames, type WorkoutType } from '@/shared/config/workouts'
import { mapWorkout } from '../helpers/mapWorkout'
import type {
  Workout,
  WorkoutEntryInput,
  WorkoutRow,
  WorkoutSession,
  ExerciseProgress,
} from './types'

const assistNames = new Set(
  Object.values(WORKOUT_TEMPLATES)
    .flat()
    .filter((exercise) => exercise.assist)
    .map((exercise) => exercise.name),
)

/** Тренировка, сохранённая без интернета и ещё не отправленная в базу. */
interface QueuedSession {
  id: string
  date: string
  type: WorkoutType
  entries: WorkoutEntryInput[]
}

const QUEUE_KEY = 'workout-queue'
/** Префикс id у локальных (ещё не отправленных) записей. */
const LOCAL_ID_PREFIX = 'local-'

interface State {
  items: Workout[]
  /** Очередь на отправку — живёт и в localStorage, чтобы пережить закрытие приложения. */
  queue: QueuedSession[]
  loading: boolean
  error: string | null
}

function sameSlot(a: { date: string; type: WorkoutType | null; exercise: string }, b: typeof a): boolean {
  return a.date === b.date && a.type === b.type && a.exercise === b.exercise
}

function toRows(date: string, type: WorkoutType, entries: WorkoutEntryInput[]) {
  return entries.map((entry) => ({
    date,
    workout_type: type,
    exercise: entry.exercise,
    weight: entry.weight,
    sets: entry.sets,
    reps: entry.reps,
    next_weight: entry.nextWeight,
    next_sets: entry.nextSets,
    next_reps: entry.nextReps,
  }))
}

export const useWorkoutStore = defineStore('workout', {
  state: (): State => ({
    items: [],
    queue: readCache<QueuedSession[]>(QUEUE_KEY) ?? [],
    loading: false,
    error: null,
  }),

  getters: {
    /** Сколько тренировок ждут отправки в базу. */
    pendingCount: (state): number => state.queue.length,

    /** Сессия ещё не отправлена (сохранена офлайн). */
    isPendingSession(): (date: string, type: WorkoutType | null) => boolean {
      return (date, type) => this.queue.some((session) => session.date === date && session.type === type)
    },

    byDateDesc: (state): Workout[] => [...state.items].sort((a, b) => (a.date < b.date ? 1 : -1)),

    /** Сессии (дата + тип), свежие сверху, упражнения — в порядке шаблона. */
    sessions(): WorkoutSession[] {
      const map = new Map<string, Workout[]>()
      for (const item of this.items) {
        const key = `${item.date}|${item.type ?? ''}`
        const bucket = map.get(key) ?? []
        bucket.push(item)
        map.set(key, bucket)
      }

      const result: WorkoutSession[] = [...map.entries()].map(([key, entries]) => {
        const [date, typeRaw] = key.split('|')
        const type = (typeRaw || null) as WorkoutType | null
        const order = type ? exerciseNames(type) : []
        entries.sort((a, b) => order.indexOf(a.exercise) - order.indexOf(b.exercise))
        return { date, type, entries }
      })

      result.sort((a, b) => (a.date < b.date ? 1 : -1))
      return result
    },

    /** Тип, который логично тренировать следующим (чередование A/B). */
    suggestedType(): WorkoutType {
      const last = this.byDateDesc.find((item) => item.type != null)
      return last?.type === 'A' ? 'B' : 'A'
    },

    /** Последняя запись по упражнению (в любой тренировке A/B) до указанной даты. */
    lastEntryFor(): (exercise: string, beforeDate?: string) => Workout | null {
      return (exercise, beforeDate) => {
        const matches = this.items
          .filter((item) => item.exercise === exercise && (!beforeDate || item.date < beforeDate))
          .sort((a, b) => (a.date < b.date ? 1 : -1))
        return matches[0] ?? null
      }
    },

    /**
     * Прогресс по упражнению (вторая запись vs последняя): вес и тоннаж подхода.
     * Самая первая тренировка упражнения — входная (нащупываешь рабочий вес),
     * не показательна как база для сравнения, поэтому отсчёт от второй.
     * Гравитрон (assist) даёт только вес — тоннаж там не показателен (вес это помощь).
     */
    exerciseProgress(): ExerciseProgress[] {
      const byExercise = new Map<string, Workout[]>()
      for (const item of this.items) {
        if (item.weight == null) continue
        const arr = byExercise.get(item.exercise) ?? []
        arr.push(item)
        byExercise.set(item.exercise, arr)
      }

      const volumeOf = (item: Workout): number | null =>
        item.weight != null && item.sets != null && item.reps != null
          ? item.weight * item.sets * item.reps
          : null

      const result: ExerciseProgress[] = []
      for (const [name, entries] of byExercise) {
        if (entries.length < 3) continue
        entries.sort((a, b) => (a.date < b.date ? -1 : 1))
        const first = entries[1]
        const last = entries[entries.length - 1]
        const assist = assistNames.has(name)
        const firstVolume = volumeOf(first)
        const lastVolume = volumeOf(last)
        result.push({
          name,
          assist,
          weightDelta: last.weight! - first.weight!,
          volumeDelta: !assist && firstVolume != null && lastVolume != null
            ? Math.round(lastVolume - firstVolume)
            : null,
        })
      }
      return result
    },
  },

  actions: {
    async load() {
      this.loading = true
      this.error = null
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .order('date', { ascending: false })
      if (error) this.error = error.message
      else {
        this.items = (data as WorkoutRow[]).map(mapWorkout)
        // Неотправленные тренировки поверх серверных — иначе после загрузки они бы пропали из истории.
        for (const session of this.queue) this.applyLocally(session)
      }
      this.loading = false
    },

    /** Положить сессию в items как локальные записи (до подтверждения сервером). */
    applyLocally(session: QueuedSession) {
      for (const entry of session.entries) {
        const local: Workout = {
          id: `${LOCAL_ID_PREFIX}${session.id}-${entry.exercise}`,
          date: session.date,
          type: session.type,
          exercise: entry.exercise,
          weight: entry.weight,
          sets: entry.sets,
          reps: entry.reps,
          nextWeight: entry.nextWeight,
          nextSets: entry.nextSets,
          nextReps: entry.nextReps,
          note: null,
        }
        const index = this.items.findIndex((item) => sameSlot(item, local))
        if (index >= 0) this.items[index] = local
        else this.items.push(local)
      }
    },

    persistQueue() {
      writeCache(QUEUE_KEY, this.queue)
    },

    /**
     * Отправить накопленные офлайн тренировки. Останавливается на первой сетевой
     * ошибке (сети всё ещё нет) — остальное уйдёт при следующей попытке.
     */
    async flushQueue(): Promise<void> {
      while (this.queue.length) {
        const session = this.queue[0]
        const { data, error } = await supabase
          .from('workouts')
          .upsert(toRows(session.date, session.type, session.entries), {
            onConflict: 'user_id,date,workout_type,exercise',
          })
          .select()
        if (error) {
          if (!isOfflineError(error.message)) this.error = error.message
          return
        }
        this.queue.shift()
        this.persistQueue()
        this.replaceWithSaved((data as WorkoutRow[]).map(mapWorkout))
      }
    },

    replaceWithSaved(saved: Workout[]) {
      for (const row of saved) {
        const index = this.items.findIndex((item) => sameSlot(item, row))
        if (index >= 0) this.items[index] = row
        else this.items.push(row)
      }
    },

    /** Сохранить всю сессию (upsert по дата+тип+упражнение). */
    async saveSession(
      date: string,
      type: WorkoutType,
      entries: WorkoutEntryInput[],
    ): Promise<boolean> {
      this.error = null

      const queueLocally = () => {
        // Та же дата+тип уже ждёт отправки — заменяем, а не дублируем.
        this.queue = this.queue.filter((session) => !(session.date === date && session.type === type))
        const session: QueuedSession = { id: crypto.randomUUID(), date, type, entries }
        this.queue.push(session)
        this.persistQueue()
        this.applyLocally(session)
        return true
      }

      // Сети точно нет — не ждём таймаута, сразу кладём в очередь.
      if (typeof navigator !== 'undefined' && !navigator.onLine) return queueLocally()

      const { data, error } = await supabase
        .from('workouts')
        .upsert(toRows(date, type, entries), { onConflict: 'user_id,date,workout_type,exercise' })
        .select()

      if (error) {
        if (isOfflineError(error.message)) return queueLocally()
        this.error = error.message
        return false
      }

      this.replaceWithSaved((data as WorkoutRow[]).map(mapWorkout))
      return true
    },

    /** Удалить тренировку с возможностью отмены (5 с). Неотправленная — удаляется только из очереди. */
    removeSession(date: string, type: WorkoutType | null) {
      const matches = (entry: { date: string; type: WorkoutType | null }) => entry.date === date && entry.type === type
      const removedItems = this.items.filter(matches)
      const removedQueue = this.queue.filter(matches)
      const onlyLocal = removedItems.every((item) => item.id.startsWith(LOCAL_ID_PREFIX))

      deleteWithUndo({
        text: 'Тренировка удалена',
        apply: () => {
          this.items = this.items.filter((item) => !matches(item))
          this.queue = this.queue.filter((session) => !matches(session))
          this.persistQueue()
        },
        revert: () => {
          for (const item of removedItems) if (!this.items.some((entry) => entry.id === item.id)) this.items.push(item)
          for (const session of removedQueue) if (!this.queue.some((entry) => entry.id === session.id)) this.queue.push(session)
          this.persistQueue()
        },
        commit: async () => {
          if (onlyLocal) return true
          const query = supabase.from('workouts').delete().eq('date', date)
          const { error } = await (type === null ? query.is('workout_type', null) : query.eq('workout_type', type))
          if (error) this.error = error.message
          return !error
        },
      })
    },
  },
})
